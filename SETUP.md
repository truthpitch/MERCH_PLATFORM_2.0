# Social scheduler setup (Instagram + Threads)

The admin panel can post to **Instagram** and **Threads**, right away or at a set time
(Admin → Social). This guide covers everything that has to be set up outside the code.

> Status: step 1 of 3 is done (data model, compose/queue pages, test mode, cron endpoint).
> The Meta app and the real Instagram and Threads connections follow in steps 2 and 3;
> their sections below will be filled in then.

## 1. Environment variables

Add these on Hostinger (hPanel → your Node.js app → Environment variables) and in your local `.env`.
`.env.example` describes each one.

| Variable | What it is |
|---|---|
| `SOCIAL_MOCK` | `true` = test mode with pretend accounts; nothing is posted. Use `false` (or leave it out) on the live site. |
| `SOCIAL_TOKEN_KEY` | 64 hex characters. Encrypts the stored access tokens. Don't change it later (you'd have to reconnect the accounts). |
| `CRON_SECRET` | A long random string. The cron job sends it, so nobody else can trigger publishing. |
| `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | From the Meta app (step 2). |
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

_Follows in step 2 (Instagram) and step 3 (Threads)._

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
