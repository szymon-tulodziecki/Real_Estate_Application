const express = require('express');
const { register, login, logout, logoutAllDevices, getActiveSessions, getProfile } = require('../controllers/authController');
const { auth, adminAuth } = require('../middleware/auth');
const { validateUser, validateLogin } = require('../middleware/validation');
const User = require('../models/User');

const router = express.Router();

// Sprawdzenie dostępności employeeId
router.get('/check-employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const existingUser = await User.findOne({ employeeId });
    
    res.json({
      available: !existingUser,
      message: existingUser ? 'Numer pracownika jest zajęty' : 'Numer pracownika jest dostępny'
    });
  } catch (error) {
    res.status(500).json({ message: 'Błąd sprawdzania numeru pracownika' });
  }
});

router.post('/login', validateLogin, login);
router.post('/logout', auth, logout);
router.post('/logout-all', auth, logoutAllDevices);
router.get('/sessions', auth, getActiveSessions);
router.post('/register', validateUser, register); // Dodana walidacja
router.get('/profile', auth, getProfile);

module.exports = router;
