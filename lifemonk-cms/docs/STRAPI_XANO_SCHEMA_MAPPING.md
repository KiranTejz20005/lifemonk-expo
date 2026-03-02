# Strapi ↔ Xano schema mapping

Single source of truth for Xano tables, Strapi content types, field mapping, and relationships. React Native consumes **only Xano**; Strapi is not called by the mobile app.

---

## Mobile app flow (React Native)

- **User login** → Xano `auth/login`
- **Fetch courses** → Xano `get_user_courses`
- **Track progress** → Xano `update_student_progress`
- **Entitlement** → Xano `upsert_entitlement`
- **Certificates** → Xano `issue_certificate`

Strapi is used only for content authoring and admin; the app never calls Strapi directly.

---

## Entity mapping overview

| Xano table         | Strapi content type      | Direction   | Notes                                      |
|--------------------|--------------------------|------------|--------------------------------------------|
| course             | api::course.course       | Strapi → Xano | Authoring in Strapi; sync on publish       |
| chapter            | api::chapter.chapter     | Strapi → Xano | Authoring in Strapi; sync after course     |
| grade              | — (service only)         | Xano → Strapi | Fetched via get_all_grades                 |
| school             | — (service only)         | Xano → Strapi | Fetched via get_all_schools               |
| student            | — (service only)         | Xano → Strapi | Fetched via get_all_users                 |
| entitlement        | — (Xano only)            | —          | Managed via upsert_entitlement             |
| enrollment         | — (Xano only)            | —          | App/Xano only                              |
| student_progress   | — (Xano only)            | —          | App/Xano only                              |
| course_grade        | — (Xano only)            | —          | Synced via sync_course grades array        |

---

## Course

### Xano `course` table

| Xano field           | Xano type | Strapi attribute      | Strapi type | Mapping |
|----------------------|-----------|------------------------|-------------|---------|
| id                   | int       | (xano_course_id)       | integer     | Xano ID stored in Strapi after sync        |
| created_at           | timestamp | —                      | —           | Xano only                                 |
| title                | text      | title                  | string      | 1:1                                      |
| category             | text      | category.name          | relation→name | Sent as string in sync                   |
| visibility_level     | enum      | user_type_visibility   | enumeration | all→public, premium→restricted, ultra→hidden |
| thumbnail_url        | text      | cover_image.url        | media       | Full URL via STRAPI_URL in sync           |
| description          | text      | description            | richtext    | Extract text / strip HTML                 |
| total_chapters       | int       | (derived)              | —           | chapters.length in sync                   |
| strapi_document_id   | text      | strapi_document_id    | text        | documentId or id                          |

**Visibility enum mapping (Strapi → Xano):**

- Strapi `all` → Xano `public`
- Strapi `premium` → Xano `restricted`
- Strapi `ultra` → Xano `hidden`

### Relationships

- **course → chapter:** One-to-many (Xano: chapter.course → course.id). Strapi: course.chapters ↔ chapter.course.
- **course_grade:** Links course to grade (Xano course_grade.course, course_grade.grade). Strapi sends `grades` (array of grade IDs) in sync_course; Xano creates course_grade rows.

---

## Chapter

### Xano `chapter` table

| Xano field              | Xano type | Strapi attribute   | Strapi type   | Mapping |
|-------------------------|-----------|--------------------|---------------|---------|
| id                      | int       | (xano_chapter_id)  | integer       | Xano ID stored in Strapi after sync       |
| created_at              | timestamp | —                  | —             | Xano only                                |
| course                  | int (FK)  | course (xano_course_id) | relation  | Must have xano_course_id when syncing     |
| title                   | text      | title              | string        | 1:1                                      |
| sequence_order          | int       | order              | integer       | 1:1                                      |
| content_type            | enum      | chapter_type       | enumeration   | video/text/quiz/activity; mixed→text     |
| video_url               | text      | video_url          | string        | 1:1                                      |
| text_content            | text      | content            | richtext      | Extract text in sync                     |
| is_locked               | bool      | is_locked          | boolean       | 1:1                                      |
| requires_prev_completion| bool      | lock_depends_on_order | integer   | truthy → true                            |
| quiz_pass_required      | bool      | —                  | —             | Default false in sync                     |
| strapi_document_id      | text      | strapi_document_id | text         | documentId or id                         |

**content_type enum (Strapi chapter_type → Xano):**

- Strapi `video` → Xano `video`
- Strapi `text` → Xano `text`
- Strapi `quiz` → Xano `quiz`
- Strapi `activity` → Xano `activity`
- Strapi `mixed` → Xano `text`

### Relationships

- **chapter → course:** Many-to-one (chapter.course → course.id). Strapi sync uses course.xano_course_id.

---

## Grade (Xano only in Strapi; fetched via API)

| Xano field    | Xano type | Strapi / usage                    |
|---------------|-----------|-----------------------------------|
| id            | int       | get_all_grades returns id, name, level_number |
| created_at    | timestamp | —                                 |
| name          | text      | Display in dropdowns              |
| level_number  | int       | Optional numeric grade           |
| stage         | enum      | primary, middle, high             |

Strapi uses get_all_grades for Mapping Control and dropdowns; no Strapi content type.

---

## School (Xano only in Strapi; fetched via API)

| Xano field         | Xano type | Strapi / usage        |
|--------------------|-----------|------------------------|
| id                 | int       | get_all_schools        |
| created_at         | timestamp | —                      |
| name               | text      | Display / filter       |
| subscription_type  | enum      | basic, premium, ultra  |

Strapi uses get_all_schools for Mapping Control; no Strapi content type.

---

## Student (Xano only in Strapi; fetched via API)

| Xano field         | Xano type | Strapi / usage                    |
|--------------------|-----------|------------------------------------|
| id                 | int       | get_all_users                      |
| created_at         | timestamp | —                                  |
| name               | text      | Display                            |
| grade              | int (FK)  | → grade.id                         |
| school             | int (FK)  | → school.id                        |
| subscription_type  | enum      | basic, premium, ultra             |
| email              | email     | Display / filter                   |
| password           | password  | Never returned by get_all_users    |

Strapi uses get_all_users for audience count, Students page, Mapping Control; no Strapi content type.

---

## Entitlement (Xano only)

| Xano field         | Xano type | Notes                    |
|--------------------|-----------|--------------------------|
| id                 | int       | —                        |
| type               | enum      | school, subscription, user, grade |
| course             | int (FK)  | → course.id              |
| school             | int (FK)  | optional                 |
| subscription_type  | enum      | basic, premium, ultra    |
| student            | int (FK)  | optional                 |
| content_type       | enum      | course, workshop, byte, practice |
| content_id         | text      | Strapi document ID       |
| content_title      | text      | —                        |
| grade_ids          | json      | Array of grade IDs       |
| is_active          | bool      | —                        |
| assigned_by        | int (FK)  | → student.id             |

Managed via Xano `upsert_entitlement` from Strapi Course Mapping UI.

---

## Enrollment (Xano only)

| Xano field    | Xano type | Notes        |
|---------------|-----------|-------------|
| id            | int       | —           |
| student       | int (FK)  | → student   |
| course        | int (FK)  | → course    |
| enrolled_at   | timestamp | —           |
| enrollment_type | enum   | auto, manual |
| status        | enum      | active, completed, paused |

App/Xano only; no Strapi content type.

---

## Student progress (Xano only)

| Xano field        | Xano type | Notes |
|-------------------|-----------|-------|
| id                | int       | —     |
| student           | int (FK)  | → student |
| course            | int (FK)  | → course  |
| chapter           | int (FK)  | → chapter |
| completed         | bool      | —     |
| completed_at      | timestamp | —     |
| quiz_score        | decimal   | —     |
| watch_time_seconds| int       | —     |

App uses Xano `update_student_progress`; no Strapi content type.

---

## Course_grade (Xano only; synced via sync_course)

| Xano field | Xano type | Notes |
|------------|-----------|-------|
| id         | int       | —     |
| course     | int (FK)  | → course.id |
| grade      | int (FK)  | → grade.id  |

Strapi sends `grades` (array of grade IDs) in sync_course payload; Xano creates/updates course_grade or entitlement as per your endpoint logic.

---

## Foreign key summary

| From table       | To table | FK field  |
|------------------|----------|-----------|
| chapter          | course   | course    |
| course_grade     | course   | course    |
| course_grade     | grade    | grade     |
| entitlement     | course   | course    |
| entitlement     | school   | school    |
| entitlement     | student  | student, assigned_by |
| enrollment       | student  | student   |
| enrollment       | course   | course    |
| student_progress | student  | student   |
| student_progress | course   | course    |
| student_progress | chapter  | chapter   |
| student          | grade    | grade     |
| student          | school   | school    |

---

## Sync flow (Strapi → Xano)

1. **Course publish/update:** Build payload with strapi_document_id, title, category, visibility_level (mapped), is_published, thumbnail_url, description, total_chapters, grades. POST to `sync_course`. Persist returned course_id to course.xano_course_id.
2. **Chapters:** After course sync, for each chapter call chapter create/update (Option B) or include chapters in sync_course (Option A). Persist xano_chapter_id per chapter. Ensure chapter sync uses valid xano_course_id.
3. **Referential integrity:** Sync course first; then chapters. Do not sync chapter without xano_course_id.
