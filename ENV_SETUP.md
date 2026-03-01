# Environment setup (for anyone who pulls the repo)

The repo **does not contain** real API URLs or secrets. After you pull, create the env files below and fill in the values.

---

## lifemonk-app (Expo app)

| Variable | Where to set | Required | Description |
|----------|----------------|----------|-------------|
| **EXPO_PUBLIC_STRAPI_BASE_URL** | `lifemonk-app/.env` | Yes | Strapi CMS URL, e.g. `http://localhost:1337` or your server URL |
| **EXPO_PUBLIC_XANO_AUTH_URL** | `lifemonk-app/.env` | Yes | Xano Auth API base (login/signup/create_student/auth/me) |
| **EXPO_PUBLIC_XANO_BASE_URL** | `lifemonk-app/.env` | Yes | Xano Courses API base (get_user_courses, enroll, progress, etc.) |
| EXPO_PUBLIC_STRAPI_API_TOKEN | `lifemonk-app/.env` | No | Optional Strapi API token for restricted content |

**Steps for your friend:**
1. Copy `lifemonk-app/.env.example` to `lifemonk-app/.env`
2. Fill in the three required URLs in `.env` (you send them the values separately, e.g. in a secure message)
3. Run: `cd lifemonk-app && npm install && npm start`

---

## lifemonk-cms (Strapi)

| Variable | Where to set | Required | Description |
|----------|----------------|----------|-------------|
| **XANO_BASE_URL** | `lifemonk-cms/.env` | No* | Used when a course is created/updated to sync to Xano. If not set, sync is skipped. |
| HOST, PORT, APP_KEYS, etc. | `lifemonk-cms/.env` | Yes | Standard Strapi env (copy from `.env.example`) |

*Required only if you want Strapi→Xano course sync on create/update.

**Steps for your friend:**
1. Copy `lifemonk-cms/.env.example` to `lifemonk-cms/.env`
2. Fill in Strapi secrets (see `.env.example`)
3. Optionally set `XANO_BASE_URL` if using course sync
4. Run: `cd lifemonk-cms && npm install && npm run develop`

---

## What to give your friend (safe to share)

| What | How |
|------|-----|
| **Repo access** | Pull from GitHub (no URLs in code) |
| **lifemonk-app URLs** | Send separately: `EXPO_PUBLIC_STRAPI_BASE_URL`, `EXPO_PUBLIC_XANO_AUTH_URL`, `EXPO_PUBLIC_XANO_BASE_URL` (e.g. Slack, email, 1Password share) |
| **Strapi .env** | They can use their own Strapi instance; or you send APP_KEYS, JWT_SECRET, etc. via a secure channel if they use your backend |

**Do NOT** commit `.env` files to GitHub. Only `.env.example` (no real values) is in the repo.
