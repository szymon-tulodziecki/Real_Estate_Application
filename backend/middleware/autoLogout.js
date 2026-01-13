// backend/middleware/autoLogout.js

/**
 * Middleware do automatycznego wylogowania po 20 minutach bezczynności
 */
module.exports = function autoLogout(req, res, next) {
  try {
    if (req.session && req.session.user) {
      const last = new Date(req.session.user.lastActivity).getTime();
      if (Date.now() - last > 20 * 60 * 1000) {
        // Dezaktywuj sesję w MongoDB
        const Session = require('../models/Session');
        Session.findOneAndUpdate(
          { sessionToken: req.sessionID, isActive: true },
          { $set: { isActive: false } }
        ).catch(err => console.error('Error deactivating session in MongoDB:', err));

        req.session.destroy(() => {});
        return res.status(440).json({ message: 'Sesja wygasła z powodu bezczynności' });
      }
      // Aktualizuj aktywność dla zapytań mutujących lub GET do /api/properties/*
      if (req.method !== 'GET' || req.path.startsWith('/api/properties')) {
        req.session.user.lastActivity = new Date().toISOString();
      }
    }
  } catch (e) { /* ignore */ }
  next();
};
