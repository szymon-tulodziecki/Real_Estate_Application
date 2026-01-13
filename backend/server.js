require('dotenv').config();
const express = require('express');
const csurf = require('csurf');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sessionMiddleware, sessionUtils, checkForceLogout } = require('./middleware/session');
const { 
  loginRateLimit, 
  apiRateLimit, 
  checkBlockedIP, 
  recordFailedLogin, 
  logLoginAttempts,
  getLoginStats 
} = require('./middleware/security');


const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const propertyRoutes = require('./routes/properties');
const publicAgentsRoutes = require('./routes/agents');
const sessionRoutes = require('./routes/sessions');

const app = express();

connectDB();

// Trust proxy early (rate limit, IP detection)
app.set('trust proxy', 1);

// --- CORS (musi być przed helmet & rate limit) ---
const allowedOrigins = [
  'http://localhost:5000',  // Frontend Vite dev server
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Pozwól na brak origin (np. curl) lub dozwoloną domenę
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Cookie','X-Requested-With','X-CSRF-Token','x-csrf-token','X-XSRF-TOKEN','x-xsrf-token'],
  exposedHeaders: ['Set-Cookie','X-CSRF-Token','X-XSRF-TOKEN']
};

app.use(cors(corsOptions));
app.use((req,res,next)=>{ 
  console.log('Request from origin:', req.get('origin'));
  res.header('Vary','Origin'); 
  next(); 
});
app.options('*', cors(corsOptions));

// Debug logging for sessions endpoints
// NOTE: moved sessions debug middleware lower so sessionMiddleware has run
// --- END CORS ---

// Podstawowe zabezpieczenia (po CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting dla całego API (po CORS i helmet)
app.use('/api/', apiRateLimit);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Parse cookies so csurf (cookie mode) can read/write CSRF cookie
app.use(cookieParser());
// Ochrona przed NoSQL Injection
app.use(mongoSanitize());
// ...existing code... (CSRF will be configured after session middleware)

// Middleware sesji (centralna konfiguracja w session.js)
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production');
}
app.use(sessionMiddleware);

// Sprawdzenie czy admin wymusził wylogowanie (MUSI BYĆ ZARAZ PO SESSION MIDDLEWARE!)
app.use(checkForceLogout);

// Debug logging for sessions endpoints (after session middleware so session data is available)
app.use('/api/sessions', (req, res, next) => {
  console.log('[sessions] Incoming request:', req.method, req.originalUrl);
  console.log('[sessions] Headers:', {
    origin: req.get('origin'),
    cookie: req.get('cookie') ? '[present]' : '[none]',
    'x-csrf-token': req.get('x-csrf-token') || req.get('X-CSRF-Token') || null
  });
  // Raw cookie header (for debugging only) - may contain session cookie name
  try {
    console.log('[sessions] Raw Cookie header:', req.get('cookie') || null);
  } catch (e) {
    console.log('[sessions] Cookie header error:', e && e.message);
  }
  // Log session identifier and stored session user for debugging CSRF/session issues
  try {
    console.log('[sessions] SessionID:', req.sessionID || null);
    console.log('[sessions] Session user:', req.session && req.session.user ? req.session.user : null);
  } catch (e) {
    console.log('[sessions] Session debug error:', e && e.message);
  }
  next();
});

// CSRF protection (po session, przed routes)
// Use cookie-backed CSRF secret so token generation/validation doesn't depend on server-side session state.
// This makes CSRF work even when the client authenticates via Authorization header (JWT).
const csrfCookieOptions = {
  key: process.env.CSRF_COOKIE_NAME || 'csrfSecret',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/'
};
const csrfProtection = csurf({ cookie: csrfCookieOptions });
// Expose CSRF token endpoint (dla frontendu) - MUSI mieć csrfProtection, aby req.csrfToken() działało
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  try {
    const token = req.csrfToken();
    console.log('[csrf] Issuing token for sessionID:', req.sessionID || null);
    console.log('[csrf] Session user at token issuance:', req.session && req.session.user ? req.session.user : null);
    // Ustaw dodatkowe ciasteczko dla łatwiejszego dostępu przez JS
    res.cookie('XSRF-TOKEN', token, {
      ...csrfCookieOptions,
      httpOnly: false // Ten musi być false, by JS mógł go przeczytać
    });
    res.json({ csrfToken: token });
  } catch (err) {
    console.error('[csrf] Error issuing token:', err && err.message);
    res.status(500).json({ message: 'Failed to issue CSRF token' });
  }
});
// Stosuj CSRF ochronę (walidację) dla pozostałych tras - csurf domyślnie ignoruje GET/HEAD/OPTIONS
app.use(['/api/users', '/api/properties', '/api/sessions'], csrfProtection);

// Zabezpieczenia dla endpointu logowania
app.use('/api/auth/login', checkBlockedIP, loginRateLimit, logLoginAttempts, recordFailedLogin);

// Middleware auto-logout po 20 min bezczynności
const autoLogout = require('./middleware/autoLogout');
app.use(autoLogout);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/agents', publicAgentsRoutes); // Publiczne API agentów
app.use('/api/sessions', sessionRoutes); // Zarządzanie sesjami dla adminów
app.use('/api/parcels', require('./routes/parcels')); // Endpoint do działek ULDK

// Endpoint do monitorowania bezpieczeństwa (tylko dla administratorów)
app.get('/api/security/stats', (req, res) => {
  // Prosty security check - można to rozszerzyć o autentykację
  const stats = getLoginStats();
  res.json(stats);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    cloudinary: {
      configured: !!process.env.CLOUDINARY_URL
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Real Estate API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth (POST /login, POST /register, GET /profile)',
      users: '/api/users (GET, GET /agents, GET /:id, PUT /:id)',
      public_agents: '/api/public/agents (GET, GET /:id)',
      health: '/api/health'
    }
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Globalny handler błędów
const { errorHandler } = require('./utils/errorUtils');
app.use(errorHandler);

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development, just log
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in development, just log
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\nReal Estate API started on port ${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Automatyczne czyszczenie sesji co godzinę w trybie produkcyjnym
  if (process.env.NODE_ENV === 'production') {
    console.log('Setting up session cleanup job...');
    setInterval(() => {
      sessionUtils.cleanupExpiredSessions().catch(console.error);
    }, 60 * 60 * 1000); // Co godzinę
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
