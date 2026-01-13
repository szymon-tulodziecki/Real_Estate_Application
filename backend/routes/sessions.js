const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Wszystkie routes wymagają autoryzacji jako admin lub root
router.use(requireAuth);
router.use(requireRole('admin')); // To obsługuje zarówno admin jak i root

// GET /api/sessions - pobierz aktywne sesje agentów
router.get('/', sessionController.getActiveSessions);

// GET /api/sessions/stats - statystyki sesji
router.get('/stats', sessionController.getSessionStats);

// DELETE /api/sessions/:sessionId - zakończ sesję agenta
router.delete('/:sessionId', sessionController.terminateSession);

module.exports = router;
