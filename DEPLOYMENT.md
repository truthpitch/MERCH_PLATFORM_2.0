# Deployment: GitHub → Hostinger

This app has a server side (admin panel, database, Shopify calls), so it needs a hosting plan that runs **Node.js**. Static-only shared hosting won't work. On Hostinger, that means one of these:

- **Option A: Node.js web app** (Business or Cloud web hosting plans). Easiest. Connect the GitHub repo in hPanel.
- **Option B: VPS**. Full control. You run Node yourself, with PM2 and Nginx.

Hostinger's menus change from time to time. If a label below doesn't match exactly, look for the closest equivalent.

---

## 1. Push to GitHub

Create an **empty private** repository on GitHub (no README or .gitignore), then in this folder run:

```bash
git add .
git commit -m "Initial TruthPitch merch store"
git branch -M main
git remote add origin https://github.com/<your-account>/truthpitch-merch.git
git push -u origin main
```

`.env`, the local database and `uploads/` are git-ignored, so no secrets or local data are pushed. Database migrations **are** committed. They're how the production database gets created.

---

## 2A. Hostinger Node.js web app

1. In **hPanel**, go to **Websites → Add website → Node.js Apps** (or open your existing site's Node.js section). Choose **Import Git repository** and connect GitHub.
2. Select the repository and the `main` branch.
3. Build settings:
   - **Node version**: 20, 22 or newer
   - **Install command**: `npm install`
   - **Build command**: `npm run build`
   - **Start command**: `npm start`
   - **Output directory** (if asked): `.next`
4. **Environment variables**: add every variable from `.env.example` with production values:
   - `DATABASE_URL`: an **absolute path outside the app folder**, so redeploys don't wipe it. For example `file:/home/u123456789/truthpitch-data/store.db`. Your home path is shown in hPanel → File Manager.
   - `UPLOAD_DIR`: an absolute path next to it, for example `/home/u123456789/truthpitch-data/uploads`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: a long, unique password
   - `AUTH_SECRET`: a new random value, not the one from your local `.env`
   - `SHOPIFY_*` and optionally `PRINTFUL_API_KEY`
5. Deploy. The build runs `scripts/prepare-db.mjs`, which creates the database folder and applies the migrations. If `DATABASE_URL` is wrong, the build stops with a readable error. Hostinger starts the server itself, so this can't depend on `npm start`.
6. Open `https://<your-domain>/api/health`. It should say `"ok": true`. If it doesn't, the `databaseError` field tells you what's wrong. Open `/api/health?mail=1` to also test the contact form's mail login: `"mailLogin": "ok"`, or an error with a hint.
7. Point **truthpitch.com** (or a subdomain such as `shop.truthpitch.com`) to the app and turn on **SSL**. HTTPS is required, because the admin cookie is marked `secure` in production.

Each new `git push` to `main` redeploys automatically, if auto-deploy is enabled.

> If the build environment won't let you create the data folder, create `truthpitch-data/` once with hPanel's File Manager.

> **Older build servers (glibc < 2.29).** Hostinger's builders can't load Next.js's native compiler, so Next falls back to a WebAssembly version. That fallback can't compile a TypeScript `next.config.ts` or run Turbopack. This is why the project uses `next.config.mjs` and why `npm run build` runs `next build --webpack`. Keep both as they are.

---

## 2B. Hostinger VPS (Ubuntu)

```bash
# one-time setup
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -g pm2
mkdir -p ~/truthpitch-data/uploads

# get the code
git clone https://github.com/<your-account>/truthpitch-merch.git ~/truthpitch-merch
cd ~/truthpitch-merch
cp .env.example .env && nano .env      # set production values (absolute DATABASE_URL / UPLOAD_DIR)
npm install
npm run build
pm2 start npm --name truthpitch -- start
pm2 save && pm2 startup
```

Nginx reverse proxy (`/etc/nginx/sites-available/truthpitch`):

```nginx
server {
  server_name truthpitch.com www.truthpitch.com;
  client_max_body_size 6m;            # allow 5 MB image uploads
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/truthpitch /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx && sudo certbot --nginx
```

To update after pushing new code:

```bash
cd ~/truthpitch-merch && git pull && npm install && npm run build && pm2 restart truthpitch
```

---

## 3. After the first deploy

1. Visit `https://truthpitch.com/admin` and sign in.
2. Check **Dashboard → Connections**. Shopify should show **Connected**.
3. Set up the homepage text, choose featured products, and write the product stories.
4. Place a test order. Shopify has a *Bogus Gateway* test mode under Settings → Payments. Then confirm it shows up in Printful.

## Backups

All admin-managed content lives in the single SQLite file at `DATABASE_URL` plus the `UPLOAD_DIR` folder. Back up both now and then, for example by downloading them through File Manager. Products and orders are safe in Shopify.
