/**
 * LangSmith tracing for LangChain (RAG, question gen, evaluation).
 * https://smith.langchain.com
 *
 * Set LANGSMITH_TRACING=true and LANGSMITH_API_KEY in .env
 */
export const initLangSmith = () => {
  const apiKey = process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY;
  const tracingEnabled =
    process.env.LANGSMITH_TRACING === 'true' ||
    process.env.LANGCHAIN_TRACING_V2 === 'true';

  if (!tracingEnabled || !apiKey) {
    if (tracingEnabled && !apiKey) {
      console.warn('LangSmith tracing is enabled but LANGSMITH_API_KEY is missing');
    }
    return { enabled: false };
  }

  process.env.LANGCHAIN_TRACING_V2 = 'true';
  process.env.LANGCHAIN_API_KEY = apiKey;
  process.env.LANGCHAIN_PROJECT =
    process.env.LANGCHAIN_PROJECT ||
    process.env.LANGSMITH_PROJECT ||
    'exam-platform';
  process.env.LANGCHAIN_ENDPOINT =
    process.env.LANGCHAIN_ENDPOINT ||
    process.env.LANGSMITH_ENDPOINT ||
    'https://api.smith.langchain.com';

  console.log(`LangSmith tracing ON → project: ${process.env.LANGCHAIN_PROJECT}`);

  return {
    enabled: true,
    project: process.env.LANGCHAIN_PROJECT,
  };
};

/** RunnableConfig for tagged LangChain invocations */
export const langsmithRun = (runName, tags = [], metadata = {}) => ({
  runName,
  tags: ['exam-platform', ...tags],
  metadata,
});
