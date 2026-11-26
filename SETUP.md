# Social scheduler setup (Instagram + Threads)

The admin panel can post to **Instagram** and **Threads**, right away or at a set time
(Admin → Social). This guide covers everything that has to be set up outside the code.

> Status: steps 1 and 2 of 3 are done (scheduler, test mode, cron endpoint, Instagram).
> Threads follows in step 3.

## 1. Environment variables

Add these on Hostinger (hPanel → your Node.js app → Environment variables) and in your local `.env`.
`.env.example` describes each one.

| Variable | What it is |
|---|---|
| `SOCIAL_MOCK` | `true` = test mode with pretend accounts; nothing is posted. Use `false` (or leave it out) on the live site. |
| `SOCIAL_TOKEN_KEY` | 64 hex characters. Encrypts the stored access tokens. Don't change it later (you'd have to reconnect the accounts). |
| `CRON_SECRET` | A long random string. The cron job sends it, so nobody else can trigger publishing. |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | From the Meta app, see 3.2. Optional: `INSTAGRAM_API_VERSION` (default `v27.0`). |
| `THREADS_APP_ID`, `THREADS_APP_SECRET` | From the Meta app (step 3). |

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

### 3.1 Create the app

1. Go to <https://developers.facebook.com/apps> and log in with your Facebook account
   (register as a developer if asked).
2. **Create app** → name it e.g. *TruthPitch Social* → contact email → **Next**.
3. Use case: **Manage messaging & content on Instagram**. (Threads is added in step 3 of the build.)
4. Skip connecting a business portfolio if you don't have one → **Create app**.

### 3.2 Instagram (API with Instagram Login)

Your Instagram account must be a **Business** or **Creator** account
(Instagram app → Settings → Account type and tools → Switch to professional account).
No Facebook Page is needed.

1. In the app: **Use cases** → *Manage messaging & content on Instagram* → **Customize**
   → **API setup with Instagram login**.
2. Under *Add required permissions* make sure these two are added:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
3. Copy the **Instagram app ID** and **Instagram app secret** shown at the top of that page.
   Careful: these are *not* the Facebook "App ID" from Basic settings.
4. Under **Set up Instagram business login** → **Business login settings** → *OAuth redirect URIs*, add
   (exactly, one per line):

   ```
   https://www.truthpitch.com/admin/social/connect/instagram/callback
   https://truthpitch.com/admin/social/connect/instagram/callback
   ```

   The site sends the `www` version (Admin → Social → Accounts shows the exact address it uses).
   Meta only accepts https addresses here, so a real Instagram connection can't be tested on
   localhost: use test mode (`SOCIAL_MOCK=true`) locally. Real posts only work from the live site
   anyway, because Instagram downloads the image from your website.
5. **Add yourself as a tester**: **App roles** → **Roles** → **Add people** → *Instagram Tester*
   → your Instagram username. Then accept the invite in Instagram: on the web at
   <https://www.instagram.com/accounts/manage_access/> → **Tester invites** → **Accept**.
6. On Hostinger, set the environment variables and restart/redeploy:

   ```
   INSTAGRAM_APP_ID="…"
   INSTAGRAM_APP_SECRET="…"
   SOCIAL_MOCK="false"
   ```

7. Admin → Social → **Accounts** → **Connect Instagram** → log in to Instagram → **Allow**.
   You come back to the accounts page with the account listed as *Connected* (valid ~60 days,
   renewed automatically by the cron job).

**Good to know about Instagram posts**

- An image is required, one per post, **JPEG only**, max 8 MB, aspect ratio between 4:5 (portrait)
  and 1.91:1 (landscape). Product photos from Shopify are requested as JPEG automatically.
- Captions up to 2,200 characters. Links in captions are not clickable.
- Instagram allows a limited number of posts via the API per 24 hours (Meta mentions 50 or 100).
  The site checks the current limit before every post and shows a clear error when it's reached.
- If a post fails halfway, **Retry** continues with the same upload where possible, and refuses
  when Instagram says it's already published, so nothing is posted twice.

### 3.3 Threads

_Follows in step 3._

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
