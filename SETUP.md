# Social scheduler setup (Instagram + Threads)

The admin panel can post to **Instagram** and **Threads**, right away or at a set time
(Admin → Social). This guide covers everything that has to be set up outside the code.

## 1. Environment variables

Add these on Hostinger (hPanel → your Node.js app → Environment variables) and in your local `.env`.
`.env.example` describes each one.

| Variable | What it is |
|---|---|
| `SOCIAL_MOCK` | `true` = test mode with pretend accounts; nothing is posted. Use `false` (or leave it out) on the live site. |
| `SOCIAL_TOKEN_KEY` | 64 hex characters. Encrypts the stored access tokens. Don't change it later (you'd have to reconnect the accounts). |
| `CRON_SECRET` | A long random string. The cron job sends it, so nobody else can trigger publishing. |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_CONFIG_ID` | From the Meta app, see 3.2. Optional: `INSTAGRAM_API_VERSION` (default `v27.0`). |
| `THREADS_APP_ID`, `THREADS_APP_SECRET` | From the Meta app, see 3.3. Optional: `THREADS_API_VERSION` (default `v1.0`). |

Generate `SOCIAL_TOKEN_KEY` and `CRON_SECRET` (run it twice, one value each):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Redeploy (or restart the app) after changing environment variables.

## 2. Try it in test mode

1. Set `SOCIAL_MOCK="true"` and a `SOCIAL_TOKEN_KEY`.
2. Admin → Social → **Accounts** → *Connect test account* for Instagram and Threads.
3. Admin → Social → write a post, choose *Post now* or *Schedule*.
4. Put `#fail` in a caption to see a failed post and the *Retry* button.

## 3. Meta developer app

Both Instagram and Threads are connected through an app on Meta's developer site. You don't need
App Review: as long as the app stays in **Development** mode, it works for accounts that have a
role on the app (you), which is all a shop posting to its own accounts needs.

Meta's dashboard changes its wording now and then; the steps below match it at the time of writing.

### 3.1 Create the Instagram app

1. Go to <https://developers.facebook.com/> → log in → **My Apps** (first time: **Get started** to
   register as a developer).
2. **Create app** → name it e.g. *TruthPitch Social* → contact email → **Next**.
3. Use cases: filter on **Content management** and tick **Manage messaging & content on Instagram**
   (only that one; Threads gets its own app in 3.3) → **Next**.
4. Business: skip for now → **Create app**.

### 3.2 Instagram (API with Unified login)

New Meta apps use **Unified login**: you log in through Meta's login window (choose *Log in with
Instagram*) and pick the Instagram account to share. The connection **doesn't expire**.
Needed: an Instagram **Business** or **Creator** account and a free Meta **business portfolio**.
No Facebook Page.

1. **Use cases** → Instagram → **Customize** → **API setup with Unified login**.
2. **Business portfolio**: click **+ Business portfolio** and create/select one (e.g. *TruthPitch*).
3. **Permissions and features** (left list): make sure `instagram_basic` and
   `instagram_content_publish` are added.
4. Back on **API setup with Unified login** → *1. Configure your app* → **Create new configuration**:
   - Name: *TruthPitch website*
   - Login variation: **General**
   - Access token: **System-user access token**, expiration **Never**
   - Assets: **Instagram account** (ad account not needed)
   - Permissions: `instagram_basic` and `instagram_content_publish` are enough (untick the rest if
     the screen allows it)
   - Save, then copy the **Configuration ID** it shows.
5. **Redirect URL** → *Register a new redirect URL*: paste and **Save** (then the second one):

   ```
   https://www.truthpitch.com/admin/social/connect/instagram/callback
   https://truthpitch.com/admin/social/connect/instagram/callback
   ```

   Admin → Social → Accounts shows the exact address the site uses. Meta only accepts https, so
   a real connection can't be tested on localhost: use test mode (`SOCIAL_MOCK=true`) there.
6. **App ID and secret**: gear icon at the bottom left → **App settings → Basic** → copy the
   **App ID** and the **App secret** (click *Show*).
7. **Tester** (needed while the app is in Development mode): **App roles → Roles** → **Add people**
   → *Instagram Tester* → your Instagram username. Accept at
   <https://www.instagram.com/accounts/manage_access/> → **Tester invites** → **Accept**.
8. On Hostinger, set and redeploy:

   ```
   INSTAGRAM_APP_ID="…"        # App ID from step 6
   INSTAGRAM_APP_SECRET="…"    # App secret from step 6
   INSTAGRAM_CONFIG_ID="…"     # Configuration ID from step 4
   SOCIAL_MOCK="false"
   ```

9. Admin → Social → **Accounts** → **Connect Instagram** → in Meta's window choose
   **Log in with Instagram**, select your business portfolio and Instagram account → **Allow**.
   You come back with the account listed as *Connected* ("Access doesn't expire").

**Good to know about Instagram posts**

- An image is required, one per post, **JPEG only**, max 8 MB, aspect ratio between 4:5 (portrait)
  and 1.91:1 (landscape). Product photos from Shopify are requested as JPEG automatically.
- Captions up to 2,200 characters. Links in captions are not clickable.
- Instagram allows a limited number of posts via the API per 24 hours (Meta mentions 50 or 100).
  The site checks the current limit before every post and shows a clear error when it's reached.
- If a post fails halfway, **Retry** continues with the same upload where possible, and refuses
  when Instagram says it's already published, so nothing is posted twice.
- If you ever remove the app from your business portfolio or move the Instagram account to another
  portfolio, posting stops: click **Reconnect**.

### 3.3 Threads

Threads gets its **own app** (Meta doesn't combine it with the Instagram use case) with its own
**Threads app ID and secret**.

1. **My Apps** → **Create app** → name it e.g. *TruthPitch Threads* → use case
   **Access the Threads API** → create it.
2. **Use cases** → *Access the Threads API* → **Customize** → **Permissions**: make sure
   `threads_basic` and `threads_content_publish` are added.
3. In the use case's **Settings**:
   - Copy the **Threads app ID** and **Threads app secret** (not the Facebook App ID).
   - *Redirect callback URLs* (Client OAuth settings), add:

     ```
     https://www.truthpitch.com/admin/social/connect/threads/callback
     https://truthpitch.com/admin/social/connect/threads/callback
     ```

     Click **Save** and check the list: the dashboard sometimes adds a trailing `/`, which makes
     the address no longer match. Remove it if so.
   - *Uninstall callback URL* and *Delete callback URL* are required to save on some dashboards;
     you can use `https://www.truthpitch.com/privacy-policy` for both (nothing is called there).
4. **Add yourself as a tester**: **App roles** → **Roles** → **Add people** → *Threads Tester*
   → your Threads username. Accept the invite on Threads: <https://www.threads.com/settings/account>
   → **Website permissions** → **Invites** → **Accept**.
5. On Hostinger, set and redeploy:

   ```
   THREADS_APP_ID="…"
   THREADS_APP_SECRET="…"
   ```

6. Admin → Social → **Accounts** → **Connect Threads** → log in → **Allow**.

Without App Review you can only post as a Threads tester, which is exactly your own profile.

**Good to know about Threads posts**

- Text only is fine; an image is optional (JPEG or PNG, max 8 MB).
- Max 500 characters and max 5 different links per post. The first link gets a preview card,
  and links are clickable.
- 250 posts per 24 hours via the API; the site checks this before posting.
- Like Instagram, **Retry** continues with the same upload where possible and never posts twice.

## Troubleshooting

| Message | What to do |
|---|---|
| "Token expired or revoked, reconnect …" | Admin → Social → Accounts → **Reconnect**. Happens when you change your password, remove the app's access, or the cron job hasn't run for 60 days. |
| "… couldn't use the image" | Open the image address in a private browser window. It must load without logging in, be https and (for Instagram) a JPEG. |
| "Publishing was interrupted" | The server stopped mid-post. Check the profile: if the post isn't there, click **Retry**. |
| Redirect / "URL blocked" error when connecting | The redirect address in the Meta app must match exactly the one shown on the Accounts page (https, www, no trailing `/`). |
| Scheduled posts don't go out | Check the cron job (section 4) and that `CRON_SECRET` matches. Run the curl command by hand: it should answer `{"ok":true,…}`. |

## 4. Cron job on Hostinger

Scheduled posts are sent by calling `POST /api/cron/publish-social` every 5 minutes. Each run:

- publishes posts whose time has come (max 10 per run);
- renews Instagram/Threads access that expires within 7 days;
- marks a post that got stuck while publishing (over 15 minutes) as failed, so it's never posted twice.

hPanel → **Advanced → Cron Jobs** → *Custom*. Run it every 5 minutes (`*/5 * * * *`) with this command,
replacing `YOUR_CRON_SECRET` with the value of `CRON_SECRET`:

```bash
curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://www.truthpitch.com/api/cron/publish-social > /dev/null 2>&1
```

Test it once from your own computer: the answer should start with `{"ok":true`.
A wrong or missing secret gives `401 Unauthorized`.
