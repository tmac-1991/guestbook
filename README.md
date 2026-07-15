# Guestbook

Static page, no build step. Messages are stored in Supabase.

## Setup

1. In the Supabase dashboard, create a project and run the SQL to create
   `guestbook_messages` (see the table/RLS policies below if you need them again).
2. Edit `config.js` and fill in `SUPABASE_URL` and `SUPABASE_ANON_KEY` from
   Project Settings -> API.
3. (Optional, for live updates across visitors) In the dashboard go to
   Database -> Replication and enable replication for `guestbook_messages`.
   Without this, the page still updates instantly for the person posting —
   it just won't push new messages to other open tabs in real time.

## Run locally

This uses ES module imports, so it needs to be served over HTTP (not opened
as a `file://` URL):

```
npx serve .
```

or

```
python3 -m http.server 8000
```

Then open the printed URL in your browser.

## Table schema

```sql
create table guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table guestbook_messages enable row level security;

create policy "Allow public read"
  on guestbook_messages for select
  using (true);

create policy "Allow public insert"
  on guestbook_messages for insert
  with check (true);
```

## Enforcing the 100-character message limit at the database level

The form enforces a 100-character limit client-side, but that can be bypassed
by anyone calling the API directly. Run this once in the SQL Editor to enforce
it server-side too:

```sql
alter table guestbook_messages
  add constraint message_length check (char_length(message) <= 100);
```
