import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    chunkCount: { type: Number, default: 0 },
    pineconeVectorCount: { type: Number, default: 0 },
    pineconeIndexDimension: { type: Number },
    pineconeVerifiedAt: { type: Date },
    pineconeNamespace: { type: String, required: true },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
    },
    uploadDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Syllabus', syllabusSchema);
