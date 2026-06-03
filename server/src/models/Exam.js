import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  answer: { type: String, required: true },
  marksAwarded: { type: Number, default: 0 },
  feedback: String,
  criteria: mongoose.Schema.Types.Mixed,
});

const examSchema = new mongoose.Schema(
  {
    questionPaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPaper', required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    subject: { type: String, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'assigned', 'in_progress', 'submitted', 'evaluated'],
      default: 'draft',
    },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, required: true },
    percentage: { type: Number },
    startedAt: Date,
    submittedAt: Date,
    evaluatedAt: Date,
    weakTopics: [String],
    improvementSuggestions: [String],
  },
  { timestamps: true }
);

export default mongoose.model('Exam', examSchema);
