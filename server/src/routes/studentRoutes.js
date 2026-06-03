import express from 'express';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import Exam from '../models/Exam.js';
import QuestionPaper from '../models/QuestionPaper.js';
import Report from '../models/Report.js';
import Rubric from '../models/Rubric.js';
import { evaluateExam } from '../services/evaluationService.js';
import { generateFeedbackReportPDF, getUploadsDir } from '../services/pdfService.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();
router.use(protect, authorize('student'));

router.get('/exams', async (req, res) => {
  const exams = await Exam.find({
    $or: [{ studentId: req.user._id }, { assignedStudents: req.user._id }],
    status: { $in: ['assigned', 'in_progress', 'submitted', 'evaluated'] },
  })
    .populate('questionPaperId', 'title subject totalMarks')
    .sort({ createdAt: -1 });
  res.json({ success: true, exams });
});

router.get('/exams/:id', async (req, res) => {
  const exam = await Exam.findOne({
    _id: req.params.id,
    $or: [{ studentId: req.user._id }, { assignedStudents: req.user._id }],
  }).populate('questionPaperId');

  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  const paper = exam.questionPaperId;
  const questionsForStudent = paper.questions.map((q, i) => ({
    index: i,
    type: q.type,
    question: q.question,
    options: q.type === 'MCQ' ? q.options : undefined,
    marks: q.marks,
  }));

  if (exam.status === 'assigned') {
    exam.status = 'in_progress';
    exam.startedAt = new Date();
    await exam.save();
  }

  res.json({
    success: true,
    exam: {
      id: exam._id,
      title: exam.title,
      subject: exam.subject,
      status: exam.status,
      maxScore: exam.maxScore,
      questions: exam.status === 'evaluated' ? undefined : questionsForStudent,
      score: exam.status === 'evaluated' ? exam.score : undefined,
      percentage: exam.status === 'evaluated' ? exam.percentage : undefined,
    },
    results:
      exam.status === 'evaluated'
        ? {
            answers: exam.answers,
            weakTopics: exam.weakTopics,
            improvementSuggestions: exam.improvementSuggestions,
          }
        : undefined,
  });
});

router.post(
  '/exams/:id/submit',
  [body('answers').isArray({ min: 1 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const exam = await Exam.findOne({
      _id: req.params.id,
      $or: [{ studentId: req.user._id }, { assignedStudents: req.user._id }],
      status: { $in: ['assigned', 'in_progress'] },
    }).populate('questionPaperId');

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found or already submitted' });

    const paper = await QuestionPaper.findById(exam.questionPaperId._id || exam.questionPaperId);
    const rubric = exam.rubricId ? await Rubric.findById(exam.rubricId) : null;
    const evaluation = await evaluateExam(paper, req.body.answers, rubric);

    exam.answers = evaluation.answers;
    exam.score = evaluation.score;
    exam.percentage = (evaluation.score / exam.maxScore) * 100;
    exam.weakTopics = evaluation.weakTopics;
    exam.improvementSuggestions = evaluation.improvementSuggestions;
    exam.status = 'evaluated';
    exam.submittedAt = new Date();
    exam.evaluatedAt = new Date();
    await exam.save();

    const report = await Report.create({
      examId: exam._id,
      studentId: req.user._id,
      feedback: evaluation.answers.map((a, i) => `Q${i + 1}: ${a.feedback}`).join('\n'),
      weakTopics: evaluation.weakTopics,
      improvementAreas: evaluation.improvementSuggestions,
      scoreBreakdown: evaluation.answers.map((a) => ({
        questionIndex: a.questionIndex,
        marks: a.marksAwarded,
        criteria: a.criteria,
      })),
    });

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: 'EXAM_SUBMIT',
      resource: 'Exam',
      resourceId: exam._id.toString(),
      details: { score: exam.score },
      req,
    });

    res.json({
      success: true,
      exam: {
        score: exam.score,
        maxScore: exam.maxScore,
        percentage: exam.percentage,
        weakTopics: exam.weakTopics,
        improvementSuggestions: exam.improvementSuggestions,
        answers: exam.answers,
      },
      reportId: report._id,
    });
  }
);

router.get('/reports', async (req, res) => {
  const reports = await Report.find({ studentId: req.user._id })
    .populate({ path: 'examId', select: 'title subject score maxScore percentage' })
    .sort({ createdAt: -1 });
  res.json({ success: true, reports });
});

router.get('/reports/:id/pdf', async (req, res) => {
  const report = await Report.findOne({ _id: req.params.id, studentId: req.user._id }).populate('examId');
  if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

  const pdfPath = `${getUploadsDir()}/report-${report._id}.pdf`;
  await generateFeedbackReportPDF(report, report.examId, pdfPath);
  res.download(pdfPath, 'feedback-report.pdf', () => fs.unlink(pdfPath, () => {}));
});

router.get('/dashboard', async (req, res) => {
  const exams = await Exam.find({
    studentId: req.user._id,
    status: 'evaluated',
  }).sort({ evaluatedAt: -1 });

  const history = exams.map((e) => ({
    id: e._id,
    title: e.title,
    subject: e.subject,
    score: e.score,
    maxScore: e.maxScore,
    percentage: e.percentage,
    date: e.evaluatedAt,
  }));

  const allWeak = exams.flatMap((e) => e.weakTopics || []);
  const weakTopicCounts = {};
  allWeak.forEach((t) => {
    weakTopicCounts[t] = (weakTopicCounts[t] || 0) + 1;
  });
  const weakTopics = Object.entries(weakTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  const suggestions = [...new Set(exams.flatMap((e) => e.improvementSuggestions || []))].slice(0, 5);

  res.json({
    success: true,
    dashboard: {
      examHistory: history,
      averageScore: history.length
        ? history.reduce((s, h) => s + h.percentage, 0) / history.length
        : 0,
      weakTopics,
      improvementSuggestions: suggestions,
    },
  });
});

export default router;
