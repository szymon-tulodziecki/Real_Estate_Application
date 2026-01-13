const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  legacyMode: false
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  console.error('Redis connection details:', {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD ? '(using configured password)' : '(no password)',
  });
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Session configuration
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in environment variables');
}
const sessionConfig = {
  store: new RedisStore({ 
    client: redisClient,
    prefix: 'realestate:sess:',
    ttl: 2 * 60 * 60, // 2 godziny w sekundach
  }),
  name: process.env.SESSION_NAME || 'realestate_session',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 2 * 60 * 60 * 1000, // 2 godziny (krótsze sesje dla bezpieczeństwa)
    // Allow cross-site requests in development (different ports). In production keep 'strict'.
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none'
  }
};

// In development, allow non-secure cookies
if (process.env.NODE_ENV === 'development') {
  sessionConfig.cookie.secure = false;
}

const sessionMiddleware = session(sessionConfig);

// Session utilities
const sessionUtils = {
  // Save user session
  saveUserSession: (req, userData) => {
    req.session.user = {
      _id: userData._id,
      employeeId: userData.employeeId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    req.session.isAuthenticated = true;
    return req.session.save();
  },

  // Update last activity
  updateActivity: (req) => {
    if (req.session && req.session.user) {
      const now = Date.now();
      const last = new Date(req.session.user.lastActivity).getTime();
      // jeśli minęło > 20 minut, zniszcz sesję
      if (now - last > 20 * 60 * 1000) {
        req.session.destroy(()=>{});
        return;
      }
      req.session.user.lastActivity = new Date().toISOString();
      return req.session.save();
    }
  },

  // Get user from session
  getSessionUser: (req) => {
    return req.session?.user || null;
  },

  // Check if user is authenticated
  isAuthenticated: (req) => {
    return !!(req.session?.isAuthenticated && req.session?.user);
  },

  // Check if user is admin
  isAdmin: (req) => {
    const user = sessionUtils.getSessionUser(req);
    return user?.role === 'admin' || user?.role === 'root';
  },

  // Check if user is agent
  isAgent: (req) => {
    const user = sessionUtils.getSessionUser(req);
    return user?.role === 'agent';
  },

  // Destroy session
  destroySession: (req) => {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  // Get all active sessions for user (for logout from all devices)
  getActiveSessions: async (userId) => {
    // Użyj SCAN, nie KEYS
    const { scanIterator } = require('../utils/redisScan');
    const userSessions = [];
    try {
      for await (const key of scanIterator(redisClient, 'realestate:sess:*')) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.user && parsed.user._id === userId) {
            userSessions.push({
              sessionId: key.replace('realestate:sess:', ''),
              loginTime: parsed.user.loginTime,
              lastActivity: parsed.user.lastActivity
            });
          }
        }
      }
      return userSessions;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  },

  // Logout user from all devices (improved version)
  logoutUserFromAllDevices: async (userId) => {
    // Użyj SCAN, nie KEYS
    const { scanIterator } = require('../utils/redisScan');
    let deletions = 0;
    try {
      for await (const key of scanIterator(redisClient, 'realestate:sess:*')) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            if (parsed.user && parsed.user._id === userId) {
              await redisClient.del(key);
              deletions++;
            }
          } catch (parseError) {
            await redisClient.del(key);
            deletions++;
          }
        }
      }
      console.log(`Logged out user ${userId} from ${deletions} devices`);
      return deletions;
    } catch (error) {
      console.error('Error logging out all devices:', error);
      return 0;
    }
  },

  // Czyszczenie wygasłych sesji (do uruchomienia okresowo)
  cleanupExpiredSessions: async () => {
    // Użyj SCAN zamiast KEYS
    const { scanIterator } = require('../utils/redisScan');
    let cleaned = 0;
    try {
      for await (const key of scanIterator(redisClient, 'realestate:sess:*')) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) { // Klucz bez TTL
          await redisClient.del(key);
          cleaned++;
        }
      }
      console.log(`Cleaned up ${cleaned} expired sessions`);
      return cleaned;
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }
  },

  // Natychmiastowe usunięcie sesji po wylogowaniu
  forceDestroySession: async (req) => {
    return new Promise((resolve) => {
      const sessionId = req.sessionID;
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
        // Usuń też z Redis bezpośrednio
        redisClient.del(`realestate:sess:${sessionId}`).catch(console.error);
        resolve();
      });
    });
  }
};

// Middleware do sprawdzania czy admin wymuszył wylogowanie
const checkForceLogout = async (req, res, next) => {
  // Sprawdź tylko jeśli użytkownik ma sesję
  if (req.session && req.session.user && req.session.user._id) {
    try {
      const User = require('../models/User');
      const user = await User.findById(req.session.user._id).select('forceLogoutAt');
      
      if (user && user.forceLogoutAt) {
        const loginTime = new Date(req.session.user.loginTime).getTime();
        const forceLogoutTime = user.forceLogoutAt.getTime();
        
        // Jeśli sesja została utworzona PRZED wymuszonym wylogowaniem
        if (loginTime < forceLogoutTime) {
          console.log(`[FORCE LOGOUT] User ${req.session.user.email} was logged out by admin`);
          // Dezaktywuj sesję w MongoDB
          const Session = require('../models/Session');
          await Session.findOneAndUpdate(
            { sessionToken: req.sessionID, isActive: true },
            { $set: { isActive: false } }
          ).catch(err => console.error('Error deactivating session in MongoDB:', err));
          // Zniszcz sesję
          req.session.destroy(() => {});
          // Usuń bezpośrednio z Redis
          if (req.sessionID) {
            redisClient.del(`realestate:sess:${req.sessionID}`).catch(console.error);
          }
          return res.status(401).json({ 
            message: 'Twoja sesja została zakończona przez administratora',
            code: 'SESSION_TERMINATED'
          });
        }
      }
    } catch (error) {
      console.error('[checkForceLogout] Error:', error);
      // Nie blokuj requestu jeśli wystąpił błąd sprawdzania
    }
  }
  next();
};

module.exports = {
  sessionMiddleware,
  sessionUtils,
  redisClient,
  getRedisClient: () => redisClient,
  checkForceLogout
};
