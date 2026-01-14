# New Community Bid Portal — Vercel Deployable POC

This is a **static** Next.js proof-of-concept you can deploy to **Vercel** and test both sides immediately:
- Builder portal (bid analysis / vendor selection / totals)
- Subcontractor portal (redeem code / view docs / submit bids)

✅ No database required — data is stored in the browser via `localStorage`.

## Deploy to Vercel (fastest)
1. Download this project zip and unzip it.
2. In Vercel, click **Add New → Project**.
3. Import the folder.
4. Build settings:
   - Framework: **Next.js**
   - Build command: `npm run build`
   - Output directory: `out`
5. Deploy.

## Local run (optional)
```bash
npm install
npm run dev
```

## Demo usage
- Go to `/` home page for the Builder code + Sub invite codes
- Open `/sub` and redeem an invite code, then submit a bid
- Open `/builder` and enter the Builder code, then compare bids and select vendors per trade

## Notes
- This is a POC only. In production you'd replace localStorage with a real DB (Supabase/Postgres), add auth, file access controls, audit logs, etc.
