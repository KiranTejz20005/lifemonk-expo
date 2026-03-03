# Xano + Strapi config (no 404, 200 OK)

Use this so assignments from Strapi Mapping Center are stored in Xano **entitlement** and apply to students (courses by rules, grades, subscriptions).

---

## 1. Strapi `.env` (lifemonk-cms)

Create or edit `lifemonk-cms/.env` with **at least**:

```env
# Required: API group that has upsert_entitlement, get_user_courses, sync_course, get_all_courses
# Use the SAME base URL if one Xano API group has all of these
XANO_BASE_URL=https://YOUR_INSTANCE.n7.xano.io/api:YOUR_COURSES_GROUP_ID

# If Members & Accounts (get_all_grades, get_all_schools, get_all_users) is a DIFFERENT group:
# XANO_MEMBERS_BASE_URL=https://YOUR_INSTANCE.n7.xano.io/api:MEMBERS_GROUP_ID

# If Courses (upsert_entitlement, get_user_courses, sync_course) is a DIFFERENT group:
# XANO_COURSES_BASE_URL=https://YOUR_INSTANCE.n7.xano.io/api:COURSES_GROUP_ID
```

Rules:

- **No trailing slash** on base URLs.
- **Same group for everything:** set only `XANO_BASE_URL` to that group’s base (e.g. `https://x8ki-letl-twmt.n7.xano.io/api:dwhFu4S5`).
- **Two groups:** set `XANO_BASE_URL` to one, and `XANO_COURSES_BASE_URL` and/or `XANO_MEMBERS_BASE_URL` to the others.

Strapi uses:

- **Courses base** (`XANO_COURSES_BASE_URL` or `XANO_BASE_URL`) for: `upsert_entitlement`, `get_user_courses`, `sync_course`, `get_all_courses`, `get_all_categories`.
- **Members base** (`XANO_MEMBERS_BASE_URL` or `XANO_BASE_URL`) for: `get_all_grades`, `get_all_schools`, `get_all_users`, `get_all_categories` (if you derive from courses).

---

## 2. Xano API group (Courses) – endpoints that must exist

In the Xano **Courses** API group (the one used as `XANO_COURSES_BASE_URL` or `XANO_BASE_URL`), ensure these endpoints exist and return **200** (not 404):

| Method | Path (relative to base URL) | Purpose |
|--------|-----------------------------|--------|
| POST   | `upsert_entitlement`        | Strapi Mapping Center saves assignments into `entitlement` table. |
| GET    | `get_user_courses`          | App loads courses for the logged-in student (must use `entitlement` + rules). |
| GET    | `get_all_courses`           | Strapi loads course list for Category/Course dropdown. |
| POST   | `sync_course`               | Strapi syncs course/chapter to Xano (optional for mapping-only). |

Path must match exactly what Strapi calls (e.g. `upsert_entitlement` with no prefix). Base URL examples:

- `https://x8ki-letl-twmt.n7.xano.io/api:dwhFu4S5`  
  → POST `https://x8ki-letl-twmt.n7.xano.io/api:dwhFu4S5/upsert_entitlement`

---

## 3. Xano entitlement table (structure is correct)

Your **entitlement** table is the right shape for the Mapping Control Center. No schema changes are required.

| Field | Used by Mapping Center | Notes |
|-------|------------------------|--------|
| id, created_at | Auto | — |
| **type** | Yes | Set to `"school"` when school_id > 0, else `"subscription"`. |
| **course** | Yes (optional) | Set when Strapi sends a numeric course id so you can join in get_user_courses. |
| **school** | Yes | From school_id (0 = all schools). |
| **subscription_type** | Yes | basic \| premium \| ultra (Strapi sends these; "school" is sent as "premium"). |
| **content_type** | Yes | `"course"`. |
| **content_id** | Yes | Course identifier (Xano id or Strapi document id). |
| **content_title** | Yes | Course name. |
| **grade_ids** | Yes | JSON array of grade numbers, e.g. `[1, 2, 3]`. |
| **is_active** | Yes | true. |
| **assigned_by** | Yes | 1 (or your admin user id). |
| student | No | Left null for subscription/school-based rules. |

Strapi sends all of the “Used by Mapping Center” fields when you click Confirm; optional **course_id** is sent when the selected course has a numeric id so the **course** FK is filled.

---

## 4. Strapi → Xano: assignment flow (200 OK)

When you click **Confirm** on the Mapping page:

1. Strapi calls **POST** `{XANO_COURSES_BASE_URL or XANO_BASE_URL}/upsert_entitlement` with JSON:
   - `content_type: "course"`
   - `content_id`: course id (Xano id or Strapi document id)
   - `content_title`: course name
   - `grade_ids`: array of grade numbers, e.g. `[1, 2, 3]`
   - `subscription_type`: `"premium"` | `"ultra"` | `"basic"` (and `"school"` is sent as `"premium"` for Xano)
   - `school_id`: number (0 = all schools)
   - `is_active`: true
   - `assigned_by`: 1

2. If the Courses base URL is correct and the endpoint path is `upsert_entitlement`, the response should be **200** and the row is stored in **entitlement**.

3. **404** usually means: wrong base URL, or the endpoint path in Xano is different (e.g. extra prefix). Fix the base URL or the path in Strapi so it matches Xano.

---

## 5. Applying mappings to students (get_user_courses)

So that “mapping applies to the content/courses we pass to students”:

- **get_user_courses** in Xano must return courses that:
  - Come from **course_grade** (by student’s grade), and/or
  - Come from **entitlement** where:
    - `content_type = 'course'`, `is_active = true`
    - `subscription_type` matches the student’s subscription (or “all”)
    - `school` matches the student’s school or is 0 (all schools)
    - `grade_ids` contains the student’s grade (or is null/empty for all grades)

Then merge and deduplicate, and return the same response shape as today so the app keeps working.

A reference implementation for **get_user_courses** that uses the entitlement table is in:

- **my-workspace:** `api/courses/REFERENCE_get_user_courses_with_entitlements.md`
- Optional replacement: `api/courses/get_user_courses_GET.xs` can be updated to merge **course_grade** + **entitlement** (see that REFERENCE file).

---

## 6. Required .env (copy into lifemonk-cms/.env)

```env
# Required: base URL of the Xano API group that has upsert_entitlement + get_user_courses (no trailing slash)
XANO_BASE_URL=https://YOUR_INSTANCE.n7.xano.io/api:YOUR_COURSES_GROUP_ID

# If Members (grades, schools, users) is a different group, add:
# XANO_MEMBERS_BASE_URL=https://YOUR_INSTANCE.n7.xano.io/api:MEMBERS_GROUP_ID
```

Replace with your actual instance and group id. If one API group has both `upsert_entitlement` and `get_all_grades`/schools/users, use that group for `XANO_BASE_URL`.

## 7. Checklist (no 404, 200 OK)

- [ ] `lifemonk-cms/.env` has `XANO_BASE_URL` (and optionally `XANO_COURSES_BASE_URL`, `XANO_MEMBERS_BASE_URL`) with **no trailing slash**.
- [ ] In Xano, the **Courses** API group has endpoint **upsert_entitlement** (POST) and path is exactly `upsert_entitlement`.
- [ ] In Xano, **entitlement** table exists and accepts the fields above; **subscription_type** is basic | premium | ultra.
- [ ] After clicking Confirm in Strapi Mapping, Strapi logs show `[mapping-control] Xano entitlement saved 200 for <content_id>` (no 404).
- [ ] **get_user_courses** in Xano uses **entitlement** (updated in `my-workspace/api/courses/get_user_courses_GET.xs`) so students see courses from Mapping Center rules, grades, and subscriptions.
- [ ] **content_id** in entitlement: use Xano course **id** (integer) when assigning from Strapi so `get_user_courses` can resolve by `course.id`. If you use Strapi documentId, resolve course by `strapi_document_id` in Xano.
