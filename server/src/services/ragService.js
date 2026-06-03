import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { langsmithRun } from '../config/langsmith.js';
import { getEmbeddings } from './aiProvider.js';

let pineconeClient = null;

const getPinecone = () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not configured');
  }
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pineconeClient;
};

const getIndex = () => {
  if (!process.env.PINECONE_INDEX) {
    throw new Error('PINECONE_INDEX is not configured');
  }
  return getPinecone().index(process.env.PINECONE_INDEX);
};

const getNamespaceRecordCount = (stats, namespace) => stats.namespaces?.[namespace]?.recordCount || 0;

export const getPineconeNamespaceStats = async (namespace) => {
  const index = getIndex();
  const stats = await index.describeIndexStats();
  return {
    namespace,
    recordCount: getNamespaceRecordCount(stats, namespace),
    totalRecordCount: stats.totalRecordCount || 0,
    dimension: stats.dimension,
  };
};

export const ingestSyllabus = async (text, namespace, metadata = {}) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitText(text);
  if (chunks.length === 0) {
    throw new Error('No text could be extracted from this syllabus file');
  }

  const embeddings = getEmbeddings();
  const index = getIndex();
  const namespacedIndex = index.namespace(namespace);

  const vectors = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${namespace}-chunk-${i}`;
    const embedding = await embeddings.embedQuery(
      chunks[i],
      langsmithRun('embed-syllabus-chunk', ['embeddings', 'ingest'], {
        chunkIndex: i,
        namespace,
        ...metadata,
      })
    );
    vectors.push({
      id: chunkId,
      values: embedding,
      metadata: {
        text: chunks[i].slice(0, 1000),
        chunkIndex: i,
        namespace,
        ...metadata,
      },
    });
  }

  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    await namespacedIndex.upsert(vectors.slice(i, i + batchSize));
  }

  const firstVector = await namespacedIndex.fetch([vectors[0].id]);
  if (!firstVector.records?.[vectors[0].id]) {
    throw new Error('Pinecone accepted the upload, but the vector could not be verified');
  }

  const pineconeStats = await getPineconeNamespaceStats(namespace);
  return {
    chunkCount: chunks.length,
    pineconeVectorCount: vectors.length,
    pineconeIndexDimension: pineconeStats.dimension || vectors[0]?.values.length,
    chunks,
  };
};

export const retrieveContext = async (query, namespace, topK = 5) => {
  const embeddings = getEmbeddings();
  const queryEmbedding = await embeddings.embedQuery(
    query,
    langsmithRun('embed-retrieval-query', ['embeddings', 'retrieval'], { namespace, topK })
  );
  const index = getIndex();

  const results = await index.namespace(namespace).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  const citations = (results.matches || []).map((match) => ({
    chunkId: match.id,
    excerpt: match.metadata?.text?.slice(0, 300) || '',
    score: match.score,
  }));

  const context = citations.map((c) => c.excerpt).join('\n\n');
  return { context, citations };
};

export const createNamespace = (syllabusId) => `syllabus-${syllabusId}`;
