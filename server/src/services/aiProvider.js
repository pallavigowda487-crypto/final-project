import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';

const cleanModelName = (model) => model.replace(/^models\//, '');

class GeminiEmbeddings {
  constructor({ apiKey, model, dimensions }) {
    this.apiKey = apiKey;
    this.model = cleanModelName(model);
    this.dimensions = dimensions;
  }

  async embedQuery(text) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          content: { parts: [{ text: text.replace(/\n/g, ' ') }] },
          outputDimensionality: this.dimensions,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || `Gemini embedding request failed (${response.status})`;
      throw new Error(message);
    }

    return data.embedding?.values || [];
  }

  async embedDocuments(documents) {
    return Promise.all(documents.map((document) => this.embedQuery(document)));
  }
}

const resolveProvider = () => {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit) return explicit;
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  throw new Error('No AI API key configured. Set GROQ_API_KEY and/or GEMINI_API_KEY in .env');
};

const resolveEmbeddingProvider = () => {
  const explicit = process.env.EMBEDDING_PROVIDER?.toLowerCase();
  if (explicit) return explicit;
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  throw new Error(
    'Embeddings require GEMINI_API_KEY (recommended) or OPENAI_API_KEY. Groq does not provide embeddings.'
  );
};

/** Chat LLM for question generation and evaluation */
export const getChatModel = (temperature = 0.3) => {
  const provider = resolveProvider();

  if (provider === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is required when AI_PROVIDER=groq');
    }
    return new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature,
    });
  }

  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini');
    }
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      temperature,
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
  }
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature,
  });
};

/** Embeddings for Pinecone RAG (use Gemini or OpenAI — not Groq) */
export const getEmbeddings = () => {
  const provider = resolveEmbeddingProvider();

  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required when EMBEDDING_PROVIDER=gemini');
    }
    return new GeminiEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
      dimensions: getEmbeddingDimensions(),
    });
  }

  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  });
};

export const getEmbeddingDimensions = () => {
  const provider = resolveEmbeddingProvider();
  if (provider === 'gemini') return parseInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 10) || 768;
  return 1536;
};
