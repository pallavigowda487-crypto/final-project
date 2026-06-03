import { langsmithRun } from '../config/langsmith.js';
import { buildSafePrompt } from '../utils/promptSanitizer.js';
import { getChatModel } from './aiProvider.js';
import { retrieveContext } from './ragService.js';

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const QUESTION_TYPES = ['MCQ', 'Short Answer', 'Long Answer'];

export const generateQuestionPaper = async ({
  syllabus,
  subject,
  numQuestions,
  difficulty,
  bloomLevel,
  questionTypes,
}) => {
  const query = `${subject} ${bloomLevel} ${difficulty} exam questions`;
  const { context, citations } = await retrieveContext(query, syllabus.pineconeNamespace, 8);

  if (!context || context.length < 50) {
    throw new Error('Insufficient syllabus content retrieved. Ensure syllabus is processed.');
  }

  const types = questionTypes?.length ? questionTypes : ['MCQ', 'Short Answer', 'Long Answer'];
  const prompt = buildSafePrompt(
    context,
    `Generate exactly ${numQuestions} exam questions for subject "${subject}".
Difficulty: ${difficulty}
Bloom Taxonomy Level: ${bloomLevel}
Question types to use (rotate): ${types.join(', ')}

Return valid JSON only with this structure:
{
  "title": "string",
  "questions": [
    {
      "type": "MCQ|Short Answer|Long Answer",
      "question": "string",
      "options": ["A","B","C","D"] or null for non-MCQ,
      "correctOption": "A" or null,
      "modelAnswer": "string",
      "marks": number,
      "bloomLevel": "${bloomLevel}",
      "difficulty": "${difficulty}"
    }
  ]
}
Each question MUST be answerable only from the syllabus context. Include varied marks (2-10).`
  );

  const llm = getChatModel(0.4);
  const response = await llm.invoke(
    prompt,
    langsmithRun('generate-question-paper', ['question-generation', 'rag'], {
      subject,
      difficulty,
      bloomLevel,
      numQuestions,
      syllabusId: syllabus._id?.toString(),
    })
  );
  const content = response.content.toString();

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse generated questions');

  const parsed = JSON.parse(jsonMatch[0]);
  const questions = (parsed.questions || []).slice(0, numQuestions).map((q, i) => ({
    ...q,
    bloomLevel: bloomLevel || BLOOM_LEVELS[0],
    difficulty: difficulty || DIFFICULTIES[1],
    citations: citations.slice(i % citations.length, (i % citations.length) + 1),
  }));

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const marksDistribution = {};
  questions.forEach((q) => {
    marksDistribution[q.type] = (marksDistribution[q.type] || 0) + (q.marks || 0);
  });

  return {
    title: parsed.title || `${subject} Question Paper`,
    questions,
    totalMarks,
    marksDistribution,
    difficulty,
    bloomLevel,
  };
};
