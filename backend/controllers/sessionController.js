const Session = require('../models/Session');
const User = require('../models/User');
const { asyncHandler } = require('../utils/errorUtils');
const { redisClient } = require('../middleware/session');

exports.getActiveSessions = asyncHandler(async (req, res) => {
  // Tylko adminowie i root mogą widzieć aktywne sesje
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'root')) {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  const currentUser = req.user;
  const isRoot = currentUser.role === 'root';

  // NAJPIERW: Oznacz nieaktywne sesje (starsze niż 30 minut)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const cleanupResult = await Session.updateMany(
    {
      isActive: true,
      lastActivity: { $lt: thirtyMinutesAgo }
    },
    {
      $set: { isActive: false }
    }
  );
  
  if (cleanupResult.modifiedCount > 0) {
    console.log('Marked', cleanupResult.modifiedCount, 'sessions as inactive');
  }

  // Pobierz aktywne sesje
  const sessions = await Session.find({
    isActive: true,
    lastActivity: { $gte: thirtyMinutesAgo }
  })
  .populate({
    path: 'userId',
    select: 'firstName lastName email employeeId avatar role createdBy'
  })
  .sort({ lastActivity: -1 });

  // Filtruj sesje na podstawie uprawnień użytkownika
  let filteredSessions;
  if (isRoot) {
    // Root admin widzi wszystkich
    filteredSessions = sessions.filter(session => session.userId !== null);
  } else {
    // Zwykły admin widzi tylko agentów i siebie
    filteredSessions = sessions.filter(session => 
      session.userId !== null && 
      (session.userId.role === 'agent' || session.userId._id.toString() === currentUser._id.toString())
    );
  }

  res.json({ sessions: filteredSessions });
});

exports.terminateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  console.log(`[terminateSession] Request by user ${req.user?.email || 'unknown'} for session ${sessionId}`);

  // Tylko adminowie i root mogą terminować sesje
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'root')) {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  const session = await Session.findById(sessionId).populate('userId');
  
  if (!session) {
    return res.status(404).json({ message: 'Sesja nie znaleziona' });
  }

  // Nie można terminować własnej sesji
  if (session.userId._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'Nie można terminować własnej sesji' });
  }

  const isRoot = req.user.role === 'root';
  const targetIsAdmin = session.userId.role === 'admin' || session.userId.role === 'root';

  // Sprawdź uprawnienia do terminowania sesji
  if (targetIsAdmin && !isRoot) {
    return res.status(403).json({ 
      message: 'Tylko root administrator może wylogowywać innych administratorów' 
    });
  }

  // Dezaktywuj WSZYSTKIE sesje tego użytkownika (nie tylko jedną)
  const result = await Session.updateMany(
    { userId: session.userId._id.toString(), isActive: true },
    { $set: { isActive: false } }
  );

  // Ustaw timestamp wymuszonego wylogowania dla wszystkich urządzeń
  await User.findByIdAndUpdate(session.userId._id, {
    forceLogoutAt: new Date()
  });

  // Usuń wszystkie sesje z Redis dla tego użytkownika
  try {
    const deletedFromRedis = await sessionUtils.logoutUserFromAllDevices(session.userId._id.toString());
    console.log(`Removed ${deletedFromRedis} Redis sessions for user: ${session.userId.email}`);
  } catch (redisError) {
    console.error('Error removing sessions from Redis:', redisError);
  }

  res.json({ 
    message: `Wszystkie sesje ${session.userId.role === 'admin' ? 'administratora' : 'agenta'} ${session.userId.firstName} ${session.userId.lastName} zostały zakończone (${result.modifiedCount} sesji dezaktywowanych)`,
    terminatedUser: {
      name: `${session.userId.firstName} ${session.userId.lastName}`,
      email: session.userId.email,
      employeeId: session.userId.employeeId,
      role: session.userId.role,
      sessionsTerminated: result.modifiedCount
    }
  });
});

exports.getSessionStats = asyncHandler(async (req, res) => {
  // Tylko adminowie i root mogą widzieć statystyki
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'root')) {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [activeNow, activeToday] = await Promise.all([
    Session.countDocuments({
      isActive: true,
      lastActivity: { $gte: thirtyMinutesAgo }
    }),
    Session.countDocuments({
      isActive: true,
      lastActivity: { $gte: oneDayAgo }
    })
  ]);

  res.json({
    stats: {
      activeNow,
      activeToday,
      lastUpdate: now
    }
  });
});
