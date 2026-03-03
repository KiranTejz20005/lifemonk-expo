# Where Mapping Is Stored and How It Applies to Students & Courses

This document explains where assignment/mapping data lives and how to make it the single source of truth so **all features** (course list, progress, certificates, etc.) follow the rules from the **Mapping Center** in Strapi.

---

## 1. Where the mapping is stored

When you click **Confirm** in the Strapi Mapping page (“Assign Course to a Separate Category” / Mapping Control), the same mapping is stored in **two places**:

| Store | Purpose |
|-------|--------|
| **Strapi** – `api::mapping.mapping` | CMS record and audit. Admin can review what was assigned. |
| **Xano** – `entitlement` table (via `upsert_entitlement`) | **Source of truth for the app.** The mobile app does **not** call Strapi; it only calls Xano. So the copy that actually controls “which courses a student sees” is the **Xano entitlement** table. |

So:

- **Strapi mapping** = admin history and reporting.
- **Xano entitlement** = rules that apply to students and courses. All app features should follow these rules.

---

## 2. How the mapping should apply (end-to-end)

For the mapping to apply to students and courses everywhere:

1. **Mapping Center (Strapi)**  
   You assign: audience (grade(s), school(s), subscription type) + assets (courses).  
   → Strapi saves a mapping record and calls Xano `upsert_entitlement` for each course.  
   → **Xano `entitlement` table** gets rows like: “Course X is entitled for grade_ids [1,2,3], subscription_type premium, school 5”.

2. **App loads “My courses”**  
   The app calls Xano **`get_user_courses`** (with the logged-in student).  
   → This endpoint must **use the `entitlement` table** (and optionally existing `course_grade` logic) to decide which courses to return.  
   → Only courses that match the student’s **grade**, **subscription_type**, and **school** (per entitlement rules) should be returned.

3. **Other features**  
   Progress, certificates, quizzes, etc. already work on “the set of courses the user has”. Once `get_user_courses` returns only entitlement-based courses, those features automatically follow the mapping rules.

So the one critical place that must “follow the mapping” is **Xano `get_user_courses`**: it must include courses from **entitlement** (by student’s grade, subscription_type, school), not only from the old `course_grade` logic.

---

## 3. What you need to do in Xano

Today, **`get_user_courses`** in your Xano workspace only uses **`course_grade`** (and the student’s grade). It does **not** yet read from the **`entitlement`** table. So mappings you create in the Mapping Center are saved to `entitlement` but do not yet change what the app shows.

To make the mapping apply to students and courses (and all features that depend on “user’s courses”):

- **Update `get_user_courses` in Xano** so that it also returns courses that come from **`entitlement`** and match the current student:
  - **Student fields to use:** `student.grade`, `student.subscription_type`, `student.school` (or equivalent IDs).
  - **Entitlement rules:**  
    - `content_type = 'course'`, `is_active = true`.  
    - Match **subscription_type** (e.g. entitlement.subscription_type = student.subscription_type, or “all” if you use a wildcard).  
    - Match **grade**: student’s grade is in `entitlement.grade_ids` (JSON array), or `grade_ids` is null/empty for “all grades”.  
    - Match **school**: entitlement.school = student.school, or entitlement.school = 0 / null for “all schools”.
  - For each matching entitlement, resolve **`content_id`** to a course (e.g. Xano course id or lookup by `strapi_document_id`), then add that course to the response (with progress if you have `student_progress`).
  - Merge with any courses you still want from **course_grade** (e.g. by grade), then **deduplicate** by course id so the user sees a single list.

After this change, “mapping” = what’s in **Xano entitlement**; **`get_user_courses`** = the only place that turns that into “courses for this student.” All features that use “user’s courses” will then follow the Mapping Center rules.

---

## 4. Summary

| Question | Answer |
|----------|--------|
| **Where should the mapping be stored?** | It is stored in **Strapi** (mapping content type) and in **Xano** (`entitlement` table via `upsert_entitlement`). The copy that drives the app is **Xano entitlement**. |
| **How does it apply to students and courses?** | The app gets “my courses” from Xano **`get_user_courses`**. That endpoint must use **`entitlement`** (by grade, subscription_type, school) so only entitled courses are returned. |
| **Do all features follow the mapping?** | Yes, once `get_user_courses` is entitlement-based: course list, progress, certificates, and any other feature that depends on “user’s courses” will follow the Mapping Center rules. |

If you want, the next step is to implement the **`get_user_courses`** logic in your Xano workspace (or in `my-workspace` as a reference) so it merges **course_grade** and **entitlement** and returns only courses that match the student’s grade, subscription type, and school.
