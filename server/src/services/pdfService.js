import PDFDocument from 'pdfkit';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const generateQuestionPaperPDF = async (paper, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(18).text(paper.title || 'Question Paper', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Subject: ${paper.subject}`);
    doc.text(`Difficulty: ${paper.difficulty} | Bloom Level: ${paper.bloomLevel}`);
    doc.text(`Total Marks: ${paper.totalMarks}`);
    doc.moveDown();

    paper.questions.forEach((q, i) => {
      doc.fontSize(11).text(`${i + 1}. [${q.type}] ${q.question} (${q.marks} Marks)`);
      if (q.type === 'MCQ' && q.options?.length) {
        q.options.forEach((opt, j) => doc.text(`   ${String.fromCharCode(65 + j)}. ${opt}`));
      }
      doc.moveDown(0.5);
    });

    doc.addPage();
    doc.fontSize(14).text('Model Answers', { underline: true });
    doc.moveDown();
    paper.questions.forEach((q, i) => {
      doc.fontSize(10).text(`${i + 1}. ${q.modelAnswer}`);
      if (q.type === 'MCQ' && q.correctOption) {
        doc.text(`   Correct: ${q.correctOption}`);
      }
      doc.moveDown(0.3);
    });

    doc.addPage();
    doc.fontSize(14).text('Marks Distribution', { underline: true });
    doc.moveDown();
    const dist = paper.marksDistribution || {};
    Object.entries(dist).forEach(([type, marks]) => {
      doc.text(`${type}: ${marks} marks`);
    });

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

export const generateFeedbackReportPDF = async (report, exam, outputPath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(18).text('Exam Feedback Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Exam: ${exam.title}`);
    doc.text(`Score: ${exam.score} / ${exam.maxScore} (${exam.percentage?.toFixed(1)}%)`);
    doc.moveDown();
    doc.text('Feedback:', { underline: true });
    doc.text(report.feedback);
    doc.moveDown();
    if (report.weakTopics?.length) {
      doc.text('Weak Topics:');
      report.weakTopics.forEach((t) => doc.text(`  - ${t}`));
    }
    if (report.improvementAreas?.length) {
      doc.text('Improvement Suggestions:');
      report.improvementAreas.forEach((s) => doc.text(`  - ${s}`));
    }
    
    doc.moveDown();

    // Add Rubric Performance Section if scoreBreakdown exists
    if (report.scoreBreakdown && report.scoreBreakdown.length > 0) {
      const criteriaTotals = {};
      const criteriaCounts = {};

      report.scoreBreakdown.forEach((q) => {
        if (q.criteria && typeof q.criteria === 'object') {
          Object.entries(q.criteria).forEach(([key, value]) => {
            let num = null;
            if (typeof value === 'number') num = value;
            else if (typeof value === 'string') {
              const match = value.match(/(\d+(\.\d+)?)/);
              if (match) num = parseFloat(match[1]);
            }

            if (num !== null && !isNaN(num)) {
              let cleanKey = key.replace(/([A-Z])/g, ' $1').trim();
              cleanKey = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
              criteriaTotals[cleanKey] = (criteriaTotals[cleanKey] || 0) + num;
              criteriaCounts[cleanKey] = (criteriaCounts[cleanKey] || 0) + 1;
            }
          });
        }
      });

      const criteriaKeys = Object.keys(criteriaTotals);
      if (criteriaKeys.length > 0) {
        doc.fontSize(14).text('Rubric Performance Breakdown', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        criteriaKeys.forEach((key) => {
          const score = Math.round(criteriaTotals[key] / criteriaCounts[key]);
          // Create an ASCII progress bar (20 blocks total)
          const filledBlocks = Math.round((score / 100) * 20);
          const bar = '█'.repeat(filledBlocks) + '░'.repeat(20 - filledBlocks);
          doc.text(`${key}: ${bar} ${score}%`);
        });
      }
    }

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

export const getUploadsDir = () => {
  const dir = process.env.VERCEL
    ? os.tmpdir()
    : path.join(__dirname, '../../uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};
