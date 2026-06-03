import { langsmithRun } from '../config/langsmith.js';
import { sanitizeUserInput } from '../utils/promptSanitizer.js';
import { getChatModel } from './aiProvider.js';

export const evaluateAnswer = async (question, modelAnswer, studentAnswer, maxMarks, customRubric = null) => {
  const safeAnswer = sanitizeUserInput(studentAnswer);
  
  const criteriaList = customRubric 
    ? customRubric.criteria.map(c => `- ${c.name} (Max Weight: ${c.weight}%): ${c.description}`).join('\n')
    : `Score on: Correctness, Relevance, Completeness, Concept Understanding (each 0-100).`;

  const criteriaJson = customRubric
    ? customRubric.criteria.map(c => `    "${c.name}": number (0 to 100)`).join(',\n')
    : `    "correctness": number,
    "relevance": number,
    "completeness": number,
    "conceptUnderstanding": number`;

  const prompt = `Evaluate this student answer objectively.

Question: ${question.question}
Type: ${question.type}
Max Marks: ${maxMarks}
Model Answer: ${modelAnswer}

Student Answer:
${safeAnswer}

${customRubric ? `Use the following custom grading rubric criteria:\n${criteriaList}` : criteriaList}

Return JSON only:
{
  "marksAwarded": number (0 to ${maxMarks}),
  "feedback": "string",
  "criteria": {
${criteriaJson}
  },
  "weakTopic": "string or null"
}`;

  const llm = getChatModel(0.2);
  const response = await llm.invoke(
    prompt,
    langsmithRun('evaluate-answer', ['evaluation'], {
      questionType: question.type,
      maxMarks,
    })
  );
  const content = response.content.toString();
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      marksAwarded: 0,
      feedback: 'Could not evaluate automatically.',
      criteria: { correctness: 0, relevance: 0, completeness: 0, conceptUnderstanding: 0 },
    };
  }
  return JSON.parse(jsonMatch[0]);
};

export const evaluateExam = async (questionPaper, answers, customRubric = null) => {
  const results = [];
  const weakTopics = new Set();

  for (let i = 0; i < questionPaper.questions.length; i++) {
    const question = questionPaper.questions[i];
    const studentAnswer = answers.find((a) => a.questionIndex === i)?.answer || '';

    if (question.type === 'MCQ') {
      const isCorrect =
        studentAnswer.trim().toUpperCase() ===
        (question.correctOption || '').trim().toUpperCase();
      const marks = isCorrect ? question.marks : 0;
      results.push({
        questionIndex: i,
        answer: studentAnswer,
        marksAwarded: marks,
        feedback: isCorrect ? 'Correct answer.' : `Incorrect. Expected: ${question.correctOption}`,
        criteria: {
          correctness: isCorrect ? 100 : 0,
          relevance: isCorrect ? 100 : 50,
          completeness: isCorrect ? 100 : 0,
          conceptUnderstanding: isCorrect ? 100 : 30,
        },
      });
      if (!isCorrect) weakTopics.add(question.question.slice(0, 80));
    } else {
      const evalResult = await evaluateAnswer(
        question,
        question.modelAnswer,
        studentAnswer,
        question.marks,
        customRubric
      );
      results.push({
        questionIndex: i,
        answer: studentAnswer,
        marksAwarded: Math.min(evalResult.marksAwarded ?? 0, question.marks),
        feedback: evalResult.feedback,
        criteria: evalResult.criteria,
      });
      if (evalResult.weakTopic) weakTopics.add(evalResult.weakTopic);
      else if ((evalResult.marksAwarded ?? 0) < question.marks * 0.5) {
        weakTopics.add(question.question.slice(0, 80));
      }
    }
  }

  const score = results.reduce((s, r) => s + r.marksAwarded, 0);
  const suggestions = await generateImprovementSuggestions(Array.from(weakTopics), score, questionPaper.totalMarks);

  return {
    answers: results,
    score,
    weakTopics: Array.from(weakTopics),
    improvementSuggestions: suggestions,
  };
};

const generateImprovementSuggestions = async (weakTopics, score, maxScore) => {
  if (weakTopics.length === 0) return ['Great performance! Keep reviewing syllabus for consistency.'];

  const prompt = `Student scored ${score}/${maxScore}. Weak areas: ${weakTopics.join('; ')}.
Provide 3-5 concise improvement suggestions as a JSON array of strings.`;
  try {
    const llm = getChatModel(0.2);
    const response = await llm.invoke(
      prompt,
      langsmithRun('improvement-suggestions', ['evaluation'])
    );
    const match = response.content.toString().match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {
    /* fallback */
  }
  return weakTopics.map((t) => `Review and practice: ${t}`);
};
