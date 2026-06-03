# AI-Powered Exam Paper Generator and Evaluation Platform

Production-ready full-stack platform for syllabus-based question paper generation (RAG + Pinecone), online exams, and AI-powered answer evaluation.

## Features

- **Authentication**: JWT, bcrypt, role-based access (Admin, Faculty, Student)
- **Faculty**: Upload syllabus (PDF/DOCX), RAG-indexed question generation, PDF export, exam assignment, performance analytics
- **Student**: Take exams, AI evaluation, feedback reports, weak-topic analysis
- **Admin**: User management, API usage monitoring, audit logs, system metrics
- **RAG Pipeline**: LangChain + Pinecone + OpenAI embeddings — questions generated only from syllabus context
- **Security**: API key layer, rate limiting, input validation, prompt injection defense, audit logging

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, Chart.js |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Vector DB | Pinecone |
| AI | Groq / Google Gemini / OpenAI (via LangChain) |
| Deploy | Vercel (frontend + backend) |

## Project Structure

```
├── client/          # React frontend (Vercel)
├── server/          # Express API (Vercel)
├── docs/            # API & deployment guides
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Pinecone account (create index: dimension **1536**, metric **cosine**)
- Groq API key (chat) and/or Google Gemini API key (embeddings + chat)

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api and VITE_API_KEY
npm install
npm run dev
```

### 3. Create Admin (development only)

```bash
curl -X POST http://localhost:5000/api/admin/seed-admin \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name":"Admin","email":"admin@exam.com","password":"admin123"}'
```

## Environment Variables

See `server/.env.example` and `client/.env.example`.

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `GROQ_API_KEY` | Groq API key for chat (server only) |
| `GEMINI_API_KEY` | Google Gemini key for embeddings/RAG (server only) |
| `AI_PROVIDER` | `groq`, `gemini`, or `openai` |
| `PINECONE_API_KEY` | Pinecone API key (server only) |
| `PINECONE_INDEX` | Pinecone index name |
| `API_KEY` | Shared key between frontend and backend |
| `FRONTEND_URL` | Vercel URL for CORS |

## Workflow Example

1. **Faculty** registers and uploads `Data Structures Syllabus.pdf`
2. Backend extracts text → chunks → embeds → stores in Pinecone
3. Faculty selects: Medium difficulty, Analyze bloom level, 10 questions
4. RAG retrieves relevant chunks → LLM generates questions with citations
5. Faculty downloads PDF and assigns exam to students
6. **Student** takes exam and submits answers
7. AI evaluates answers (correctness, relevance, completeness, concept understanding)
8. Student views scores, weak topics, and downloads feedback PDF

## Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Demo Video Instructions](docs/DEMO_VIDEO.md)
- [LangSmith Tracing](docs/LANGSMITH.md)

## License

MIT — suitable for capstone projects and portfolios.
