Now I'll create a comprehensive master prompt for Cursor that covers the entire LifeMonk system architecture and integration flow:

***

# 🎯 **LifeMonk System - Master Cursor Prompt**

## **System Architecture Overview**

You are working on **LifeMonk**, a three-tier education platform with bidirectional data flow:

1. **lifemonk-cms** (Strapi 5) — Content Management System for courses, categories, and mapping control
2. **my-workspace** (Xano) — Backend API with authentication, user management, courses, and entitlements
3. **lifemonk-app** (Expo/React Native) — Mobile application consuming Xano APIs

**Critical Integration Flow:**
```
Strapi CMS ←→ Xano Backend ←→ React Native App
   (Admin)      (Single Source    (Student/User)
                 of Truth)
```

***

## **🔄 Data Flow Architecture**

### **Strapi → Xano (Admin Creates/Assigns Content)**
1. Admin creates/edits courses, chapters, categories in Strapi
2. Strapi syncs content to Xano via `xano-sync.js` service
3. Admin uses **Mapping Control** to assign courses to user groups/grades/schools
4. Mapping assignments saved to:
   - Strapi `mapping` table (audit/history)
   - Xano `entitlement` table (runtime rules)

### **Xano → React Native App (Students Consume Content)**
1. App calls `auth/login` for authentication
2. App fetches courses via `get_user_courses` (merges `course_grade` + `entitlement`)
3. Entitlement logic filters courses by:
   - Student's `subscription_type` (Premium/Ultra/School)
   - Student's `grade` level
   - Student's `school` affiliation
4. App displays entitled courses and tracks progress

***

## **📂 Repository Structure**

```
lifemonk/
├── lifemonk-cms/                    # Strapi 5 CMS
│   ├── .env                         # XANO_MEMBERS_BASE_URL, XANO_COURSES_BASE_URL
│   ├── src/
│   │   ├── admin/extensions/
│   │   │   └── MappingPage.js       # UI: grades, schools, categories, courses, assign
│   │   ├── api/
│   │   │   ├── category/            # Strapi category content-type
│   │   │   ├── course/              # Strapi course content-type
│   │   │   ├── chapter/             # Strapi chapter content-type
│   │   │   └── mapping/             # Strapi mapping content-type
│   │   ├── plugins/mapping-control/
│   │   │   └── server/index.js      # Custom routes for Xano proxy
│   │   └── services/
│   │       ├── xano-client.js       # Centralized Xano HTTP client
│   │       └── xano-sync.js         # Course/chapter sync to Xano
│   └── docs/
│       ├── XANO_STRAPI_CONFIG.md
│       └── MAPPING_WHERE_AND_HOW_IT_APPLIES.md
│
├── my-workspace/                    # Xano Workspace
│   └── api/
│       ├── authentication/          # auth/login, create_student, magic links
│       ├── members_accounts/        # get_all_users, schools, grades, user_role
│       ├── courses/                 # get_user_courses, sync_course, entitlement
│       └── event_logs/              # User activity tracking
│
└── lifemonk-app/                    # Expo/React Native App
    ├── app/                         # Expo Router screens
    ├── services/                    # API client for Xano
    └── .env                         # XANO_BASE_URL (points to Xano instance)
```

***

## **🔑 Environment Configuration**

### **lifemonk-cms/.env**
```bash
# Members & Accounts API Group (get_all_users, get_all_schools, get_all_grades)
XANO_MEMBERS_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:dwhFu4S5

# Courses API Group (get_all_courses, get_user_courses, upsert_entitlement, sync_course)
XANO_COURSES_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC

# Legacy base URL (used for auth and other endpoints)
XANO_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC
```

### **lifemonk-app/.env**
```bash
# Points to Xano Courses API Group (primary)
XANO_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:j1bkW6GC
```

**⚠️ CRITICAL:** No trailing slashes in base URLs!

***

## **🛠 Key API Endpoints**

### **Strapi → Xano Proxy Routes** (`lifemonk-cms/src/plugins/mapping-control/server/index.js`)

| Route | Purpose | Xano Endpoint |
|-------|---------|---------------|
| `POST /api/mapping-control/assign` | Save mapping to Strapi + Xano entitlement | `upsert_entitlement` |
| `GET /api/mapping-control/xano/catalog` | Fetch categories + courses (optimized) | `get_all_courses` |
| `GET /api/mapping-control/xano/categories` | Derive categories from courses | `get_all_courses` |
| `GET /api/mapping-control/xano/courses` | All courses for mapping | `get_all_courses` |
| `GET /api/mapping-control/xano/grades` | Grades 1-12 (sorted) | `get_all_grades` |
| `GET /api/mapping-control/xano/schools` | All schools | `get_all_schools` |
| `GET /api/mapping-control/xano/user-count` | Count users by group/grades/schools | `get_all_users` (filtered) |

### **Xano Endpoints (my-workspace)**

#### **Authentication API Group**
- `POST auth/login` — User authentication (returns JWT)
- `POST create_student` — New student registration
- `POST reset/request-reset-link` — Password reset

#### **Members & Accounts API Group**
- `GET get_all_users` — All users (supports filtering)
- `GET get_all_schools` — All schools
- `GET get_all_grades` — Grade levels 1-12
- `PATCH user/edit_profile` — Update user profile
- `POST admin/user_role` — Assign roles

#### **Courses API Group** ⭐ **MOST IMPORTANT**
- `GET get_user_courses?student_id=X` — Returns courses for student based on:
  - `course_grade` table (grade-level assignments)
  - `entitlement` table (mapping control rules)
- `POST sync_course` — Sync course from Strapi to Xano
- `POST upsert_entitlement` — Create/update entitlement rule
- `POST update_student_progress` — Track lesson/chapter completion
- `POST submit_quiz_attempt` — Quiz submissions
- `POST issue_certificate` — Generate completion certificate

#### **Event Logs API Group**
- `GET logs/user/my_events` — User activity log
- `GET logs/admin/account_events` — Admin audit trail

***

## **🎯 Critical Business Logic**

### **Entitlement System (How Mapping Applies)**

**Xano `entitlement` Table Schema:**
```javascript
{
  id: integer,
  course_id: integer,              // FK to course table
  subscription_type: string,       // "Premium", "Ultra", "School"
  grade: integer,                  // 1-12 or null (all grades)
  school_id: integer,              // FK to school table or null (all schools)
  asset_type: string,              // "course", "workshop", "book", etc.
  created_at: timestamp,
  updated_at: timestamp
}
```

**`get_user_courses` Logic (Xano):**
```javascript
// 1. Get student details (grade, subscription_type, school_id)
const student = await db.student.findOne({ id: student_id });

// 2. Get courses from course_grade (direct grade assignments)
const gradeBasedCourses = await db.course_grade
  .filter({ grade: student.grade })
  .with('course');

// 3. Get courses from entitlement (mapping control rules)
const entitledCourses = await db.entitlement
  .filter({
    subscription_type: student.subscription_type,  // Match subscription
    OR: [
      { grade: student.grade },                     // Match grade
      { grade: null }                               // Or applies to all grades
    ],
    OR: [
      { school_id: student.school_id },             // Match school
      { school_id: null }                           // Or applies to all schools
    ]
  })
  .with('course');

// 4. Merge and deduplicate courses
return uniqueCourses([...gradeBasedCourses, ...entitledCourses]);
```

### **Mapping Control Flow (Strapi Admin)**

**Step 1: Select Audience**
- User Group: Premium / Ultra / School
- Grades: Multi-select checkboxes (1-12, sorted)
- Schools: Multi-select checkboxes (from Xano `get_all_schools`)

**Step 2: Select Assets**
- Category: Dropdown (from Xano `get_all_courses` → derive categories)
- Courses: Multi-select list (filtered by category)
- Other Assets: Workshop, Book, Byte, etc. (optional)

**Step 3: Preview**
- Calls `GET /api/mapping-control/xano/user-count` with filters
- Shows: "This assignment will apply to **X users**"

**Step 4: Confirm**
```javascript
// On confirm, for each selected course:
await strapiAPI.post('/api/mappings', {
  data: {
    userGroup, grades, schools, courseId, category, otherAssets
  }
});

// Then sync to Xano:
await xanoAPI.post('/upsert_entitlement', {
  course_id: courseId,
  subscription_type: userGroup,
  grade: grades.length === 1 ? grades[0] : null,  // null = all grades
  school_id: schools.length === 1 ? schools[0] : null,  // null = all schools
  asset_type: 'course'
});
```

***

## **🐛 Common Issues & Fixes**

### **Issue 1: "WARN [getUserEntitledContent] 500"**
**Cause:** App calling wrong endpoint or missing entitlement data  
**Fix:**
1. Verify `lifemonk-app/.env` has correct `XANO_BASE_URL` (Courses API group)
2. Check Xano `get_user_courses` endpoint includes entitlement logic
3. Ensure `student_id` parameter is valid

### **Issue 2: "403 Forbidden" in Mapping Control**
**Cause:** Strapi trying to call `/api/users` (no permission)  
**Fix:** Already fixed! Now uses `/api/mapping-control/xano/user-count`

### **Issue 3: "No schools in Xano"**
**Cause:** `get_all_schools` returns empty or wrong API group  
**Fix:**
1. Check `XANO_MEMBERS_BASE_URL` in `lifemonk-cms/.env`
2. Verify `my-workspace/api/members_accounts/get_all_schools` exists
3. Response should be: `{ schools: [...] }` or `[...]`

### **Issue 4: Courses not showing in app after mapping**
**Cause:** Entitlement not synced or `get_user_courses` missing logic  
**Fix:**
1. Check Xano `entitlement` table has records
2. Verify `get_user_courses` merges `course_grade` + `entitlement`
3. Log student's `subscription_type`, `grade`, `school_id` to debug filters

### **Issue 5: "Entitled courses loaded: 0"**
**Cause:** Student has no matching entitlements  
**Debug:**
```javascript
// In Xano get_user_courses, add debug logs:
console.log('Student:', student);
console.log('Entitlements found:', entitlements.length);
console.log('Course grade found:', courseGrades.length);
```

***

## **📋 Development Checklist**

### **When Adding/Modifying a Course**
- [ ] Create/edit course in Strapi CMS
- [ ] Verify course syncs to Xano (`sync_course` called automatically)
- [ ] Check Xano `course` table has record
- [ ] Use Mapping Control to assign course to user groups
- [ ] Verify `entitlement` table has new records
- [ ] Test in app with student account matching criteria

### **When Adding a New Grade/School**
- [ ] Add to Xano Members & Accounts database tables
- [ ] Verify `get_all_grades` / `get_all_schools` returns new data
- [ ] Check Mapping Control dropdown shows new options
- [ ] Create test student with new grade/school
- [ ] Verify entitlement filtering works

### **When Debugging App Not Showing Courses**
1. [ ] Check app logs for API errors
2. [ ] Verify student's `subscription_type`, `grade`, `school_id` in Xano
3. [ ] Query `entitlement` table manually: `subscription_type = "Premium" AND (grade = 5 OR grade IS NULL)`
4. [ ] Test `get_user_courses?student_id=X` in Xano API playground
5. [ ] Add console.logs in Xano function stack
6. [ ] Check network tab in React Native Debugger

***

## **🚀 Quick Start Commands**

### **Strapi CMS**
```bash
cd lifemonk-cms
cp .env.example .env   # Edit with your Xano URLs
npm install
npm run develop        # Opens http://localhost:1337/admin
```

### **Xano Workspace**
1. Open [xano.com](https://xano.com)
2. Navigate to **my-workspace**
3. Deploy endpoints in:
   - Authentication group
   - Members & Accounts group
   - Courses group ⭐ (most important)

### **React Native App**
```bash
cd lifemonk-app
cp .env.example .env   # Edit with Xano Courses API URL
npm install
npx expo start         # Opens Metro bundler
```

***

## **🧪 Testing Flow**

### **End-to-End Test: Assign Course to Grade 10 Premium Students**

1. **Strapi Admin:**
   - Login to [http://localhost:1337/admin](http://localhost:1337/admin)
   - Navigate to Mapping Control
   - Select: User Group = "Premium", Grades =, Category = "Science", Course = "Physics 101" [youtube](https://www.youtube.com/watch?v=odvt67MvcvA)
   - Preview → Should show user count
   - Confirm → Creates mapping + entitlement

2. **Xano Database:**
   - Open Xano → Courses API → Database → `entitlement` table
   - Should see new record: `{ course_id: X, subscription_type: "Premium", grade: 10, school_id: null }`

3. **React Native App:**
   - Login as student with: `subscription_type = "Premium"`, `grade = 10`
   - Navigate to Courses screen
   - Should see "Physics 101" in course list
   - Verify course is NOT visible to Grade 9 student

4. **API Test (Xano Playground):**
   ```javascript
   // Test student: id = 16, grade = 10, subscription_type = "Premium"
   GET /get_user_courses?student_id=16
   
   // Should return courses from:
   // - course_grade where grade = 10
   // - entitlement where subscription_type = "Premium" AND (grade = 10 OR grade IS NULL)
   ```

***

## **💡 Best Practices**

### **Code Organization**
- All Xano HTTP calls from Strapi go through `xano-client.js` (single source of truth)
- Environment variables NEVER have trailing slashes
- Use descriptive variable names: `subscription_type` not `subType`
- Always handle `null` values in entitlement filters (means "applies to all")

### **Error Handling**
```javascript
// Good: Detailed error logging
try {
  const response = await xanoClient.get('/get_all_courses');
  return response.data;
} catch (error) {
  console.error('[xano-client] get_all_courses failed:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });
  throw error;
}
```

### **Performance Optimization**
- Use `/xano/catalog` endpoint instead of separate `/categories` + `/courses` calls
- Preload grades and schools on Mapping page mount (parallel requests)
- Cache course data in React Native app (reduce API calls)
- Index Xano `entitlement` table on: `subscription_type`, `grade`, `school_id`

### **Security**
- Never expose Xano API keys in frontend
- Strapi acts as proxy to hide Xano URLs
- React Native app only calls authenticated Xano endpoints
- Validate all user inputs before querying database

***

## **📚 Key Files Reference**

### **Most Important Files**

1. **`lifemonk-cms/src/services/xano-client.js`**  
   Centralized Xano HTTP client (all Strapi→Xano calls)

2. **`lifemonk-cms/src/plugins/mapping-control/server/index.js`**  
   Custom API routes for Mapping Control

3. **`lifemonk-cms/src/admin/extensions/MappingPage.js`**  
   UI for assigning courses to user groups/grades/schools

4. **`my-workspace/api/courses/get_user_courses_GET.xs`** ⭐ **CRITICAL**  
   Merges `course_grade` + `entitlement` for student course list

5. **`my-workspace/api/courses/upsert_entitlement_POST.xs`**  
   Creates/updates entitlement rules from Mapping Control

***

## **🎓 Onboarding Quick Reference**

**New developer joining the project? Read in this order:**

1. This master prompt (overview)
2. `lifemonk-cms/docs/XANO_STRAPI_CONFIG.md` (setup)
3. `lifemonk-cms/docs/MAPPING_WHERE_AND_HOW_IT_APPLIES.md` (entitlement logic)
4. `my-workspace/api/courses/README_GET_USER_COURSES.md` (course filtering)
5. Run local Strapi → Test Mapping Control → Check Xano tables → Test in app

**First task:** Assign "Math 101" to Grade 8 Ultra students, verify in app.

***

## **🆘 Emergency Debugging**

### **App shows 0 courses for student**

```bash
# 1. Check student data
curl -X GET "https://your-xano.io/api:GROUP/get_all_users" \
  | jq '.[] | select(.id == STUDENT_ID)'

# 2. Check entitlement table
# In Xano UI: Database → entitlement → Filter by subscription_type

# 3. Test get_user_courses directly
curl -X GET "https://your-xano.io/api:GROUP/get_user_courses?student_id=STUDENT_ID"

# 4. Check Xano function stack logs
# In Xano UI: API → courses → get_user_courses → Run & Debug
```

### **Mapping Control not loading**

```bash
# 1. Check Strapi logs
cd lifemonk-cms
npm run develop  # Watch terminal for errors

# 2. Test Xano endpoints manually
curl -X GET "http://localhost:1337/api/mapping-control/xano/schools"
curl -X GET "http://localhost:1337/api/mapping-control/xano/grades"
curl -X GET "http://localhost:1337/api/mapping-control/xano/catalog"

# 3. Check .env file
cat .env | grep XANO  # Verify no trailing slashes
```

***

## **🎯 Cursor AI Instructions**

When working on this project:

1. **Always check environment variables first** when debugging API issues
2. **Use `xano-client.js`** for new Xano API calls (don't create direct fetch calls)
3. **Test in Xano playground** before implementing in Strapi
4. **Follow conventional commits**: `feat(mapping):`, `fix(xano):`, `docs(cms):`
5. **Update this prompt** if you discover new patterns or fixes
6. **Ask clarifying questions** about subscription_type, grade, or school_id filtering before implementing
7. **Check Xano database tables** visually after making entitlement changes

**When making changes:**
- Strapi changes → Restart `npm run develop`
- Xano changes → Re-deploy endpoint → Test in playground
- App changes → Reload Expo with `r` key in terminal

**Priority order for debugging:**
1. Check logs (Strapi terminal, Xano debug, React Native console)
2. Verify environment variables
3. Test API endpoints manually (curl or Xano playground)
4. Check database records (Xano UI)
5. Add console.logs, don't assume

***

## **✅ Success Criteria**

Your implementation is correct when:

- [ ] Admin can assign courses in Mapping Control without 403 errors
- [ ] Grades dropdown shows 1-12 in order
- [ ] Schools dropdown shows all schools from Xano
- [ ] User count preview shows accurate number
- [ ] Entitlement records created in Xano after confirm
- [ ] App shows courses matching student's subscription + grade + school
- [ ] No 500 errors in app for `get_user_courses`
- [ ] Different students see different courses based on rules
- [ ] Course sync from Strapi to Xano works automatically

***

**Last Updated:** March 3, 2026  
**System Version:** Strapi 5 + Xano + Expo SDK 52  
**Maintained By:** LifeMonk Development Team

***

This master prompt should be saved in your project root as `CURSOR_MASTER_PROMPT.md` and referenced whenever you open the project in Cursor. Would you like me to help you debug the specific "500 error" you're seeing in the app logs?