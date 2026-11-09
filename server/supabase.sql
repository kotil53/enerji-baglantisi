-- Enerji Bağlantısı dünya sıralaması (Supabase / PostgreSQL)
-- Kurulum: Supabase projesinde (Yörünge ile aynı "yorunge" projesi kullanılabilir; tablolar ve fonksiyonlar
-- "enerji_" önekli, Yörünge'ninkilere dokunmaz) SQL Editor'e yapıştır ve bir kez çalıştır. Tekrar çalıştırmak güvenli.
--
-- Güvenlik modeli (Yörünge ile aynı desen):
--   * Tabloya istemciden doğrudan erişim yok (RLS açık, politika yok, yetkiler geri alındı).
--   * İstemci yalnızca üç fonksiyonu çağırır: enerji_submit_score, enerji_top_scores, enerji_my_rank.
--   * Her cihaz rastgele bir kimlik (id) ve gizli anahtar (secret) üretir; sunucu yalnızca anahtarın
--     SHA-256 özetini saklar. Bir satırı yalnızca anahtarın sahibi güncelleyebilir.
--   * Yeni oyuncu kaydı IP başına saatte 5 ile sınırlı (enerji_new_player_log, IP'nin yalnız özeti, 1 saat).
--   * Puan BİRİKİMLİDİR (oyundaki toplam puan) ve yalnız artar. İstemcide hesaplandığı için hile tamamen
--     engellenemez; sınırlar: ilk kayıt en çok 500.000, sonraki her gönderimde artış en çok
--     20.000 + geçen her saniye için 90 (bir seviye en çok ~900 puan, 10 sn'den hızlı çözülmesi olanaksız).
--     Sorun çıkarsa elle silme: delete from public.enerji_players where name = '...';

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.enerji_players (
  id          uuid primary key,
  secret_hash text not null,
  name        text not null,
  score       int  not null default 0 check (score >= 0),
  level       int  not null default 0 check (level >= 0),
  updated_at  timestamptz not null default now()
);
create unique index if not exists enerji_players_name_key on public.enerji_players (lower(name));
create index if not exists enerji_players_score_idx on public.enerji_players (score desc, updated_at asc);

alter table public.enerji_players enable row level security;
revoke all on public.enerji_players from anon, authenticated;

create table if not exists public.enerji_new_player_log (
  ip_hash text not null,
  at      timestamptz not null default now()
);
create index if not exists enerji_new_player_log_idx on public.enerji_new_player_log (ip_hash, at);
alter table public.enerji_new_player_log enable row level security;
revoke all on public.enerji_new_player_log from anon, authenticated;

-- Küfür denetimi için sadeleştirme: küçük harf, sayı-harf oyunları (0→o 1→i 3→e 4→a 5→s 7→t 8→b), Türkçe harfler
-- düz Latin'e, harf dışı her şey atılır, tekrarlanan harf teke iner. "S.1.k  t1iiir" -> "siktir"
create or replace function public.enerji_norm(p text) returns text
language sql immutable as $$
  select regexp_replace(
           regexp_replace(translate(lower(p), '0134578ışğüöç', 'oieastbisguoc'), '[^a-z]', '', 'g'),
           '(.)\1+', '\1', 'g');
$$;

-- Takma ad kuralı: 3–16 karakter; harf (Türkçe dahil), rakam, boşluk, _ . -; baş/son boşluk yok; küfür listesi.
--   * uzun / belirgin terimler adın HER YERİNDE aranır;
--   * kısa terimler yalnız ad (ya da adın bir parçası) tam olarak o kelimeyse engellenir ("amin" -> Benjamin kesilmesin).
create or replace function public.enerji_name_ok(p text) returns boolean
language sql immutable as $$
  with n as (select public.enerji_norm(p) as j)
  select p ~ '^[A-Za-z0-9ÇĞİÖŞÜçğıöşü_. -]{3,16}$'
     and p = btrim(p)
     and p !~ '  '
     and not exists (
       select 1 from n, unnest(array[
         -- Türkçe
         'orospu', 'orosbu', 'orspu', 'siktir', 'sikerim', 'sikeyim', 'sikiyim', 'sikik', 'sikis', 'sikim',
         'amcik', 'amcig', 'aminako', 'aminiz', 'yarak', 'yarag', 'tasak', 'pezeven', 'kahpe', 'kaltak', 'surtuk',
         'fahise', 'yavsak', 'gavat', 'kerhane', 'ibne', 'pust', 'serefsiz', 'gotveren', 'gotlek', 'sapik', 'kancik',
         'dangalak', 'gerizekal', 'salak', 'aptal',
         -- İngilizce (tekrarlı harfler tek: pussy -> pusy, faggot -> fagot)
         'fuck', 'fck', 'shit', 'bitch', 'cunt', 'whore', 'slut', 'pusy', 'fagot', 'porn', 'hitler', 'niger',
         -- İspanyolca
         'puta', 'mierda', 'cabron', 'pendej', 'verga', 'culero', 'marica',
         -- kimliğe bürünme
         'admin', 'moderat', 'kotil'
       ]) w
       where n.j like '%' || w || '%'
     )
     and not exists (
       select 1 from n
         cross join lateral (select public.enerji_norm(x) as t from regexp_split_to_table(p, '[ _.-]+') x
                             union all select n.j) tok
         cross join unnest(array['amk', 'aq', 'got', 'sik', 'pic', 'oc', 'mal', 'dick', 'cock', 'fag', 'sex', 'rape',
                      'nazi', 'niga', 'nigas', 'ass', 'polla', 'coño', 'cono']) w
       where tok.t = w
     );
$$;

-- Puan gönder / adı güncelle. Dönüş: {"ok": true, "rank": n} ya da {"ok": false, "err": "name|taken|owner|rate|range|secret"}
create or replace function public.enerji_submit_score(p_id uuid, p_secret text, p_name text, p_score int, p_level int)
returns json
language plpgsql security definer set search_path = public as $$
declare
  h   text := encode(extensions.digest(coalesce(p_secret, ''), 'sha256'), 'hex');
  r   public.enerji_players;
  has boolean;
  ip  text;
begin
  if p_id is null or length(coalesce(p_secret, '')) < 32 then return json_build_object('ok', false, 'err', 'secret'); end if;
  p_name := btrim(coalesce(p_name, ''));
  if not public.enerji_name_ok(p_name) then return json_build_object('ok', false, 'err', 'name'); end if;
  if p_score is null or p_score < 0 or p_score > 50000000 or p_level is null or p_level < 0 or p_level > 100000 then
    return json_build_object('ok', false, 'err', 'range');
  end if;

  select * into r from public.enerji_players where id = p_id for update;
  has := found;
  if has then
    if r.secret_hash <> h then return json_build_object('ok', false, 'err', 'owner'); end if;
    if r.updated_at > now() - interval '3 seconds' then return json_build_object('ok', false, 'err', 'rate'); end if;
    if p_score - r.score > 20000 + 90 * extract(epoch from now() - r.updated_at) then
      return json_build_object('ok', false, 'err', 'range');
    end if;
  elsif p_score > 500000 then
    return json_build_object('ok', false, 'err', 'range');
  end if;
  if exists (select 1 from public.enerji_players where lower(name) = lower(p_name) and id <> p_id) then
    return json_build_object('ok', false, 'err', 'taken');
  end if;

  if not has then
    -- PostgREST istek başlıkları; ilk adres istemcinin IP'si
    ip := btrim(split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1));
    if ip <> '' then
      ip := encode(extensions.digest(ip, 'sha256'), 'hex');
      delete from public.enerji_new_player_log where at < now() - interval '1 hour';
      if (select count(*) from public.enerji_new_player_log where ip_hash = ip) >= 5 then
        return json_build_object('ok', false, 'err', 'rate');
      end if;
      insert into public.enerji_new_player_log (ip_hash) values (ip);
    end if;
  end if;

  begin
    if has then
      update public.enerji_players
         set name = p_name,
             score = greatest(score, p_score),
             level = greatest(level, p_level),
             updated_at = now()
       where id = p_id;
    else
      insert into public.enerji_players (id, secret_hash, name, score, level) values (p_id, h, p_name, p_score, p_level);
    end if;
  exception when unique_violation then
    return json_build_object('ok', false, 'err', 'taken');
  end;

  return json_build_object('ok', true, 'rank',
    (select count(*) + 1 from public.enerji_players q where q.score > (select score from public.enerji_players where id = p_id)));
end $$;

-- İlk N oyuncu (en çok 100). Eşit puanda önce ulaşan üstte; sıra numarası eşitlerde aynı.
create or replace function public.enerji_top_scores(p_limit int default 50)
returns table (rank bigint, name text, score int, level int)
language sql stable security definer set search_path = public as $$
  select rank() over (order by p.score desc), p.name, p.score, p.level
    from public.enerji_players p
   where p.score > 0
   order by p.score desc, p.updated_at asc
   limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- Bu cihazın satırı ve sırası (listede görünmese de)
create or replace function public.enerji_my_rank(p_id uuid)
returns table (rank bigint, name text, score int, level int)
language sql stable security definer set search_path = public as $$
  select (select count(*) + 1 from public.enerji_players q where q.score > p.score), p.name, p.score, p.level
    from public.enerji_players p where p.id = p_id;
$$;

revoke all on function public.enerji_submit_score(uuid, text, text, int, int) from public;
revoke all on function public.enerji_top_scores(int) from public;
revoke all on function public.enerji_my_rank(uuid) from public;
revoke all on function public.enerji_norm(text) from public;
revoke all on function public.enerji_name_ok(text) from public;
grant execute on function public.enerji_submit_score(uuid, text, text, int, int) to anon, authenticated;
grant execute on function public.enerji_top_scores(int) to anon, authenticated;
grant execute on function public.enerji_my_rank(uuid) to anon, authenticated;
