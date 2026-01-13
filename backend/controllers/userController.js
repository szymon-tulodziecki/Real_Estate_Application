const userService = require('../services/userService');
const { asyncHandler } = require('../utils/errorUtils');
const multer = require('multer');
const uploadService = require('../services/uploadService');

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.json({ users });
});

exports.getAgents = asyncHandler(async (req, res) => {
  const agents = await userService.getAllAgents();
  res.json({ agents });
});

exports.getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  res.json({ user });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.user) {
    return res.status(401).json({ message: 'Brak autoryzacji' });
  }
  const updateData = { ...req.body };

  // Sanitise: remove empty strings (do not overwrite with empty)
  Object.keys(updateData).forEach(k => {
    if (updateData[k] === '' || updateData[k] === null) delete updateData[k];
  });

  // Pobierz użytkownika do edycji, żeby sprawdzić jego rolę
  const userToEdit = await userService.getUserById(id);
  if (!userToEdit) {
    return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
  }

  // Sprawdzenie uprawnień
  // Root i Admin mogą edytować wszystkich, Agent tylko siebie
  if (req.user.role !== 'root' && req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  // Sprawdź czy zwykły admin próbuje edytować innego admina (root może wszystko)
  if (req.user.role === 'admin' && userToEdit.role === 'admin' && req.user._id.toString() !== id) {
    return res.status(403).json({ 
      message: 'Tylko Root Administrator może edytować konta innych administratorów' 
    });
  }

  // Agent nie może zmienić swojej roli
  if (req.user.role !== 'admin') {
    delete updateData.role;
  }

  try {
    const user = await userService.updateUser(id, updateData);
    return res.json({ message: 'Użytkownik zaktualizowany pomyślnie', user });
  } catch (e) {
    // Duplicate key (np. email)
    if (e?.code === 11000) {
      const field = Object.keys(e.keyValue || { email: 'email' })[0];
      return res.status(400).json({ message: `${field} już istnieje w bazie danych` });
    }
    if (e?.name === 'ValidationError') {
      const errors = {};
      Object.values(e.errors).forEach(er => { errors[er.path] = er.message; });
      return res.status(400).json({ message: 'Błędy walidacji', errors });
    }
    console.error('updateUser internal error:', e);
    return res.status(e.statusCode || 500).json({ message: e.message || 'Błąd serwera przy aktualizacji użytkownika' });
  }
});

// Upload avatar (expects multipart form with field 'avatar')
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
exports.uploadAvatarMiddleware = upload.single('avatar');

exports.uploadAvatar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.user) return res.status(401).json({ message: 'Brak autoryzacji' });
  if (!req.file) return res.status(400).json({ message: 'Brak pliku' });
  
  try {
    // Upload do Cloudinary
    const result = await uploadService.uploadAvatar(req.file.buffer, id, req.file.mimetype);
    
    // Zaktualizuj użytkownika w bazie
    const user = await userService.updateUser(id, { avatar: result.avatarUrl });
    
    res.json({ message: 'Avatar zaktualizowany', user, avatarUrl: result.avatarUrl });
  } catch (e) {
    console.error('uploadAvatar error:', e);
    return res.status(500).json({ message: 'Błąd podczas uploadu avataru', details: e.message });
  }
});

exports.createUserMiddleware = upload.single('avatar');

exports.createUser = asyncHandler(async (req, res) => {
  // Tylko admin i root (routy już zabezpieczone), ale dodatkowy check nie zaszkodzi
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'root')) {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }

  const { employeeId, email, password, firstName, lastName, phone, role, isPublic } = req.body;

  if (!employeeId || !email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Wymagane pola: employeeId, email, password, firstName, lastName' });
  }

  // Sprawdź uprawnienia do tworzenia roli
  if (req.user.role === 'admin' && role === 'admin') {
    return res.status(403).json({ message: 'Administrator nie może tworzyć kont administratorów' });
  }
  if (req.user.role === 'admin' && role === 'root') {
    return res.status(403).json({ message: 'Administrator nie może tworzyć kont root' });
  }

  try {
    // Utwórz dane użytkownika
    const userData = { employeeId, email, password, firstName, lastName, phone, role };
    
    // Dodaj createdBy - kto utworzył tego użytkownika
    userData.createdBy = req.user._id;
    
    // Dodaj isPublic tylko dla agentów
    if (role === 'agent' && isPublic !== undefined) {
      userData.isPublic = isPublic === 'true' || isPublic === true;
    }
    
    // Utwórz użytkownika
    const user = await userService.createUser(userData);

    // Jeśli dołączono plik avatara podczas tworzenia, spróbuj zapisać go w Cloudinary
    if (req.file) {
      try {
        const result = await uploadService.uploadAvatar(req.file.buffer, user._id, req.file.mimetype);
        const updated = await userService.updateUser(user._id, { avatar: result.avatarUrl });
        return res.status(201).json({ message: 'Użytkownik utworzony', user: updated });
      } catch (e) {
        console.warn('Błąd uploadu avatara przy tworzeniu:', e.message);
      }
    }

    return res.status(201).json({ message: 'Użytkownik utworzony', user });
  } catch (e) {
    if (e?.code === 11000) {
      const field = Object.keys(e.keyValue || { email: 'email' })[0];
      return res.status(400).json({ message: `${field} już istnieje w bazie danych` });
    }
    if (e?.name === 'ValidationError') {
      const errors = {};
      Object.values(e.errors).forEach(er => { errors[er.path] = er.message; });
      return res.status(400).json({ message: 'Błędy walidacji', errors });
    }
    console.error('createUser internal error:', e);
    return res.status(e.statusCode || 500).json({ message: e.message || 'Błąd serwera przy tworzeniu użytkownika' });
  }
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (id === req.user._id.toString()) {
    return res.status(400).json({ message: 'Nie można usunąć samego siebie' });
  }

  // Pobierz użytkownika do usunięcia
  const userToDelete = await userService.getUserById(id);
  if (!userToDelete) {
    return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
  }

  // Sprawdzenie uprawnień do usuwania adminów
  // Root może usunąć każdego (poza samym sobą), Admin tylko tych których stworzył
  if (userToDelete.role === 'admin' && req.user.role !== 'root') {
    // Sprawdź czy użytkownik może usunąć tego admina
    const canDelete = await userService.canDeleteAdmin(req.user._id, userToDelete._id);
    
    if (!canDelete) {
      return res.status(403).json({ 
        message: 'Brak uprawnień. Możesz usunąć tylko administratorów którzy zostali utworzeni przez Ciebie.' 
      });
    }
  }
  
  // Nie można usuwać innych użytkowników root
  if (userToDelete.role === 'root') {
    return res.status(403).json({ 
      message: 'Nie można usuwać użytkowników Root' 
    });
  }

  const result = await userService.deleteUser(id);

  // Usuń avatar z Cloudinary
  try {
    await uploadService.deleteAvatar(id);
  } catch (e) {
    console.warn('Nie udało się usunąć avataru:', e.message);
  }

  res.json(result);
});
