# Testing checklist: Strapi ↔ Xano integration

Use this checklist to validate the Strapi → Xano sync and Xano → Strapi proxy behaviour.

---

## Prerequisites

- `.env` has at least:
  - `XANO_BASE_URL` (or `XANO_COURSES_BASE_URL` for sync and `XANO_MEMBERS_BASE_URL` for get_all_*)
  - `STRAPI_URL` (optional; defaults to http://localhost:1337)
- Xano has the required endpoints:
  - **Courses group:** `sync_course` (POST), `chapter` (POST), `chapter/:id` (PATCH)
  - **Members & Accounts group:** `get_all_users`, `get_all_schools`, `get_all_grades`
- Strapi is running (`npm run develop`).

---

## 1. Publish course → sync_course → xano_course_id

1. In Strapi Admin, create or edit a **Course** (set title, category, visibility, grades if needed).
2. **Publish** the course.
3. In the browser console or Strapi server logs, confirm:
   - `[Strapi→Xano] sync_course start` with title and chapter count.
   - `[Strapi→Xano] sync_course success course_id=…`
4. In Strapi, open the course again and confirm:
   - **xano_course_id** is set (numeric).
   - **strapi_document_id** is set (if you added the field).
5. In Xano, confirm the course exists (e.g. in the `course` table) with matching title, category, visibility_level, and grades/course_grade if applicable.

**If 404:** Check `XANO_BASE_URL` / `XANO_COURSES_BASE_URL` and that the **courses** API group has the `sync_course` endpoint.

**If 400:** Compare the payload keys to the Xano `sync_course` input (see `docs/STRAPI_XANO_SCHEMA_MAPPING.md` and your Xano endpoint definition). Ensure visibility_level is one of `public` | `restricted` | `hidden`.

---

## 2. Chapter sync

1. With a course that has **xano_course_id** set, add or edit a **Chapter** (title, chapter_type, order, content/video_url as needed).
2. **Publish** the chapter (or publish the course so all chapters sync).
3. In logs, confirm:
   - `[Strapi→Xano] chapter POST success chapter_id=…` or `chapter PATCH success`.
4. In Strapi, confirm the chapter has **xano_chapter_id** and **xano_course_id** set.
5. In Xano, confirm the chapter exists in the `chapter` table with correct `course_id`, `sequence_order`, `content_type`, etc.

**If chapter never syncs:** Ensure the course is published first and has `xano_course_id`. Chapter lifecycle needs `xano_course_id` on the chapter or on the related course.

---

## 3. get_all_* from admin (Mapping Control / Dashboard / Students)

1. Open Strapi Admin and go to the Mapping Control (or Dashboard / Students) page that loads schools, grades, or user count.
2. Confirm:
   - Schools dropdown or list loads (calls `/xano/schools` → Xano `get_all_schools`).
   - Grades dropdown loads (calls `/xano/grades` → Xano `get_all_grades`).
   - User/audience count loads (calls `/xano/user-count` → Xano `get_all_users`).
3. In server logs, confirm:
   - `[Strapi→Xano] request GET get_all_schools` (or get_all_grades, get_all_users) and `[Strapi→Xano] 200 …`.

**If 404:** Ensure `XANO_BASE_URL` or `XANO_MEMBERS_BASE_URL` points to the API group that has `get_all_schools`, `get_all_grades`, `get_all_users`.

**If count is 0:** Check that Xano returns an array; response shape is normalized in mapping-control (see `toArray`). If Xano returns `{ data: [...] }`, it is supported.

---

## 4. get_user_courses proxy

1. Call Strapi (as admin or with auth if required):  
   `GET /api/mapping-control/xano/user-courses`  
   Optionally add query params (e.g. `?student_id=1`) if your Xano `get_user_courses` expects them.
2. Confirm the response is the same shape as Xano’s `get_user_courses` (no stripping of keys).

---

## 5. 404 handling

1. Temporarily set `XANO_BASE_URL` to a wrong URL or to a group that does not have `sync_course`.
2. Publish a course.
3. In logs, confirm:
   - `[Strapi→Xano] 404 — Check XANO_BASE_URL and API group (courses vs Members & Accounts). Path: sync_course …`

---

## 6. 400 handling

1. If you have a way to send an invalid payload (e.g. wrong field name or type), trigger a 400 from Xano.
2. In logs, confirm:
   - `[Strapi→Xano] 400 — Compare payload keys to Xano table/endpoint input. Response: …`

---

## 7. Env missing

1. Temporarily unset `XANO_BASE_URL` (and `XANO_COURSES_BASE_URL` / `XANO_MEMBERS_BASE_URL` if you use them).
2. Publish a course or load a page that calls the Xano proxy.
3. In logs, confirm:
   - `[Strapi→Xano] XANO_BASE_URL (or XANO_COURSES_BASE_URL) not set — skipping …`  
   or  
   - `[mapping-control] XANO_BASE_URL (or XANO_MEMBERS_BASE_URL) not set — cannot fetch user count`.

---

## 8. No duplicate sync_course

1. Publish a course and wait for sync to finish.
2. Without changing the course, trigger an update (e.g. save again or touch a field).
3. In logs, confirm sync_course is not called twice within a few seconds (debounce should prevent duplicate calls for the same course within 3s).

---

## Summary

| Test | What to check |
|------|----------------|
| Course publish | sync_course called, xano_course_id and strapi_document_id set, course in Xano |
| Chapter sync | chapter POST/PATCH, xano_chapter_id set, chapter in Xano |
| get_all_* | Schools, grades, user count load in admin; no 404 |
| get_user_courses | Proxy returns full Xano response |
| 404 | Log suggests checking base URL and API group |
| 400 | Log suggests comparing payload to Xano input |
| Env missing | Warning logged, no crash |
| Debounce | No duplicate sync_course within 3s for same course |
