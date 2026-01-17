-- Trigger to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_username text;
begin
  -- Generate a default username from email if not provided in metadata
  if new.raw_user_meta_data->>'username' is not null then
    default_username := new.raw_user_meta_data->>'username';
  else
    default_username := split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    default_username,
    new.raw_user_meta_data->>'display_name', -- Request might contain this
    new.raw_user_meta_data->>'avatar_url'
  );

  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
