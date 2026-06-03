# Demo Video Instructions

Record a 5–10 minute walkthrough for your capstone submission or portfolio.

## Suggested Structure

### 1. Introduction (30 sec)
- Project name and problem statement
- Tech stack overview (React, Node, MongoDB, Pinecone, LangChain, OpenAI)

### 2. Architecture (1 min)
- Show architecture diagram or README
- Explain: Frontend → API Gateway → Auth → RAG → LLM → Pinecone

### 3. Faculty Flow (3 min)
1. Login as faculty
2. Upload a syllabus PDF (e.g. Data Structures)
3. Show syllabus status = `ready` with chunk count
4. Generate paper: Medium, Analyze, 10 questions
5. Show generated questions with model answers
6. Download PDF
7. Assign exam to a student

### 4. Student Flow (2 min)
1. Login as student
2. Open assigned exam
3. Answer MCQ and short/long questions
4. Submit and show AI evaluation results
5. Show dashboard: scores, weak topics, suggestions
6. Download feedback PDF

### 5. Admin Flow (1 min)
1. Login as admin
2. Show user management
3. Show API usage and audit logs
4. Show system metrics

### 6. Security & Deployment (1 min)
- Mention JWT, API key, rate limiting, env variables
- Show Vercel + Render deployment URLs

## Recording Tips

- Use 1080p screen recording (OBS, Loom, or Zoom)
- Use incognito/clean browser profile
- Pre-seed test accounts: faculty, student, admin
- Use a real but short syllabus PDF for believable RAG output
- Highlight that questions come **only** from uploaded syllabus (RAG citations)

## Sample Script Line

> "When faculty uploads a syllabus, our backend extracts text, chunks it, generates embeddings via OpenAI, and stores them in Pinecone. During question generation, we retrieve the top relevant chunks and pass them as the only context to GPT — ensuring questions cannot drift outside the syllabus."

## Deliverables Checklist

- [ ] Demo video (MP4, linked in README or portfolio)
- [ ] GitHub repository link
- [ ] Live Vercel frontend URL
- [ ] Live Render API URL
- [ ] README with setup instructions
