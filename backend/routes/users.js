const express = require('express');
const {
  getUsers,
  getAgents,
  getUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  uploadAvatarMiddleware,
  createUser,
  createUserMiddleware
} = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');
const { requireUserLock, releaseUserLock, getUserLock } = require('../middleware/userLock');

const router = express.Router();

// Ogólne endpointy (bez :id)
router.get('/', auth, adminAuth, getUsers);
router.get('/agents', auth, getAgents);
router.get('/public/agents', getAgents); // Public endpoint dla agentów
router.get('/me', auth, (req, res) => res.json({ user: req.user }));
router.post('/', auth, adminAuth, createUserMiddleware, createUser);

// Endpointy do lockowania użytkowników (MUSZĄ BYĆ PRZED /:id)
router.post('/:id/lock', auth, async (req, res) => {
  const { acquireUserLock } = require('../middleware/userLock');
  const User = require('../models/User');
  const { id } = req.params;
  const userId = req.user._id.toString();
  const result = await acquireUserLock(id, userId);
  if (!result.acquired) {
    // Pobierz informacje o użytkowniku, który ma lock
    const ownerUser = await User.findById(result.owner).select('firstName lastName email');
    return res.status(423).json({
      message: 'Użytkownik jest obecnie edytowany przez innego administratora',
      lock: {
        ...result,
        ownerInfo: ownerUser ? {
          name: `${ownerUser.firstName} ${ownerUser.lastName}`,
          email: ownerUser.email
        } : null
      }
    });
  }
  res.json({ message: 'Lock acquired', lock: result });
});

router.get('/:id/lock', auth, async (req, res) => {
  const lock = await getUserLock(req.params.id);
  res.json({ lock });
});

router.delete('/:id/lock', auth, async (req, res) => {
  const { releaseUserLock } = require('../middleware/userLock');
  const { id } = req.params;
  const userId = req.user._id.toString();
  const result = await releaseUserLock(id, userId);
  res.json(result);
});

// Endpointy z :id (MUSZĄ BYĆ PO lock endpointach)
router.get('/:id', auth, getUser);
router.put('/:id', auth, requireUserLock, updateUser);
router.post('/:id/avatar', auth, requireUserLock, uploadAvatarMiddleware, uploadAvatar);
router.delete('/:id', auth, adminAuth, deleteUser);

module.exports = router;
