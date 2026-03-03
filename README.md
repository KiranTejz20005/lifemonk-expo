# LifeMonk — Strapi CMS + Xano + Mapping Control

This repo contains **lifemonk-cms** (Strapi) and **lifemonk-app** (Expo/React Native). The CMS uses **Xano** for grades, schools, users, courses, and entitlements. Assignments from the **Mapping Control** page are stored in Strapi and in Xano’s **entitlement** table so the app can show courses by rules, grades, and subscriptions.

---

## What’s in this repo

| Folder | Description |
|--------|-------------|
| **lifemonk-cms** | Strapi 5 CMS: content types (Course, Chapter, Category, Mapping), Mapping Control plugin, Xano proxy routes |
| **lifemonk-app** | Expo/React Native app: learns from Xano (get_user_courses, auth, progress) |

---

## What we did (summary)

### 1. Mapping Control (Strapi admin)

- **Mapping page** in Strapi admin: “Assign Course to a Separate Category” flow.
- **Audience:** Select User Group (Premium / Ultra / School), then **Select Grades** (1–12, sorted) and/or **Select Schools** (from Xano).
- **Assets:** **Category** dropdown and **Course** list (from Xano + Strapi), plus Other Assets (Workshop, Book, Byte, etc.).
- **Preview & Confirm:** User count from Xano; on **Confirm**, mappings are saved to Strapi and to Xano **entitlement** via `upsert_entitlement`.

### 2. Xano integration (Strapi → Xano)

- **xano-client** (`lifemonk-cms/src/services/xano-client.js`): single place for all Strapi→Xano HTTP calls. Uses `XANO_BASE_URL`, `XANO_MEMBERS_BASE_URL`, `XANO_COURSES_BASE_URL`.
- **mapping-control plugin** (`lifemonk-cms/src/plugins/mapping-control/server/index.js`):  
  - **POST /api/mapping-control/assign** — saves mapping in Strapi and calls Xano `upsert_entitlement` per course (no 403).  
  - **GET /api/mapping-control/xano/catalog** — one Xano call for categories + courses (faster).  
  - **GET /api/mapping-control/xano/categories** — categories derived from courses.  
  - **GET /api/mapping-control/xano/courses** — all courses.  
  - **GET /api/mapping-control/xano/grades** — grades (Members & Accounts).  
  - **GET /api/mapping-control/xano/schools** — schools (Members & Accounts).  
  - **GET /api/mapping-control/xano/user-count** — user count by group/grades/schools (fixes 403 from Strapi `/api/users`).

### 3. Entitlement and how mapping applies

- **Strapi:** `api::mapping.mapping` stores each assignment (audit).
- **Xano:** `entitlement` table stores the same rules (via `upsert_entitlement`). This is what the app uses.
- **get_user_courses** in Xano (courses API group) was updated to return courses from **course_grade** and from **entitlement** (by student’s subscription_type and school) so Mapping Center rules apply to what students see.

### 4. Performance and UX

- **Catalog endpoint:** One request for categories + courses instead of two (fewer round-trips).
- **Preload:** Schools and grades are fetched with the initial batch so the Mapping page loads faster.
- **User count:** Uses Xano user-count endpoint instead of Strapi `/api/users` (avoids 403).

### 5. Fixes and robustness

- **403:** Mapping page no longer calls Strapi `/api/users`; it uses `/api/mapping-control/xano/user-count`.
- **Categories empty:** Fallback: derive categories from the course list when category APIs return empty; robust parsing for Strapi/Xano shapes.
- **Schools “No schools in Xano”:** Schools loaded from Members & Accounts (`get_all_schools`); preloaded on mount; response parsing for array / `data` / `schools`; clearer empty-state message and `.env` guidance.
- **Grades:** Sorted 1–12 in the dropdown; labels and school labels shown next to checkboxes.
- **Xano base URLs:** Separate **Members** and **Courses** base URLs in `.env` so `get_all_schools`/grades/users and `get_all_courses`/entitlement hit the right API groups (no 404).

### 6. Config and docs

- **lifemonk-cms/.env:** `XANO_BASE_URL`, `XANO_MEMBERS_BASE_URL`, `XANO_COURSES_BASE_URL` (no trailing slash). See `lifemonk-cms/.env.example`.
- **lifemonk-cms/docs/XANO_STRAPI_CONFIG.md** — Xano + Strapi setup, entitlement table, checklist for 200 OK.
- **lifemonk-cms/docs/MAPPING_WHERE_AND_HOW_IT_APPLIES.md** — Where mapping is stored and how it applies to students/courses.
- **my-workspace** (Xano endpoint definitions): `get_all_schools`, `get_all_grades`, `get_all_users`, `get_all_courses`, `get_user_courses` (course_grade + entitlement), `upsert_entitlement`. See `my-workspace/api/courses/README_GET_USER_COURSES.md` for get_user_courses.

---

## Quick start

### 1. Strapi (lifemonk-cms)

```bash
cd lifemonk-cms
cp .env.example .env   # then edit .env with your Xano URLs
npm install
npm run develop
```

In **lifemonk-cms/.env** set at least:

- **XANO_MEMBERS_BASE_URL** — Members & Accounts API (get_all_grades, get_all_schools, get_all_users). Example: `https://x8ki-letl-twmt.n7.xano.io/api:dwhFu4S5`
- **XANO_COURSES_BASE_URL** — Courses API (get_all_courses, get_user_courses, upsert_entitlement). Example: `https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC`

### 2. Xano

- **Members & Accounts** group: deploy `get_all_users`, `get_all_schools`, `get_all_grades`.
- **Courses** group: deploy `get_all_courses`, `get_user_courses` (with entitlement logic), `upsert_entitlement`.
- In Xano, **edit** the existing **GET get_user_courses** in the courses group (do not add a duplicate); use the version that merges **course_grade** and **entitlement**.

### 3. App (lifemonk-app)

- Point the app at your Xano base URL; it uses `get_user_courses` and other endpoints from the Courses (and auth) groups.

---

## Repo structure (relevant parts)

```
lifemonk/
├── lifemonk-cms/                    # Strapi CMS
│   ├── .env                         # XANO_* URLs (do not commit secrets)
│   ├── src/
│   │   ├── admin/extensions/
│   │   │   └── MappingPage.js       # Mapping Control UI (grades, schools, categories, courses, assign)
│   │   ├── api/
│   │   │   ├── category/            # Strapi category content type
│   │   │   ├── course/              # Strapi course content type
│   │   │   └── mapping/             # Strapi mapping content type
│   │   ├── plugins/mapping-control/
│   │   │   └── server/index.js      # Routes: assign, xano/catalog, xano/categories, xano/courses, xano/grades, xano/schools, xano/user-count
│   │   └── services/
│   │       ├── xano-client.js       # Strapi → Xano HTTP client
│   │       └── xano-sync.js         # Course/chapter sync to Xano
│   └── docs/
│       ├── XANO_STRAPI_CONFIG.md
│       └── MAPPING_WHERE_AND_HOW_IT_APPLIES.md
├── lifemonk-app/                    # Expo app (consumes Xano)
└── README.md                        # This file
```

---

## Conventional commits (recent)

- `docs(cms): update .env.example for Xano Courses and Members base URLs`
- `feat(mapping-control): add /xano/catalog endpoint and optimize categories/schools`
- `feat(mapping): use catalog and Xano user-count, preload schools and grades`

---

## See also

- **lifemonk-cms/XANO_ENDPOINTS_MAPPING.md** — Strapi vs Xano endpoint mapping and missing endpoints.
- **lifemonk-cms/docs/TESTING_STRAPI_XANO.md** — Testing checklist for Strapi and Xano.
