import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Syllabus from './src/models/Syllabus.js';

dotenv.config();

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const docs = await Syllabus.find({ pineconeVectorCount: 0 });
    let count = 0;
    for (let d of docs) {
      if (d.chunkCount > 0) {
        d.pineconeVectorCount = d.chunkCount;
        await d.save();
        count++;
      }
    }
    console.log(`Fixed ${count} documents.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
