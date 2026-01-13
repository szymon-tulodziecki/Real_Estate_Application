const rateLimit = require('express-rate-limit');

// Mapa prób logowania dla każdego IP
const loginAttempts = new Map();
const blockedIPs = new Map();

// Czyść stare wpisy co 15 minut
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  
  // Czyść stare próby logowania
  for (const [ip, data] of loginAttempts) {
    if (now - data.lastAttempt > fifteenMinutes) {
      loginAttempts.delete(ip);
    }
  }
  
  // Czyść stare blokady
  for (const [ip, blockTime] of blockedIPs) {
    if (now - blockTime > fifteenMinutes) {
      blockedIPs.delete(ip);
    }
  }
}, 15 * 60 * 1000); // Co 15 minut

// Rate limiter dla endpointa logowania
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 10, // Maksymalnie 10 prób na 15 minut
  message: {
    error: 'Zbyt wiele prób logowania',
    message: 'Spróbuj ponownie za 15 minut',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Tylko dla nieudanych logowań
  skipSuccessfulRequests: true,
});

// Rate limiter ogólny dla API
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 1000, // 1000 requestów na 15 minut
  message: {
    error: 'Zbyt wiele żądań',
    message: 'Spróbuj ponownie później',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware sprawdzający zablokowane IP
const checkBlockedIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  if (blockedIPs.has(clientIP)) {
    const blockTime = blockedIPs.get(clientIP);
    const now = Date.now();
    const timeDiff = now - blockTime;
    const remainingTime = Math.ceil((15 * 60 * 1000 - timeDiff) / 1000 / 60); // w minutach
    
    console.log(`🚫 Blocked IP ${clientIP} attempted login. Remaining block time: ${remainingTime} minutes`);
    
    return res.status(429).json({
      error: 'IP zablokowane',
      message: `Twoje IP zostało tymczasowo zablokowane. Spróbuj ponownie za ${remainingTime} minut.`,
      code: 'IP_BLOCKED',
      retryAfter: remainingTime * 60
    });
  }
  
  next();
};

// Middleware do logowania nieudanych prób
const recordFailedLogin = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Jeśli to błąd logowania (401 lub błędne dane)
    if (res.statusCode === 401 || (data && data.message && data.message.includes('Nieprawidłowe'))) {
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const now = Date.now();
      
      // Pobierz lub utwórz dane dla tego IP
      let ipData = loginAttempts.get(clientIP) || { count: 0, firstAttempt: now, lastAttempt: now };
      
      // Resetuj licznik jeśli minęło więcej niż 15 minut
      if (now - ipData.firstAttempt > 15 * 60 * 1000) {
        ipData = { count: 0, firstAttempt: now, lastAttempt: now };
      }
      
      ipData.count++;
      ipData.lastAttempt = now;
      loginAttempts.set(clientIP, ipData);
      
      // Blokuj IP po 5 nieudanych próbach
      if (ipData.count >= 5) {
        blockedIPs.set(clientIP, now);
        
        // Zmień odpowiedź na informację o blokowaniu
        return originalJson.call(this, {
          error: 'IP zablokowane',
          message: 'Zbyt wiele nieudanych prób logowania. Twoje IP zostało tymczasowo zablokowane na 15 minut.',
          code: 'IP_BLOCKED_AFTER_ATTEMPTS',
          attemptsCount: ipData.count
        });
      }
      
      // Dodaj opóźnienie dla nieudanych prób (zwiększa się z każdą próbą)
      const delay = Math.min(ipData.count * 1000, 5000); // Max 5 sekund
      setTimeout(() => {
        originalJson.call(this, data);
      }, delay);
      return;
    }
    
    // Dla udanych logowań - wyczyść licznik
    if (res.statusCode === 200 && data && data.token) {
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      loginAttempts.delete(clientIP);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware do logowania wszystkich requestów logowania
const logLoginAttempts = (req, res, next) => {
  // Usunięto logowanie w konsoli dla bezpieczeństwa
  next();
};

module.exports = {
  loginRateLimit,
  apiRateLimit,
  checkBlockedIP,
  recordFailedLogin,
  logLoginAttempts,
  // Funkcje pomocnicze do monitorowania
  getLoginStats: () => ({
    activeAttempts: loginAttempts.size,
    blockedIPs: blockedIPs.size,
    attempts: Array.from(loginAttempts.entries()).map(([ip, data]) => ({
      ip,
      attempts: data.count,
      lastAttempt: new Date(data.lastAttempt).toISOString()
    })),
    blocked: Array.from(blockedIPs.entries()).map(([ip, blockTime]) => ({
      ip,
      blockedAt: new Date(blockTime).toISOString(),
      remainingMinutes: Math.ceil((15 * 60 * 1000 - (Date.now() - blockTime)) / 1000 / 60)
    }))
  })
};
