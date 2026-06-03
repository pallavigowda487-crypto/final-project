import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Rubric from '../models/Rubric.js';

const router = express.Router();
router.use(protect, authorize('faculty', 'admin'));

// Create a new rubric
router.post('/', async (req, res) => {
  try {
    const { title, description, criteria } = req.body;
    
    // Validate weights add up to ~100
    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      return res.status(400).json({ success: false, message: 'Criteria weights must add up to exactly 100%' });
    }

    const rubric = await Rubric.create({
      facultyId: req.user._id,
      title,
      description,
      criteria,
    });
    res.status(201).json({ success: true, rubric });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all rubrics for the faculty
router.get('/', async (req, res) => {
  try {
    const rubrics = await Rubric.find({ facultyId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, rubrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update a rubric
router.put('/:id', async (req, res) => {
  try {
    const { title, description, criteria } = req.body;
    
    const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      return res.status(400).json({ success: false, message: 'Criteria weights must add up to exactly 100%' });
    }

    const rubric = await Rubric.findOneAndUpdate(
      { _id: req.params.id, facultyId: req.user._id },
      { title, description, criteria },
      { new: true }
    );
    if (!rubric) return res.status(404).json({ success: false, message: 'Rubric not found' });
    res.json({ success: true, rubric });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a rubric
router.delete('/:id', async (req, res) => {
  try {
    const rubric = await Rubric.findOneAndDelete({ _id: req.params.id, facultyId: req.user._id });
    if (!rubric) return res.status(404).json({ success: false, message: 'Rubric not found' });
    res.json({ success: true, message: 'Rubric deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
