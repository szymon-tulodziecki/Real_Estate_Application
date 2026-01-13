const express = require('express');
const multer = require('multer');
const {
  createProperty,
  getAllProperties,
  getRecentlySoldProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertyStats,
  getStatus,
  uploadPropertyImages,
  setMainPropertyImage
} = require('../controllers/propertyController');
const { auth, optionalAuth } = require('../middleware/auth');
const { dynamicPropertyValidation } = require('../middleware/validation');
const { requirePropertyLock, releasePropertyLock, getPropertyLock } = require('../middleware/propertyLock');

const router = express.Router();
const uploadMem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 20 } });

// Public routes
router.get('/', optionalAuth, getAllProperties);
router.get('/recently-sold', optionalAuth, getRecentlySoldProperties);
router.get('/stats', getPropertyStats);
router.get('/status', getStatus);
router.get('/:id', optionalAuth, getPropertyById);

// Protected routes
router.use(auth);
// Lock management endpoints
router.post('/:id/lock', async (req,res) => {
  const { acquirePropertyLock } = require('../middleware/propertyLock');
  const User = require('../models/User');
  const userId = (req.user && req.user._id) || (req.session && req.session.user && req.session.user._id);
  if (!userId) return res.status(401).json({ message:'Brak autoryzacji' });
  const { id } = req.params;
  const result = await acquirePropertyLock(id, String(userId));
  if (!result.acquired) {
    // Pobierz informacje o użytkowniku, który ma lock
    const ownerUser = await User.findById(result.owner).select('firstName lastName email');
    return res.status(423).json({ 
      message:'Zablokowane przez innego użytkownika', 
      lock: { 
        ...result, 
        ownerInfo: ownerUser ? {
          name: `${ownerUser.firstName} ${ownerUser.lastName}`,
          email: ownerUser.email
        } : null
      }
    });
  }
  res.json({ message:'Lock acquired', lock: result });
});
router.get('/:id/lock', async (req,res)=> {
  const lock = await getPropertyLock(req.params.id);
  if (!lock) return res.json({ locked:false });
  res.json({ locked:true, lock });
});
router.delete('/:id/lock', async (req,res)=> {
  const { releasePropertyLock } = require('../middleware/propertyLock');
  const userId = (req.user && req.user._id) || (req.session && req.session.user && req.session.user._id);
  if (!userId) return res.status(401).json({ message:'Brak autoryzacji' });
  const result = await releasePropertyLock(req.params.id, String(userId));
  if (!result.released) return res.status(403).json({ message:'Nie jesteś właścicielem locka' });
  res.json({ message:'Lock released' });
});
// Use lock middleware for modifying endpoints
router.post('/', uploadMem.array('images', 20), dynamicPropertyValidation, createProperty);
router.put('/:id', requirePropertyLock, uploadMem.array('images', 20), dynamicPropertyValidation, updateProperty);
router.delete('/:id', deleteProperty);
router.post('/:id/images', requirePropertyLock, uploadMem.array('images', 20), uploadPropertyImages);
router.patch('/:id/images/main/:filename', requirePropertyLock, setMainPropertyImage);

module.exports = router;
