const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { sessionUtils } = require('./session');

// Primary authentication using Redis sessions
const auth = async (req, res, next) => {
  try {
    console.debug('[auth] session present:', !!req.session, 'session.user:', req.session?.user);
    console.debug('[auth] headers Authorization:', req.header('Authorization'));
    // First, check session-based auth (primary method)
    if (sessionUtils.isAuthenticated(req)) {
      const sessionUser = sessionUtils.getSessionUser(req);
      
      // Fetch fresh user data from database to ensure user is still active
      const user = await User.findById(sessionUser._id);
      if (!user || !user.isActive) {
        await sessionUtils.destroySession(req);
        return res.status(401).json({ message: 'Sesja wygasła - użytkownik nieaktywny' });
      }
      
      // SPRAWDŹ czy admin wymusił wylogowanie (dla sesji Redis też!)
      if (user.forceLogoutAt && sessionUser.loginTime) {
        const loginTimestamp = new Date(sessionUser.loginTime).getTime();
        if (loginTimestamp < user.forceLogoutAt.getTime()) {
          await sessionUtils.destroySession(req);
          return res.status(401).json({ 
            message: 'Sesja została zakończona przez administratora',
            code: 'SESSION_TERMINATED'
          });
        }
      }
      
      
      req.user = user;
      return next();
    }

    // Fallback to JWT-based auth (for API compatibility)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Brak autoryzacji - wymagane logowanie' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Nieprawidłowy token' });
    }
    
    // SPRAWDŹ czy admin wymusił wylogowanie
    if (user.forceLogoutAt && decoded.iat) {
      const tokenIssuedAt = decoded.iat * 1000; // JWT iat jest w sekundach
      if (tokenIssuedAt < user.forceLogoutAt.getTime()) {
        return res.status(401).json({ 
          message: 'Sesja została zakończona przez administratora',
          code: 'SESSION_TERMINATED'
        });
      }
    }
    


    req.user = user;
    console.debug('[auth] authenticated user:', req.user?.email, 'role:', req.user?.role);
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Błąd autoryzacji' });
  }
};

const adminAuth = (req, res, next) => {
  console.debug('[adminAuth] sessionUtils.isAdmin:', sessionUtils.isAdmin(req), 'req.user.role:', req.user?.role);
  // Check both session and user object
  const isSessionAdmin = sessionUtils.isAdmin(req);
  const isUserAdmin = req.user?.role === 'admin' || req.user?.role === 'root';
  
  if (!isSessionAdmin && !isUserAdmin) {
    return res.status(403).json({ message: 'Brak uprawnień administratora' });
  }
  next();
};

const agentAuth = (req, res, next) => {
  // Allow both admin and agent access
  const isSessionAdmin = sessionUtils.isAdmin(req);
  const isSessionAgent = sessionUtils.isAgent(req);
  const isUserAdmin = req.user?.role === 'admin' || req.user?.role === 'root';
  const isUserAgent = req.user?.role === 'agent';
  
  if (!isSessionAdmin && !isSessionAgent && !isUserAdmin && !isUserAgent) {
    return res.status(403).json({ message: 'Brak uprawnień agenta lub administratora' });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    // Check session first
    if (sessionUtils.isAuthenticated(req)) {
      const sessionUser = sessionUtils.getSessionUser(req);
      const user = await User.findById(sessionUser._id);
      if (user && user.isActive) {
        req.user = user;
      }
      return next();
    }

    // Fallback to JWT
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};


module.exports = { 
  auth, 
  adminAuth, 
  agentAuth, 
  optionalAuth,
  requireAuth: auth,
  requireRole: (role) => {
    if (role === 'admin' || role === 'root') return adminAuth;
    if (role === 'agent') return agentAuth;
    return (req, res, next) => next();
  }
};
