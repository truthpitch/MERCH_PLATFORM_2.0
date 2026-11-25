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
| `SHOPIFY_ADMIN_CLIENT_ID`, `SHOPIFY_ADMIN_CLIENT_SECRET` | Orders page (optional) | Shopify Dev Dashboard app with scope `read_orders`, installed on the store → app Settings → Client ID and Client secret. The site gets and renews the 24-hour access token itself. (An older custom app's `shpat_` token still works in `SHOPIFY_ADMIN_ACCESS_TOKEN`.) |
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
  - Phone / tablet: hamburger + logo on the left, language and theme (palette) button in the middle, account, favorites and cart icons on the right, search bar underneath. The hamburger opens a menu that slides in from the left: SHOP (folds open to every category), ABOUT, CONTACT.
  - Desktop (1024px+): one row with the logo, SHOP (opens a panel with every category), ABOUT, CONTACT, the search field and the icons.
- **Categories** (`/products?category=t-shirts` etc.): T-shirts, Hoodies & sweatshirts, Beanies, Hats & caps, Stickers & decals, Posters & prints, Mugs & drinkware, Tote bags & backpacks, Phone cases, Pins & patches, Socks. A product is placed by the category chosen for it in the admin (Products tab) if any, otherwise by its Shopify **Product type**, then its title, then its tags. Edit the list in `src/lib/categories.ts`.
- **Accounts** (`/account`): customers can register (an activation link is emailed once, valid 48 hours; the account can sign in only after clicking it, and signing in to a not-yet-activated account sends a new link), sign in, sign out, reset a forgotten password by email (`/account/forgot`, link valid once for 1 hour; a reset signs the account out on every other device) and delete their account. Passwords are hashed (scrypt); sessions last 30 days. Accounts are optional: the cart offers **Checkout as guest** or **Sign in to check out**. Signed-in customers get their email pre-filled at Shopify's checkout.
- **Favorites** (`/favorites`): the heart on every product. Guests' favorites are kept on their device and move into their account when they sign in.
- **Sale prices**: set a *Compare-at price* on a variant in Shopify and the shop shows the old price struck through, a **Sale** badge on the product card and "Save 20%" on the product page.
- **Sort and filter** (Shop page): sort by newest, price or name; filter by size, colour (from Shopify's variant options) and price band. Choices are kept in the address, so filtered pages can be shared.
- **Product page folds**: Product details, Size guide (when the product's category has one), Shipping & returns, and More info. All start closed.
- **Reviews**: signed-in customers can give 1–5 stars and write a review (one per product, editable). Reviews are only published after the admin approves them, and customers are told so; edited reviews are checked again. Shown at the bottom of the product page with the average and a breakdown; stars also show on product cards. Names are shown as "Jane D.".
- **Blog** (`/blog`): posts written in the admin, with cover image, headings, lists, quotes, links and images; an automatic “In this article” list; tags; reading time; share links and “Keep reading” suggestions. Linked from the menu, the footer and the homepage (“From the blog”). Drafts and scheduled posts are only visible to the admin.
- **SEO**: `/sitemap.xml` (all products, categories and blog posts), `/robots.txt` (keeps admin, account, cart and search out of Google), `/blog/rss.xml`, canonical links, link previews (Open Graph / X) and structured data (BlogPosting, BreadcrumbList) on blog posts. Set `SITE_URL` if the shop moves to another domain.
- **Cookie banner**: on the first visit a banner asks to **Reject** or **Accept** analytics cookies (equal buttons; the shop works the same either way). The choice is kept for a year in `tp_consent` and can be changed with **Cookie settings** in the footer. Nothing is measured before Accept; Reject removes the analytics ids.
- **Visitor statistics** (only after Accept): our own tracker (`components/AnalyticsTracker.tsx` → `/api/track`) records page views, time on page (only while the tab is visible), referrer domain, UTM campaign, device, browser, OS, browser language, country (when the host sends a country header such as Cloudflare's) or else the device's time zone. No IP addresses, names or emails are stored; a visitor is a random id in their own browser. Admin visits and bots are skipped. Data older than 13 months is deleted automatically.
- **Help and cookie pages**: `/how-it-works` (ordering, payment, production, shipping, returns, accounts, reviews, cookies) and `/cookie-policy`, both in the footer and sitemap and editable under Admin → Legal.
- **Search** (`/search?q=`): every word must appear in a product's title, description or MORE INFO story.
- **Shop page**: each product has a foldable **MORE INFO** under its title; the full story only shows once it's opened.
- **Themes** (`src/lib/themes.ts`): 12 looks for the storefront: Classic light, Classic dark, Editorial, Noir gold, Swiss, Neo brutal, Klein blue, Terminal, Sand & clay, Lavender, Forest and Acid night. A theme changes colours, button colour, fonts (self-hosted via next/font, only downloaded when used), rounding and a few details; the admin panel keeps its own look. Visitors pick one with the palette button in the menu bar (remembered on their device) unless the admin fixed the theme. "Automatic" = Classic light or dark following the device setting. The theme is set before the page is painted, so there's no flash.
- **Languages**: the menu lists 45+ languages in their own names. Translation is done by Google's website translator and covers the whole page, including your own texts. The Google script only loads when a language other than English is active; on a first visit the browser's preferred language is used automatically. Prices and the TRUTHPITCH logo are never translated.

## Admin panel

| Page | What it does |
| --- | --- |
| **Dashboard** | Maintenance ON/OFF switch and message, **Ordering pause** (shop stays open, add to cart and checkout off; message and optional automatic end time), favicon upload (PNG, ICO, JPG, WebP or GIF, max 1 MB), quick stats, connection status |
| **Home** | Announcement bar (headline, button, countdown), hero text/image/button, featured products (add, remove, reorder) |
| **About** | The `/about` page: intro statement, **Our Mission** and **Our Vision** (side by side), **Why I Started TruthPitch** (personal story with a large closing line), the story behind TruthPitch with optional image, and three principles. Empty a text to hide its section |
| **Contact** | The `/contact` page: heading, intro text and the optional email address shown next to the form |
| **Theme** | Choose the default theme (with live previews of all 12) and whether **visitors can choose** their own theme or everyone gets a **fixed theme** (the palette button is then hidden and saved choices are ignored) |
| **Legal** | Legal notice / Impressum (company name, address, email, phone, KvK and VAT number) for `/legal-notice`, and the policy pages `/terms-of-service`, `/shipping-policy`, `/refund-policy` `/privacy-policy`, `/cookie-policy` and the help page `/how-it-works` (standard texts are used until you write your own; each box shows "Standard text" or "Your own text"). Shopify requires both for iDEAL | Wero |
| **Products** | Choose each product's shop **category** (Automatic shows which one it gets and why), edit the **MORE INFO** story (and optional image), the **Shipping & returns** text for every product page, and the **Size guides** (one table per category) |
| **Blog** | Write, edit, schedule, publish and delete posts. Per post: title, web address, summary, text (text editor with bold, italic, text sizes, lists, quotes, links, dividing lines and images), cover image, tags, author, SEO title and description with a live Google preview. Five starter posts come as drafts |
| **Media** | Upload images (JPG/PNG/WebP/GIF, 5 MB each, up to 20 at once) into folders (General, Blog, Products, Pages, or your own). Images keep their own name (duplicates get “(1)”, “(2)” …) and live at `/media/<folder>/<name>`. Search by name, filter by folder, rename, move (the URL stays the same), copy the URL, delete. In the blog editor, “Insert image” and “Choose image” open the same library with search, folders and upload |
| **Reviews** | New and edited customer reviews wait here for approval (the Dashboard shows how many). Approve, hide or delete; filter on Waiting / Approved / All |
| **User accounts** | List of customer accounts with activation status, created date and favorites count; search and filter. Per account: **Send activation link** (marks it Not activated and emails a new link) and **Delete** (both ask to confirm) |
| **Orders** | Latest 25 Shopify orders with payment and fulfillment status |
| **SEO & Traffic** | Visitor statistics for the last 7, 30 or 90 days: live now, visitors, visits, page views, average visit duration, bounce rate, cookie accept rate, visitors per day, most viewed pages (with average time), traffic sources, locations, landing pages, devices, browsers, operating systems, languages and the latest 50 visits (click one to see its pages). SEO checklist (site address, maintenance mode, favicon, legal notice, blog posts missing a summary or cover), links to the sitemap / robots.txt / RSS, and fields for the **Google Search Console** and **Bing** verification codes (paste the whole meta tag). Button to delete all statistics |

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

### Text editor

Longer texts in the admin (blog posts, the four policies, the About story, product MORE INFO stories and the Shipping & returns text) use a small text editor: **text size** (Normal / Large / Extra large), **bold**, *italic*, bullet and numbered lists, quotes, links, dividing lines, and (in blog posts) images from the Media library. Click an image in the text to remove it. Pasted text arrives without outside fonts or colours. Behind the scenes the text is stored in a simple Markdown-like format (`src/lib/rich-text.ts`) and shown on the website without any raw HTML, so it stays safe. Short texts (titles, summaries, messages) stay plain text fields.
