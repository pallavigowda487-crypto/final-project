import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Rubric from './models/Rubric.js';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all faculty members
    const facultyUsers = await User.find({ role: 'faculty' });
    
    if (facultyUsers.length === 0) {
      console.log('No faculty users found. Cannot assign rubric.');
      process.exit(0);
    }

    for (const faculty of facultyUsers) {
      const existing = await Rubric.findOne({ facultyId: faculty._id, title: 'Technical Evaluation Framework' });
      if (!existing) {
        await Rubric.create({
          facultyId: faculty._id,
          title: 'Technical Evaluation Framework',
          description: 'Standard framework for evaluating technical answers with code examples.',
          criteria: [
            { name: 'Technical Accuracy', weight: 50, description: 'Evaluate if the technical information and concepts are entirely correct and accurate.' },
            { name: 'Logical Flow', weight: 30, description: 'Evaluate if the answer follows a logical structure, is easy to read, and presents arguments clearly.' },
            { name: 'Example Usage', weight: 20, description: 'Evaluate if relevant, practical, and correct examples are provided to support the answer.' }
          ]
        });
        console.log(`Created rubric for ${faculty.email}`);
      } else {
        console.log(`Rubric already exists for ${faculty.email}`);
      }
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
