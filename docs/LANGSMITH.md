# LangSmith Integration

LangSmith traces all LangChain operations: syllabus embeddings, RAG retrieval, question generation, and answer evaluation.

## Setup

1. Create a free account at [smith.langchain.com](https://smith.langchain.com)
2. Go to **Settings → API Keys** and create a key
3. Add to `server/.env`:

```env
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_pt_xxxxxxxx
LANGSMITH_PROJECT=exam-platform
```

4. Restart the server — you should see:

```
LangSmith tracing ON → project: exam-platform
```

## What gets traced

| Run name | Tags | When |
|----------|------|------|
| `embed-syllabus-chunk` | embeddings, ingest | Faculty uploads syllabus |
| `embed-retrieval-query` | embeddings, retrieval | Question paper generation |
| `generate-question-paper` | question-generation, rag | LLM generates questions |
| `evaluate-answer` | evaluation | Student short/long answers graded |
| `improvement-suggestions` | evaluation | Post-exam feedback |

## Dashboard

Open [smith.langchain.com](https://smith.langchain.com) → select project **exam-platform** → view runs, latency, inputs/outputs, and errors.

## Production (Vercel)

Add the same env vars in your Vercel API project (Settings → Environment Variables):

- `LANGSMITH_TRACING=true`
- `LANGSMITH_API_KEY` (secret)
- `LANGSMITH_PROJECT=exam-platform`

## Disable tracing

Set `LANGSMITH_TRACING=false` or remove `LANGSMITH_API_KEY`.

## Alternative env names

Also supported (LangChain standard):

- `LANGCHAIN_TRACING_V2=true`
- `LANGCHAIN_API_KEY=...`
- `LANGCHAIN_PROJECT=exam-platform`
