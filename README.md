# Continental Fight League — Go live

Static site for [continentalfightleague.com](https://www.continentalfightleague.com/).

## Local preview

```bash
cd "/Users/gian/Desktop/CFL Website"
python3 -m http.server 8765
```

Open http://127.0.0.1:8765

## Deploy (Netlify)

1. Create a free account at [netlify.com](https://www.netlify.com/)
2. Drag the `CFL Website` folder onto **Sites → Add new site → Deploy manually**,  
   or from Terminal:

```bash
cd "/Users/gian/Desktop/CFL Website"
npx netlify-cli login
npx netlify-cli deploy --dir=. --prod
```

3. Netlify gives you a URL like `https://something.netlify.app` — confirm the site looks right.

## Connect continentalfightleague.com

Domain registrar: **Squarespace Domains**.

1. In Netlify: **Domain management → Add domain** → `continentalfightleague.com`
2. Follow Netlify’s DNS instructions (they show exact records).
3. In Squarespace: **Domains → continentalfightleague.com → DNS settings**
4. Replace the current Squarespace website A / CNAME records with Netlify’s values (typical pattern):

| Type | Host | Value |
|------|------|--------|
| A | `@` | Netlify load balancer IP (from Netlify panel) |
| CNAME | `www` | `your-site-name.netlify.app` |

Or point nameservers to Netlify if you prefer Netlify DNS.

5. Wait for DNS (often 15–60 minutes; up to 48 hours).
6. In Squarespace, unpublish or delete the old site so it doesn’t conflict.

## After go-live checklist

- [ ] English loads by default
- [ ] ES / EN toggle works
- [ ] Fighter profile links open
- [ ] Partner logos/links work
- [ ] Tickets page loads at `/tickets.html`
- [ ] Instagram points to [cfldr](https://www.instagram.com/cfldr)
- [ ] Wire real email signup (Formspree / Resend) when ready
