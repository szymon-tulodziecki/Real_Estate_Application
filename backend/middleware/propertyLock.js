const { redisClient } = require('./session');

// Klucz blokady: property:lock:<propertyId>
// Wartość: JSON { userId, since }
// TTL: 15 minut (auto-zwolnienie jeśli użytkownik zamknął kartę)
const LOCK_TTL = 15 * 60; // sekundy

async function acquirePropertyLock(propertyId, userId) {
  const key = `property:lock:${propertyId}`;
  const existing = await redisClient.get(key);
  if (existing) {
    const data = JSON.parse(existing);
    if (data.userId !== userId) {
      return { acquired:false, owner:data.userId, since:data.since };
    }
    // odśwież TTL jeśli ten sam user
    await redisClient.expire(key, LOCK_TTL);
    return { acquired:true, owner:userId, since:data.since, refreshed:true };
  }
  const value = JSON.stringify({ userId, since: Date.now() });
  const result = await redisClient.set(key, value, { NX: true, EX: LOCK_TTL });
  return { acquired: !!result, owner: userId, since: Date.now() };
}

async function releasePropertyLock(propertyId, userId) {
  const key = `property:lock:${propertyId}`;
  const existing = await redisClient.get(key);
  if (!existing) return { released:true };
  const data = JSON.parse(existing);
  if (data.userId !== userId) return { released:false, reason:'not-owner' };
  await redisClient.del(key);
  return { released:true };
}

async function getPropertyLock(propertyId) {
  const key = `property:lock:${propertyId}`;
  const existing = await redisClient.get(key);
  if (!existing) return null;
  const ttl = await redisClient.ttl(key);
  const data = JSON.parse(existing);
  return { ...data, ttl };
}

// Middleware sprawdzający lock przed edycją
async function requirePropertyLock(req,res,next) {
  try {
    const propertyId = req.params.id;
    if (!propertyId) return res.status(400).json({ message:'Brak ID nieruchomości' });
    // Akceptuj ID użytkownika z sesji lub z auth middleware (req.user)
    const sessionUserId = req.session?.user?._id;
    const authUserId = req.user?._id;
    const userId = String(sessionUserId || authUserId);
    if (!userId || userId === 'undefined') return res.status(401).json({ message:'Brak autoryzacji' });

    console.log('Lock check for property:', propertyId, 'user:', userId);
    
    const lock = await getPropertyLock(propertyId);
    
    if (lock) {
      console.log('Existing lock:', lock.userId, 'vs current user:', userId);
      if (String(lock.userId) !== userId) {
        console.log('Lock owned by different user - rejecting');
        return res.status(423).json({ message:'Nieruchomość jest obecnie edytowana przez innego użytkownika', lock });
      }
      console.log('Lock owned by same user - refreshing');
    } else {
      console.log('No existing lock - acquiring');
    }
    
    // Acquire or refresh
    await acquirePropertyLock(propertyId, userId);
    next();
  } catch (e) {
    console.error('Property lock error', e);
    res.status(500).json({ message:'Błąd blokady nieruchomości' });
  }
}

module.exports = {
  acquirePropertyLock,
  releasePropertyLock,
  getPropertyLock,
  requirePropertyLock
};
