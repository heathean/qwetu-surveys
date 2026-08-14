# Juju Jemo Kevo Movers Ltd — deployment guide

This is the same app you saw in Claude, rebuilt to run as a real website with
its own database (Supabase) instead of Claude's built-in storage.

## 1. Create your database (Supabase — free)

1. Go to https://supabase.com and sign up (free tier is enough to start).
2. Click "New project". Pick a name and a password (save the password somewhere).
3. Once the project is ready, open the **SQL Editor** (left sidebar).
4. Paste in the contents of `supabase_schema.sql` (included in this folder) and click **Run**.
   This creates the `listings` table and turns on public read/write access
   and live updates — fine for a demo/MVP, but see "Before you go fully
   public" below.
5. Go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key

## 2. Connect the app to your database

1. In this folder, copy `.env.example` to a new file named `.env`.
2. Paste in your Project URL and anon key from step 1.

## 3. Run it locally to check it works

```bash
npm install
npm run dev
```

Open the local address it prints (usually http://localhost:5173). Try
posting a room and claiming it from another browser tab — both should stay
in sync live.

## 4. Put it on the internet (Vercel — free)

1. Push this folder to a GitHub repository.
2. Go to https://vercel.com, sign up, and click **New Project**.
3. Import your GitHub repo.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (same values as your `.env` file)
5. Click **Deploy**. In about a minute you'll get a live URL like
   `juju-jemo-kevo.vercel.app`.
6. Optional: buy a domain (e.g. from Truehost or Safaricom's domain service
   for a .co.ke) and point it at the Vercel project under **Settings → Domains**.

## Before you go fully public

The database policies in `supabase_schema.sql` let anyone read, post,
update, or delete any listing — good enough for testing with friends, but
not safe for a real public launch. Before real users show up, you'll want:

- **Real landlord accounts** — Supabase has free built-in auth (phone OTP
  works well for Kenya). Then restrict the update/delete policies so
  landlords can only edit their own listings.
- **Rate limiting on posting** — stop one person from spamming fake rooms.
- **Phone number verification** — an OTP step before a listing goes live
  cuts down on fake landlords significantly.

Happy to help you add any of these next.
