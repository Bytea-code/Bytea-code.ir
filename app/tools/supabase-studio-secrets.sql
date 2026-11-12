-- جدول رازهای استودیو (کلید گیت‌هاب و مانند آن)
-- یک‌بار در Supabase SQL Editor اجرا کنید.
-- هیچ فایلی از کلید در مخزن/گیت‌هاب پیجز وجود ندارد؛ فقط نشستِ مدیر می‌تواند بخواند/بنویسد.
create table if not exists public.studio_secrets (
    key text primary key,
    value text not null,
    updated_at timestamptz not null default now()
);

alter table public.studio_secrets enable row level security;

drop policy if exists "studio_secrets_admin_select" on public.studio_secrets;
drop policy if exists "studio_secrets_admin_insert" on public.studio_secrets;
drop policy if exists "studio_secrets_admin_update" on public.studio_secrets;
drop policy if exists "studio_secrets_admin_delete" on public.studio_secrets;

create policy "studio_secrets_admin_select" on public.studio_secrets
    for select using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );

create policy "studio_secrets_admin_insert" on public.studio_secrets
    for insert with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );

create policy "studio_secrets_admin_update" on public.studio_secrets
    for update using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    ) with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );

create policy "studio_secrets_admin_delete" on public.studio_secrets
    for delete using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );

-- ============================================================
-- profiles: خواندن برای همهٔ authenticated؛ نوشتن فقط برای ادمین
-- آپدیت هم فقط روی ستون‌های نقش/مسئولیت (role, job_title)
-- ============================================================
alter table public.profiles enable row level security;

-- پاک‌سازی policyهای قبلی تا اجرای دوبارهٔ این فایل بی‌خطر بماند
do $$
declare p record;
begin
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
        execute format('drop policy %I on public.profiles', p.policyname);
    end loop;
end $$;

create policy profiles_select_authenticated on public.profiles
    for select to authenticated using (true);

create policy profiles_insert_admin on public.profiles
    for insert to authenticated
    with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );

create policy profiles_update_admin on public.profiles
    for update to authenticated
    using (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
    with check (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );

-- دسترسی‌های نوشتنِ پیش‌فرضِ سوپابیس گرفته می‌شود
revoke insert, update, delete on public.profiles from anon;
revoke update, delete on public.profiles from authenticated;

-- خواندن برای همهٔ اعضا؛ درج فقط با policy ادمین؛ آپدیت فقط دو ستون نقش/مسئولیت
grant select, insert on public.profiles to authenticated;
grant update (role, job_title) on public.profiles to authenticated;