import mongoose from 'mongoose';

const criterionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  weight: { type: Number, required: true, min: 0, max: 100 }, // Percentage weight
});

const rubricSchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    criteria: [criterionSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Rubric', rubricSchema);
