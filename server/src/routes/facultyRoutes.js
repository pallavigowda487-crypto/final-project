import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import Syllabus from '../models/Syllabus.js';
import QuestionPaper from '../models/QuestionPaper.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import { extractTextFromFile } from '../services/documentParser.js';
import { ingestSyllabus, createNamespace } from '../services/ragService.js';
import { generateQuestionPaper } from '../services/questionGenerator.js';
import { generateQuestionPaperPDF, getUploadsDir } from '../services/pdfService.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

router.use(protect, authorize('faculty', 'admin'));

const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 20) * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSize },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and DOCX files allowed'));
  },
});

router.post('/syllabus/upload', upload.array('files', 10), async (req, res) => {
  let syllabus;
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });
    const { subject } = req.body;
    if (!subject) return res.status(400).json({ success: false, message: 'Subject is required' });

    const combinedFileNames = req.files.map(f => f.originalname).join(', ');
    const totalSize = req.files.reduce((acc, f) => acc + f.size, 0);

    syllabus = await Syllabus.create({
      facultyId: req.user._id,
      subject,
      fileName: combinedFileNames,
      fileUrl: combinedFileNames,
      fileSize: totalSize,
      pineconeNamespace: 'pending',
      status: 'processing',
    });

    const namespace = createNamespace(syllabus._id.toString());
    syllabus.pineconeNamespace = namespace;

    let combinedText = '';
    for (const file of req.files) {
      const text = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);
      combinedText += text + '\n\n';
    }

    const { chunkCount, pineconeVectorCount, pineconeIndexDimension } = await ingestSyllabus(
      combinedText,
      namespace,
      {
        subject,
        syllabusId: syllabus._id.toString(),
        facultyId: req.user._id.toString(),
      }
    );

    syllabus.chunkCount = chunkCount;
    syllabus.pineconeVectorCount = pineconeVectorCount;
    syllabus.pineconeIndexDimension = pineconeIndexDimension;
    syllabus.pineconeVerifiedAt = new Date();
    syllabus.status = 'ready';
    await syllabus.save();

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: 'SYLLABUS_UPLOAD',
      resource: 'Syllabus',
      resourceId: syllabus._id.toString(),
      details: { subject, chunkCount, pineconeVectorCount, pineconeIndexDimension },
      req,
    });

    res.status(201).json({ success: true, syllabus });
  } catch (err) {
    if (syllabus) {
      syllabus.status = 'failed';
      await syllabus.save().catch(() => {});
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/syllabus', async (req, res) => {
  const syllabi = await Syllabus.find({ facultyId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, syllabi });
});

router.post(
  '/papers/generate',
  [
    body('syllabusId').notEmpty(),
    body('numQuestions').isInt({ min: 1, max: 50 }),
    body('difficulty').isIn(['Easy', 'Medium', 'Hard']),
    body('bloomLevel').isIn(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const syllabus = await Syllabus.findOne({
        _id: req.body.syllabusId,
        facultyId: req.user._id,
        status: 'ready',
      });
      if (!syllabus) {
        return res.status(404).json({ success: false, message: 'Syllabus not found or not ready' });
      }

      const generated = await generateQuestionPaper({
        syllabus,
        subject: syllabus.subject,
        numQuestions: req.body.numQuestions,
        difficulty: req.body.difficulty,
        bloomLevel: req.body.bloomLevel,
        questionTypes: req.body.questionTypes,
      });

      const paper = await QuestionPaper.create({
        facultyId: req.user._id,
        syllabusId: syllabus._id,
        subject: syllabus.subject,
        title: generated.title,
        difficulty: generated.difficulty,
        bloomLevel: generated.bloomLevel,
        totalMarks: generated.totalMarks,
        questions: generated.questions,
        marksDistribution: generated.marksDistribution,
        generatedQuestions: generated,
      });

      await logAudit({
        userId: req.user._id,
        userEmail: req.user.email,
        role: req.user.role,
        action: 'PAPER_GENERATE',
        resource: 'QuestionPaper',
        resourceId: paper._id.toString(),
        details: { numQuestions: req.body.numQuestions },
        req,
      });

      res.status(201).json({ success: true, paper });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.get('/papers', async (req, res) => {
  const papers = await QuestionPaper.find({ facultyId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, papers });
});

router.get('/papers/:id', async (req, res) => {
  try {
    const paper = await QuestionPaper.findOne({ _id: req.params.id, facultyId: req.user._id });
    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });
    res.json({ success: true, paper });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/papers/:id', async (req, res) => {
  try {
    const { questions } = req.body;
    const paper = await QuestionPaper.findOne({ _id: req.params.id, facultyId: req.user._id });
    if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

    paper.questions = questions;
    paper.totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
    
    await paper.save();

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      role: req.user.role,
      action: 'PAPER_UPDATE',
      resource: 'QuestionPaper',
      resourceId: paper._id.toString(),
      details: { newTotalMarks: paper.totalMarks, questionCount: questions.length },
      req,
    });

    res.json({ success: true, paper });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/papers/:id/pdf', async (req, res) => {
  const paper = await QuestionPaper.findOne({ _id: req.params.id, facultyId: req.user._id });
  if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

  const pdfPath = path.join(getUploadsDir(), `paper-${paper._id}.pdf`);
  await generateQuestionPaperPDF(paper, pdfPath);
  res.download(pdfPath, `${paper.subject}-question-paper.pdf`, () => {
    fs.unlink(pdfPath, () => {});
  });
});

router.post('/exams/assign', async (req, res) => {
  const { questionPaperId, studentIds, title } = req.body;
  const paper = await QuestionPaper.findOne({ _id: questionPaperId, facultyId: req.user._id });
  if (!paper) return res.status(404).json({ success: false, message: 'Paper not found' });

  const exams = [];
  for (const studentId of studentIds) {
    const exam = await Exam.create({
      questionPaperId: paper._id,
      facultyId: req.user._id,
      studentId,
      assignedStudents: [studentId],
      subject: paper.subject,
      title: title || paper.title,
      maxScore: paper.totalMarks,
      status: 'assigned',
    });
    exams.push(exam);
  }

  await logAudit({
    userId: req.user._id,
    userEmail: req.user.email,
    role: req.user.role,
    action: 'EXAM_ASSIGN',
    resource: 'Exam',
    details: { count: exams.length },
    req,
  });

  res.status(201).json({ success: true, exams });
});

router.get('/performance', async (req, res) => {
  const exams = await Exam.find({ facultyId: req.user._id, status: 'evaluated' })
    .populate('studentId', 'name email')
    .populate('questionPaperId', 'title subject');
  const stats = {
    totalExams: exams.length,
    averageScore: exams.length
      ? exams.reduce((s, e) => s + (e.percentage || 0), 0) / exams.length
      : 0,
    bySubject: {},
  };
  exams.forEach((e) => {
    if (!stats.bySubject[e.subject]) stats.bySubject[e.subject] = { count: 0, avg: 0, total: 0 };
    stats.bySubject[e.subject].count++;
    stats.bySubject[e.subject].total += e.percentage || 0;
  });
  Object.keys(stats.bySubject).forEach((sub) => {
    const s = stats.bySubject[sub];
    s.avg = s.total / s.count;
  });
  res.json({ success: true, exams, stats });
});

router.get('/students', async (req, res) => {
  const students = await User.find({ role: 'student', isActive: true }).select('name email');
  res.json({ success: true, students });
});

export default router;
