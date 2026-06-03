import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['MCQ', 'Short Answer', 'Long Answer'], required: true },
  question: { type: String, required: true },
  options: [String],
  correctOption: String,
  modelAnswer: { type: String, required: true },
  marks: { type: Number, required: true },
  bloomLevel: { type: String, required: true },
  difficulty: { type: String, required: true },
  citations: [{ chunkId: String, excerpt: String }],
});

const questionPaperSchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    syllabusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Syllabus', required: true },
    subject: { type: String, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    bloomLevel: {
      type: String,
      enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
      required: true,
    },
    totalMarks: { type: Number, required: true },
    questions: [questionSchema],
    marksDistribution: { type: Map, of: Number },
    generatedQuestions: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model('QuestionPaper', questionPaperSchema);
