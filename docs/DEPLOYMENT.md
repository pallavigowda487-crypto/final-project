# Deployment Guide

## Architecture

```
[Vercel - React]  →  [Vercel - Express API]  →  [MongoDB Atlas]
                              ↓
                    [Groq / Gemini] + [Pinecone]
```

Deploy **two** Vercel projects from the same GitHub repo (one for `client`, one for `server`).

---

## 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create database user and whitelist IP `0.0.0.0/0`
3. Copy connection string → `MONGODB_URI`

---

## 2. Pinecone

1. Create account at [pinecone.io](https://www.pinecone.io)
2. Create index:
   - **Name**: `exam-syllabus-index` (or match `PINECONE_INDEX`)
   - **Dimensions**: `768` for Gemini `text-embedding-004`, or `1536` for OpenAI embeddings
   - **Metric**: `cosine`
3. Copy API key → `PINECONE_API_KEY`

---

## 3. AI APIs (Groq + Gemini)

**Groq** (fast chat — question generation & evaluation):

1. Get API key from [console.groq.com](https://console.groq.com)
2. Set `GROQ_API_KEY`, `AI_PROVIDER=groq`, `GROQ_MODEL=llama-3.3-70b-versatile`

**Google Gemini** (embeddings for RAG — required with Groq):

1. Get API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Set `GEMINI_API_KEY`, `EMBEDDING_PROVIDER=gemini`
3. Pinecone index must use **768 dimensions** for `text-embedding-004`

Optional: set `AI_PROVIDER=gemini` to use Gemini for both chat and embeddings.

---

## 4. Deploy Backend (Vercel)

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Create a project for the API:
   - **Project name**: e.g. `exam-platform-api`
   - **Root Directory**: `server`
   - **Framework Preset**: Other (Vercel auto-detects Express in `src/index.js`)
4. Add environment variables from `server/.env.example` (Production):
   - `NODE_ENV` = `production`
   - `MONGODB_URI`, `JWT_SECRET`, `API_KEY`
   - `GROQ_API_KEY`, `GEMINI_API_KEY`, `AI_PROVIDER`, `EMBEDDING_PROVIDER`
   - `PINECONE_API_KEY`, `PINECONE_INDEX`
   - LangSmith vars if used
   - `FRONTEND_URL` — set **after** frontend deploy (your Vercel app URL, no trailing slash)
5. Deploy and note the API URL, e.g. `https://exam-platform-api.vercel.app`

**Vercel notes for the API**

- `server/vercel.json` sets `maxDuration: 60` (requires [Vercel Pro](https://vercel.com/docs/functions/runtimes#max-duration) for more than 10s on Hobby). RAG and LLM routes may need Pro.
- Keep `MAX_FILE_SIZE_MB` at **4** or lower on Hobby (request body limit ~4.5 MB).
- Syllabus uploads use in-memory storage (no persistent disk on Vercel).

---

## 5. Deploy Frontend (Vercel)

1. **Add New Project** again (same repo, second project)
2. Settings:
   - **Project name**: e.g. `exam-platform`
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
3. Environment variables:
   - `VITE_API_URL` = `https://your-api.vercel.app/api` (your backend project URL + `/api`)
   - `VITE_API_KEY` = same as server `API_KEY`
4. Deploy

5. In the **backend** Vercel project, set `FRONTEND_URL` to your frontend URL (e.g. `https://exam-platform.vercel.app`) and redeploy.

---

## 6. Post-Deploy Setup

### Create admin (via API once deployed)

```bash
curl -X POST https://your-api.vercel.app/api/admin/seed-admin \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"name":"Admin","email":"admin@exam.com","password":"YourSecurePass123"}'
```

`seed-admin` is disabled when `NODE_ENV=production` unless configured otherwise in your routes.

### Verify health

```bash
curl https://your-api.vercel.app/health
```

---

## Security Checklist

- [ ] Strong `JWT_SECRET` (32+ random chars)
- [ ] Unique `API_KEY` for frontend-backend
- [ ] Never commit `.env` files
- [ ] MongoDB IP whitelist configured
- [ ] CORS `FRONTEND_URL` matches frontend Vercel URL exactly (no trailing slash)
- [ ] `NODE_ENV=production` on the API project
- [ ] AI/Pinecone keys only on the server project

---

## Local Development

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Frontend proxies `/api` to `localhost:5000` via Vite config.

Test API on Vercel locally (optional):

```bash
cd server && npx vercel dev
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | `FRONTEND_URL` must match the frontend Vercel URL exactly |
| 403 API key | `VITE_API_KEY` must match server `API_KEY` |
| Pinecone errors | Gemini embeddings need dimension **768**; OpenAI needs **1536** |
| Syllabus upload fails | Use PDF/DOCX; on Hobby keep files under ~4 MB |
| Function timeout | Upgrade to Pro or reduce RAG/LLM work per request; check Vercel function logs |
| 504 on generate/evaluate | Increase `maxDuration` in `server/vercel.json` (Pro plan) |
