# Continental Fight League — Go live

Static site for [continentalfightleague.com](https://www.continentalfightleague.com/).

## Local preview

```bash
cd "/Users/gian/Desktop/CFL Website"
python3 -m http.server 8765
```

Open http://127.0.0.1:8765

## Deploy (Vercel)

1. Create a free account at [vercel.com](https://vercel.com/)
2. Import the GitHub repo `gvaldeztttt-spec/cfl-website`, or deploy from Terminal:

```bash
cd "/Users/gian/Desktop/CFL Website"
npx vercel login
npx vercel --prod
```

3. Framework preset: **Other** · Build command: leave empty · Output directory: `.` (or leave default for static)

## Connect continentalfightleague.com

Domain registrar: **Squarespace Domains**.

**Important:** nameservers must be Squarespace’s defaults first (not Netlify’s `dns*.p01.nsone.net`), or your DNS edits won’t apply.

1. In Squarespace Domains → **Nameservers** → use **Squarespace defaults**
2. In Vercel → Project → **Settings → Domains** → add `continentalfightleague.com` (and `www`)
3. In Squarespace → **DNS settings**, set:

| Type | Host | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

(Use the exact values Vercel shows if they differ.)

4. Keep existing **MX / email TXT** records so email keeps working.
5. Wait for DNS + SSL (often minutes; up to 48 hours).

## After go-live checklist

- [ ] English loads by default
- [ ] ES / EN toggle works
- [ ] Fighter profile links open
- [ ] Partner logos/links work
- [ ] Tickets page loads at `/tickets.html`
- [ ] Instagram points to [cfldr](https://www.instagram.com/cfldr)
- [ ] Wire real email signup (Formspree / Resend) when ready
