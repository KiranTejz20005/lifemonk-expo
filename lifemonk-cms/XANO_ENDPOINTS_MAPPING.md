# Xano ↔ Strapi CMS Endpoint Mapping

This document compares what the Strapi CMS (lifemonk) codebase expects from Xano with your current Xano API. Wrong mappings have been fixed in code; missing endpoints are listed with steps to create them in Xano.

---

## Comparison Table

| Strapi / App usage | Xano path expected | Your Xano endpoints | Status |
|--------------------|--------------------|---------------------|--------|
| Mapping Control, Dashboard, Students, Settings | `get_all_users` | Not in list | **Missing** – create below |
| Mapping Control, Dashboard, Schools, Course Mapping | `get_all_schools` | Not in list | **Missing** – create below |
| Mapping Control (grades dropdown) | `get_all_grades` or `grade` | Not in list | **Missing** – create below |
| Students page – add student | `create_user` | You have `create_student` | **Fixed** – code now calls `create_student` |
| Course Mapping – save entitlement | `save_entitlement` | You have `upsert_entitlement` | **Fixed** – code now calls `upsert_entitlement` |
| Course Mapping – Category dropdown | `get_all_categories` or `get_all_courses` | **Added** in my-workspace | **OK** – Strapi derives categories from courses if needed |
| Course Mapping, lifecycles | `sync_course` | `sync_course` (#3592157 / #3595081) | **OK** |
| xano-sync service (course/chapter publish) | `course`, `course/:id`, `chapter`, `chapter/:id`, `course_grade` | Not in API list (may be REST/CRUD in another group) | **Note** – see “Other” below |
| lifemonk-app (mobile) | `get_course_progress` | You have `get_user_courses` | **Note** – different name; confirm if same purpose |

---

## Fixes applied in code

1. **StudentsPage.tsx** – Create user: `create_user` → **`create_student`** (your existing endpoint).
2. **CourseMappingPage.tsx** – Entitlement: `save_entitlement` → **`upsert_entitlement`** (your existing endpoint). Request body is unchanged (content_type, content_id, content_title, grade_ids, subscription_type, school_id, is_active, assigned_by).

---

## Missing endpoints in Xano – create these

The CMS needs these three **GET** endpoints that return **arrays of records**. They are now **defined in code** in `my-workspace/api/members_accounts/`:

- `get_all_users_GET.xs`
- `get_all_schools_GET.xs`
- `get_all_grades_GET.xs`

**Push to Xano:** Sync or deploy the `my-workspace` folder to your Xano project using your usual process (CLI, workspace import, or manual copy). Then set `XANO_BASE_URL` to the **Members & Accounts** API group base URL so Strapi can call these endpoints.

If you prefer to create them manually in Xano instead, follow the steps below.

---

### 1. `get_all_users`

**Purpose:** List all users/students for Mapping Control (audience count, preview), Dashboard, Students page, Settings.

- **Method:** GET  
- **Path:** `get_all_users`  
- **Returns:** JSON array of user/student objects. Each object should support at least:
  - `subscription_type` or `user_type` (e.g. `"premium"`, `"ultra"`, `"basic"`)
  - `grade` (number or string, e.g. 1–12)
  - `school_id` or `school_name` (for “School” audience filtering)

**Step-by-step in Xano:**

1. Open your API group (the one in `XANO_BASE_URL`).
2. Add endpoint: **New endpoint** → **GET**.
3. Path: `get_all_users`.
4. In the function stack:
   - Add **Database** → **Query all records**.
   - Select table: **student** (or your users table).
   - Choose fields to return (id, name, email, subscription_type, grade, school_id/school_name, etc.).
   - No filter = return all records.
5. Set **Result** to return the query result (array).
6. Save and set endpoint to **Public** if Strapi calls it without auth.

---

### 2. `get_all_schools`

**Purpose:** Populate “Select Schools” in Mapping Control and school dropdowns elsewhere.

- **Method:** GET  
- **Path:** `get_all_schools`  
- **Returns:** JSON array of school objects. Each object should have at least:
  - `id` (or equivalent)
  - `name` (school name)

**Step-by-step in Xano:**

1. Same API group → **New endpoint** → **GET**.
2. Path: `get_all_schools`.
3. In the function stack:
   - **Database** → **Query all records**.
   - Select table: **school**.
   - Return fields: at least `id`, `name` (and `subscription_type` if you use it).
4. Result = query result (array).
5. Save and set to **Public** if needed.

---

### 3. `get_all_grades`

**Purpose:** Populate “Select Grades” in Mapping Control (no hardcoded 1–12).

- **Method:** GET  
- **Path:** `get_all_grades`  
- **Returns:** JSON array of grade objects. Each object should have at least one of:
  - `id` and/or `number` (e.g. 1–12) and/or `name` (e.g. `"Grade 1"`).

**Step-by-step in Xano:**

1. Same API group → **New endpoint** → **GET**.
2. Path: `get_all_grades`.
3. In the function stack:
   - **Database** → **Query all records**.
   - Select table: **grade**.
   - Return fields: e.g. `id`, `number`, `name` (or whatever your grade table has).
4. Result = query result (array).
5. Save and set to **Public** if needed.

---

## Optional: REST-style paths used by xano-sync

The file `src/services/xano-sync.js` (and possibly lifecycles) uses these paths when publishing courses/chapters from Strapi:

- **POST** `course` – create course  
- **PATCH** `course/:id` – update course  
- **POST** `course_grade` – link course to grade  
- **POST** `chapter` – create chapter  
- **PATCH** `chapter/:id` – update chapter  

If you already use **sync_course** from Strapi for all course/chapter sync, you may not need these REST endpoints; they are an alternative path used by the xano-sync service. If you do use xano-sync, ensure either:

- These paths exist in the same API group (e.g. as REST resource endpoints), or  
- You switch Strapi to use only **sync_course** and disable or remove the xano-sync calls to `course`, `chapter`, `course_grade`.

---

## Summary

- **Fixed in code:** `create_user` → `create_student`, `save_entitlement` → `upsert_entitlement`.
- **Create in Xano:** `get_all_users`, `get_all_schools`, `get_all_grades` (GET, return arrays).
- **Already aligned:** `sync_course`.
- **Confirm:** Whether `get_user_courses` in Xano is what the app uses for “course progress” (app currently calls `get_course_progress`).

After you create the three GET endpoints, set `XANO_BASE_URL` in `.env` to your API base (e.g. `https://your-instance.n7.xano.io/api:yourGroupId`) and restart Strapi so Mapping Control, Dashboard, Students, and Schools all load data from Xano.

---

## Categories and courses (Select Assets)

Mapping Control "2. Select Assets" shows a **Category** dropdown and then **Course** list. Categories and courses are loaded from **Xano** as well as Strapi:

- **GET** `/api/mapping-control/xano/categories` – returns a list of categories. The plugin first tries a Xano endpoint `get_all_categories`; if that is missing or empty, it calls `get_all_courses` (or `course` / `courses`) and derives unique category names from the `category` field of each course.
- **GET** `/api/mapping-control/xano/courses` – returns all courses (for filtering by category in the UI). The plugin calls `get_all_courses` or `course` / `courses`.

**In Xano (courses API group):** Ensure you have an endpoint that returns all courses with at least `id`, `title`, and `category`. A sample is in `my-workspace/api/courses/get_all_courses_GET.xs`. Deploy it to your **courses** API group, then set `XANO_COURSES_BASE_URL` in Strapi `.env` to that group’s base URL (e.g. `https://your-instance.n7.xano.io/api:COURSES_GROUP_ID`). If you use a single API group for both members and courses, `XANO_BASE_URL` is enough.
