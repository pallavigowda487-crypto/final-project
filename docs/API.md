# API Documentation

Base URL: `https://your-api.onrender.com/api` (production) or `http://localhost:5000/api` (local)

## Headers (all protected routes)

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <jwt_token>` |
| `X-API-Key` | Your `API_KEY` from env |
| `Content-Type` | `application/json` |

---

## Authentication

### POST `/auth/register`

Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "secure123",
  "role": "student"
}
```

**Response:** `{ success, token, user }`

### POST `/auth/login`

**Body:** `{ "email", "password" }`

### GET `/auth/me`

Returns current user. Requires JWT.

---

## Faculty Routes

Requires role: `faculty` or `admin`

### POST `/faculty/syllabus/upload`

`multipart/form-data`: `file` (PDF/DOCX), `subject`

### GET `/faculty/syllabus`

List uploaded syllabi.

### POST `/faculty/papers/generate`

**Body:**
```json
{
  "syllabusId": "mongoId",
  "numQuestions": 10,
  "difficulty": "Medium",
  "bloomLevel": "Analyze",
  "questionTypes": ["MCQ", "Short Answer", "Long Answer"]
}
```

### GET `/faculty/papers`

List generated papers.

### GET `/faculty/papers/:id/pdf`

Download question paper PDF (includes model answers and marks distribution).

### POST `/faculty/exams/assign`

**Body:**
```json
{
  "questionPaperId": "mongoId",
  "studentIds": ["id1", "id2"],
  "title": "Mid-term Exam"
}
```

### GET `/faculty/performance`

Student performance stats and subject analytics.

### GET `/faculty/students`

List active students for assignment.

---

## Student Routes

Requires role: `student`

### GET `/student/exams`

List assigned exams.

### GET `/student/exams/:id`

Get exam questions (or results if evaluated).

### POST `/student/exams/:id/submit`

**Body:**
```json
{
  "answers": [
    { "questionIndex": 0, "answer": "A" },
    { "questionIndex": 1, "answer": "Binary search has O(log n)..." }
  ]
}
```

**Response:** Score, feedback, weak topics, improvement suggestions.

### GET `/student/reports`

List feedback reports.

### GET `/student/reports/:id/pdf`

Download feedback report PDF.

### GET `/student/dashboard`

Exam history, average score, weak topics, suggestions.

---

## Admin Routes

Requires role: `admin`

### GET `/admin/users`

### PATCH `/admin/users/:id`

Body: `{ isActive, role }`

### DELETE `/admin/users/:id`

Soft-deactivate user.

### GET `/admin/api-usage`

API usage logs and summary (last 7 days).

### GET `/admin/audit-logs`

Critical action audit trail.

### GET `/admin/metrics`

System evaluation metrics.

### POST `/admin/seed-admin` (dev only)

Create/promote admin user.

---

## Health

### GET `/health`

No auth required.

```json
{ "success": true, "status": "ok" }
```

---

## Error Responses

```json
{ "success": false, "message": "Error description" }
```

| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden / invalid API key |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
