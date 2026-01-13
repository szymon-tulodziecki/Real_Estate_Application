const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Public: list visible agents (limited fields)
router.get('/', async (req, res) => {
  const agents = await User.find({ role: 'agent', isActive: true, isPublic: true })
    .select('firstName lastName email phone avatar bio specializations experienceYears socialMedia isPublic');
  res.json({ agents });
});

// Public: agent by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: 'Nieprawidłowe ID' });
  const agent = await User.findOne({ _id: id, role: 'agent', isActive: true, isPublic: true })
    .select('firstName lastName email phone avatar bio specializations experienceYears socialMedia isPublic');
  if (!agent) return res.status(404).json({ message: 'Agent nie znaleziony' });
  res.json({ agent });
});

module.exports = router;


