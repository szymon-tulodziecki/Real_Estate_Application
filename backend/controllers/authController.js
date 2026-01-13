const User = require('../models/User');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');
const { sessionUtils } = require('../middleware/session');
const authService = require('../services/authService');
const { asyncHandler } = require('../utils/errorUtils');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
  });
};

const strongPassword = (password) => {
  // Min. 10 znaków, wielka litera, cyfra, znak specjalny
  return /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/.test(password);
};

const register = asyncHandler(async (req, res) => {
  const { role, password } = req.body;

  // Sprawdzenie uprawnień do tworzenia administratorów
  // Root może tworzyć wszystkich, Admin może tworzyć Admin i Agent
  if (role === 'admin' && req.user?.role !== 'admin' && req.user?.role !== 'root') {
    return res.status(403).json({ message: 'Brak uprawnień do tworzenia administratorów' });
  }

  // Walidacja siły hasła
  if (!strongPassword(password)) {
    return res.status(400).json({
      error: 'Błąd walidacji',
      message: 'Hasło musi mieć min. 10 znaków, wielką literę, cyfrę i znak specjalny',
      code: 'WEAK_PASSWORD'
    });
  }

  const user = await authService.register(req.body);
  const token = generateToken(user._id);
  
  res.status(201).json({
    message: 'Użytkownik utworzony pomyślnie',
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  });
});

const login = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    
    // Podstawowa walidacja
    if (!employeeId || !password) {
      return res.status(400).json({ 
        error: 'Błąd walidacji',
        message: 'Numer pracownika i hasło są wymagane',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Walidacja formatu - employeeId musi być numerem
    if (!/^[0-9]+$/.test(employeeId)) {
      return res.status(400).json({ 
        error: 'Błąd walidacji',
        message: 'Numer pracownika może zawierać tylko cyfry',
        code: 'INVALID_EMPLOYEE_ID_FORMAT'
      });
    }

    // Walidacja siły hasła przy logowaniu (opcjonalnie: tylko ostrzeżenie, nie blokuj logowania)
    if (!strongPassword(password)) {
      // Możesz logować próbę słabego hasła lub zwrócić warning
      // return res.status(400).json({ error: 'Błąd walidacji', message: 'Hasło nie spełnia wymagań złożoności', code: 'WEAK_PASSWORD' });
    }

    // Znajdź użytkownika
    const user = await User.findOne({ employeeId });
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Nieprawidłowe dane',
        message: 'Nieprawidłowy numer pracownika lub hasło. Sprawdź wprowadzone dane i spróbuj ponownie.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Sprawdź hasło
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Nieprawidłowe dane',
        message: 'Nieprawidłowy numer pracownika lub hasło. Sprawdź wprowadzone dane i spróbuj ponownie.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Dezaktywuj wszystkie poprzednie sesje tego użytkownika (jeden użytkownik = jedna sesja)
    try {
      const beforeCount = await Session.countDocuments({ userId: user._id.toString(), isActive: true });
      const result = await Session.updateMany(
        { userId: user._id.toString(), isActive: true },
        { $set: { isActive: false } }
      );
      console.log(`Deactivated ${result.modifiedCount} previous sessions for user: ${user.email} (was ${beforeCount} active)`);
    } catch (deactivateError) {
      console.error('Error deactivating previous sessions:', deactivateError);
      // Kontynuuj mimo błędu
    }

    // Aktualizuj czas ostatniego logowania
    user.lastLogin = new Date();
    await user.save();

    // Zapisz sesję użytkownika w Redis
    try {
      await sessionUtils.saveUserSession(req, user);
    } catch (sessionError) {
      console.error('Session save error:', sessionError);
      // Kontynuuj mimo błędu sesji
    }

    // Utwórz sesję w MongoDB dla widgetu aktywnych sesji
    try {
      // Używaj tylko req.sessionID jako sessionToken
      const sessionToken = req.sessionID;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      if (sessionToken) {
        await Session.findOneAndUpdate(
          { sessionToken: sessionToken },
          {
            userId: user._id,
            sessionToken: sessionToken,
            ipAddress: ipAddress,
            userAgent: userAgent,
            lastActivity: new Date(),
            isActive: true
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log('MongoDB Session upserted for user:', user.email, 'with token:', sessionToken);
      }
    } catch (sessionDbError) {
      console.error('MongoDB Session save error:', sessionDbError);
      // Kontynuuj mimo błędu - nie blokuj logowania
    }

    // Wygeneruj token JWT
    const token = generateToken(user._id);

    // Sukces logowania
    res.status(200).json({
      success: true,
      message: 'Logowanie pomyślne',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Nie ujawniaj szczegółów błędu w produkcji
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({ 
      error: 'Błąd serwera',
      message: 'Wystąpił błąd podczas logowania. Spróbuj ponownie za chwilę.',
      code: 'SERVER_ERROR',
      ...(isDevelopment && { details: error.message })
    });
  }
};const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  res.json({
    user: {
      id: user._id,
      _id: user._id,
      employeeId: user.employeeId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      createdBy: user.createdBy, // DODANO createdBy!
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  // Usuń sesję z MongoDB
  try {
    const sessionToken = req.sessionID;
    const userId = req.user?._id;
    if (userId && sessionToken) {
      // Szukaj po tokenie sesji
      const deletedSession = await Session.findOneAndDelete({ 
        sessionToken: sessionToken
      });
      if (deletedSession) {
        console.log('MongoDB Session deleted for user:', req.user.email, 'token:', sessionToken);
      } else {
        console.log('No MongoDB Session found to delete for token:', sessionToken);
      }
    }
  } catch (sessionDbError) {
    console.error('MongoDB Session delete error:', sessionDbError);
  }

  // Natychmiastowe usunięcie sesji z Redis
  await sessionUtils.forceDestroySession(req);
  
  // Wyczyść cookie
  res.clearCookie('connect.sid', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  
  res.json({ message: 'Wylogowanie pomyślne' });
});

const logoutAllDevices = asyncHandler(async (req, res) => {
  const { user } = req;
  await sessionUtils.logoutUserFromAllDevices(user._id);
  
  res.json({ message: 'Wylogowano ze wszystkich urządzeń' });
});

const getActiveSessions = asyncHandler(async (req, res) => {
  const { user } = req;
  const sessions = await sessionUtils.getUserActiveSessions(user._id);
  
  res.json({ sessions });
});

// Critical: Ensure all functions are exported as an object
module.exports = {
  register,
  login,
  logout,
  logoutAllDevices,
  getActiveSessions,
  getProfile
};
