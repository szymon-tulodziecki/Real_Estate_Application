const { redisClient } = require('./session');

// Klucz blokady: user:lock:<userId>
// Wartość: JSON { userId: editorUserId, since }
// TTL: 15 minut (auto-zwolnienie jeśli użytkownik zamknął kartę)
const LOCK_TTL = 15 * 60; // sekundy

async function acquireUserLock(userIdToLock, editorUserId) {
  const key = `user:lock:${userIdToLock}`;
  const existing = await redisClient.get(key);
  if (existing) {
    const data = JSON.parse(existing);
    if (data.userId !== editorUserId) {
      return { acquired: false, owner: data.userId, since: data.since };
    }
    // odśwież TTL jeśli ten sam user
    await redisClient.expire(key, LOCK_TTL);
    return { acquired: true, owner: editorUserId, since: data.since, refreshed: true };
  }
  const value = JSON.stringify({ userId: editorUserId, since: Date.now() });
  const result = await redisClient.set(key, value, { NX: true, EX: LOCK_TTL });
  return { acquired: !!result, owner: editorUserId, since: Date.now() };
}

async function releaseUserLock(userIdToUnlock, editorUserId) {
  const key = `user:lock:${userIdToUnlock}`;
  const existing = await redisClient.get(key);
  if (!existing) return { released: true };
  const data = JSON.parse(existing);
  if (data.userId !== editorUserId) return { released: false, reason: 'not-owner' };
  await redisClient.del(key);
  return { released: true };
}

async function getUserLock(userIdToCheck) {
  const key = `user:lock:${userIdToCheck}`;
  const existing = await redisClient.get(key);
  if (!existing) return null;
  const ttl = await redisClient.ttl(key);
  const data = JSON.parse(existing);
  return { ...data, ttl };
}

// Middleware sprawdzający lock przed edycją użytkownika
async function requireUserLock(req, res, next) {
  try {
    const userIdToLock = req.params.id;
    if (!userIdToLock) return res.status(400).json({ message: 'Brak ID użytkownika' });
    
    // Akceptuj ID użytkownika z sesji lub z auth middleware (req.user)
    const sessionUserId = req.session?.user?._id;
    const authUserId = req.user?._id;
    const editorUserId = sessionUserId || authUserId;
    if (!editorUserId) return res.status(401).json({ message: 'Brak autoryzacji' });

    const lock = await getUserLock(userIdToLock);
    if (lock && lock.userId !== editorUserId.toString()) {
      return res.status(423).json({ 
        message: 'Użytkownik jest obecnie edytowany przez innego administratora', 
        lock 
      });
    }
    
    // Acquire or refresh
    await acquireUserLock(userIdToLock, editorUserId.toString());
    next();
  } catch (e) {
    console.error('User lock error', e);
    res.status(500).json({ message: 'Błąd blokady użytkownika' });
  }
}

module.exports = {
  acquireUserLock,
  releaseUserLock,
  getUserLock,
  requireUserLock
};
