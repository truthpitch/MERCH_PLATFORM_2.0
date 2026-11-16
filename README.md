# TruthPitch Merch

A minimal merch store for **TruthPitch.com**.

- **Storefront**: Next.js 16 (App Router) + TypeScript + Tailwind CSS. Black, white and grey only.
- **Products, cart, checkout**: Shopify Storefront API → Shopify's hosted checkout.
- **Fulfillment**: Printful, through the Printful app installed in Shopify.
- **Admin panel** (`/admin`): homepage content, featured products, product stories, image uploads, order overview, and a maintenance ON/OFF switch.
- **Custom content**: Prisma + SQLite.

Without Shopify credentials the store runs in **demo mode** with 6 sample products, so you can try everything straight away.

---

## Quick start (local)

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env        # then edit .env (see below)
npm run db:migrate          # creates the SQLite database
npm run dev                 # http://localhost:3000
```

The control panel is at **http://localhost:3000/admin**. Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

> **Windows note:** this folder's path contains `&` and `( )`, which break npm's usual command shims. The npm scripts call each tool via `node node_modules/...` so they still work. Use `npm run …` and avoid `npx …` here.

## Environment variables

Every variable is documented in [`.env.example`](.env.example). These are the important ones:

| Variable | Needed for | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | Everything | `file:./dev.db` locally. Use an absolute path in production. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin login | Choose your own. |
| `AUTH_SECRET` | Admin sessions | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SHOPIFY_STORE_DOMAIN` | Real products + checkout | `yourstore.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Real products + checkout | Shopify admin → Sales channels → **Headless** → Create storefront → public access token |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Orders page (optional) | Shopify admin → Settings → Apps → Develop apps → scope `read_orders` |
| `PRINTFUL_API_KEY` | Optional direct API use | Printful → Settings → API |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Contact form, account-activation and password-reset emails (registering needs this) | The mailbox's SMTP login. Titan (truthpitch.com): `smtp.titan.email`, port `465`, user `info@truthpitch.com`. |
| `CONTACT_TO_EMAIL` | Contact form recipient (optional) | Defaults to `info@truthpitch.com`. |
| `SITE_URL` | Links in emails (optional) | Defaults to `https://www.truthpitch.com` in production. |
| `UPLOAD_DIR` | Admin image uploads | Defaults to `./uploads`. Use an absolute path in production. |

## Connecting Shopify + Printful

1. **Shopify**: create the store (or use the one you have), then install the **Headless** sales channel and create a storefront. Copy the **public** Storefront API token and your `*.myshopify.com` domain into `.env`.
2. **Printful**: in Shopify, install the **Printful** app and connect your Printful account. Design products in Printful and click *Add to store*. They sync to Shopify as normal products.
3. Make sure each product is published to the **Headless** sales channel, or the Storefront API won't return it.
4. Restart the app. The dashboard's *Connections* panel should now say **Connected**.

When a customer clicks **Checkout**, they go to Shopify's checkout. Shopify takes the payment, and the Printful app picks up the order, prints it, ships it and marks it fulfilled.

The code is commented where credentials go. See:

- `src/lib/shopify/storefront.ts`: products, cart, checkout
- `src/lib/shopify/admin.ts`: order overview
- `src/lib/printful.ts`: Printful API helper (optional)

## Storefront features

- **Announcement bar** (optional, set under Admin → Home): headline, optional button and optional live countdown (`68 H 26 M 21 S`). Visitors can close it with the ×; it comes back when you change the offer, and hides itself when the countdown ends.
- **Menu bar** (mobile first, sticks to the top):
  - Phone / tablet: hamburger + logo on the left, language and light/dark switch in the middle, account, favorites and cart icons on the right, search bar underneath. The hamburger opens a menu that slides in from the left: SHOP (folds open to every category), ABOUT, CONTACT.
  - Desktop (1024px+): one row with the logo, SHOP (opens a panel with every category), ABOUT, CONTACT, the search field and the icons.
- **Categories** (`/products?category=t-shirts` etc.): T-shirts, Hoodies & sweatshirts, Beanies, Hats & caps, Stickers & decals, Posters & prints, Mugs & drinkware, Tote bags & backpacks, Phone cases, Pins & patches, Socks. A product is placed by its Shopify **Product type**, then its tags, then its title. Edit the list in `src/lib/categories.ts`.
- **Accounts** (`/account`): customers can register (an activation link is emailed once, valid 48 hours; the account can sign in only after clicking it, and signing in to a not-yet-activated account sends a new link), sign in, sign out, reset a forgotten password by email (`/account/forgot`, link valid once for 1 hour; a reset signs the account out on every other device) and delete their account. Passwords are hashed (scrypt); sessions last 30 days. Accounts are optional: the cart offers **Checkout as guest** or **Sign in to check out**. Signed-in customers get their email pre-filled at Shopify's checkout.
- **Favorites** (`/favorites`): the heart on every product. Guests' favorites are kept on their device and move into their account when they sign in.
- **Search** (`/search?q=`): every word must appear in a product's title, description or MORE INFO story.
- **Shop page**: each product has a foldable **MORE INFO** under its title; the full story only shows once it's opened.
- **Dark mode**: follows the device setting until the visitor picks one; the choice is remembered on that device. It only affects the storefront, not the admin panel.
- **Languages**: the menu lists 45+ languages in their own names. Translation is done by Google's website translator and covers the whole page, including your own texts. The Google script only loads when a language other than English is active; on a first visit the browser's preferred language is used automatically. Prices and the TRUTHPITCH logo are never translated.

## Admin panel

| Page | What it does |
| --- | --- |
| **Dashboard** | Maintenance ON/OFF switch and message, favicon upload (PNG, ICO, JPG, WebP or GIF, max 1 MB), quick stats, connection status |
| **Home** | Announcement bar (headline, button, countdown), hero text/image/button, featured products (add, remove, reorder) |
| **About** | The `/about` page: intro statement, the story behind TruthPitch, optional image and three principles |
| **Contact** | The `/contact` page: heading, intro text and the optional email address shown next to the form |
| **Products** | Edit the **MORE INFO** story (and optional image) for each product |
| **Media** | Upload images (JPG/PNG/WebP/GIF, 5 MB max) and copy their URLs |
| **User accounts** | List of customer accounts with activation status, created date and favorites count; search and filter. Per account: **Send activation link** (marks it Not activated and emails a new link) and **Delete** (both ask to confirm) |
| **Orders** | Latest 25 Shopify orders with payment and fulfillment status |

**Login**: tick **Remember me** to stay signed in for 30 days on that device; your email is also remembered after you log out, and your browser can save the password. Untick it on shared computers: you are then signed out when the browser closes.

**Contact page** (`/contact`): name, email, subject, optional order number and message. Each message is emailed straight to **info@truthpitch.com** (nothing is stored on the website), with Reply-To set to the customer so you can simply hit Reply. Needs the `SMTP_*` variables; without them the form tells visitors to email info@truthpitch.com instead. Spam protection: a hidden honeypot field and max 5 messages per 10 minutes per visitor.

**Maintenance mode**: when it's ON, every public page shows a "We'll be back soon" page. The `/admin` area always stays reachable. While you're logged in, you still see the real store, with a grey notice bar, so you can check changes before you reopen.

## Project structure

```
prisma/
  schema.prisma            SiteSettings, FeaturedProduct, ProductStory, Media
  migrations/              committed; applied automatically on `npm start`
public/samples/            demo product images
src/
  proxy.ts                 protects /admin/* (Next.js 16 "proxy", formerly middleware)
  app/
    (shop)/                public storefront; layout.tsx enforces maintenance mode
      page.tsx             homepage
      products/            listing + [handle] detail page
      cart/                cart page + server actions (add/update/remove/checkout)
    admin/
      login/               login form
      (panel)/             dashboard, homepage, products, media, orders
      actions.ts           all admin server actions
      upload/route.ts      image upload endpoint
    media/[file]/route.ts  serves uploaded images
  components/              storefront + admin UI pieces
  lib/
    catalog.ts             one product API: Shopify or sample data
    cart.ts                Shopify cart, or cookie cart in demo mode
    shopify/               Storefront + Admin API clients
    printful.ts            Printful integration point
    auth.ts, session.ts    admin login (signed JWT cookie)
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generates the Prisma client and builds for production |
| `npm start` | Applies pending DB migrations, then starts the production server (respects `PORT`) |
| `npm run db:migrate` | Creates or applies migrations in development |
| `npm run db:studio` | Opens a database browser |
| `npm run typecheck` | Checks TypeScript types |

## Deploying

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for GitHub → Hostinger.

## Extending later

- **Collections and categories**: add a `collections` query in `storefront.ts` and a `/collections/[handle]` route.
- **More admin users**: replace `checkCredentials` in `src/lib/auth.ts` with a `User` table, or use Auth.js.
- **Production status from Printful**: use `getPrintfulOrderByShopifyId` in `src/lib/printful.ts` on the orders page.
- **Postgres instead of SQLite**: change `provider` in `schema.prisma` and `DATABASE_URL`, then run `npm run db:migrate`.
