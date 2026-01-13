const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createError } = require('../utils/errorUtils');

/**
 * Serwis do obsługi logiki biznesowej związanej z użytkownikami
 */
const userService = {
  /**
   * Pobiera wszystkich użytkowników
   */
  getAllUsers: async () => {
    return await User.find().select('-password');
  },

  /**
   * Pobiera użytkowników z rolą agent (publicznych i aktywnych)
   */
  getAllAgents: async () => {
    const agents = await User.find({ role: 'agent' }).select('-password');
    const activeAgents = agents.filter(a => a.isActive === true);
    return activeAgents.map(agent => agent.toObject ? agent.toObject() : agent);
  },

  /**
   * Pobiera użytkownika po ID
   */
  getUserById: async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw createError('Użytkownik nie istnieje', 404);
    }
    return user;
  },

  /**
   * Tworzy nowego użytkownika
   */
  createUser: async (userData) => {
    const { email } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError('Użytkownik z takim adresem email już istnieje', 400);
    }

    const user = new User(userData);
    await user.save();
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  },

  /**
   * Aktualizuje użytkownika
   */
  updateUser: async (userId, userData) => {
    if (userData.email) {
      const existingUser = await User.findOne({ email: userData.email, _id: { $ne: userId } });
      if (existingUser) {
        throw createError('Użytkownik z takim adresem email już istnieje', 400);
      }
    }

    // Zapobiegamy zmianie roli w tym serwisie (kontrola w kontrolerze też istnieje)
    if (userData.role) delete userData.role;

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      userData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw createError('Użytkownik nie istnieje', 404);
    }

    return user;
  },

  /**
   * Usuwa użytkownika (BEZ jeszcze czyszczenia avataru – dodamy w kontrolerze)
   */
  deleteUser: async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw createError('Użytkownik nie istnieje', 404);
    }
    return { message: 'Użytkownik usunięty', deletedUser: user };
  },

    /**
   * Sprawdza czy admin może usunąć innego admina
   * Reguły:
   * - Super admin (createdBy === null) może usunąć wszystkich adminów (oprócz samego siebie)
   * - Zwykły admin nie może usuwać żadnych innych adminów
   * - Nikt nie może usunąć super admina
   */
  canDeleteAdmin: async (requestingAdminId, adminToDeleteId) => {
    const requestingAdmin = await User.findById(requestingAdminId);
    const adminToDelete = await User.findById(adminToDeleteId);

    if (!requestingAdmin || !adminToDelete) {
      return false;
    }

    // Nie można usunąć samego siebie
    if (requestingAdminId.toString() === adminToDeleteId.toString()) {
      return false;
    }

    // Nie można usunąć super admina (createdBy === null)
    if (!adminToDelete.createdBy) {
      return false;
    }

    // Super admin może usunąć wszystkich innych adminów
    if (!requestingAdmin.createdBy) {
      return true;
    }

    // Zwykły admin nie może usuwać innych adminów
    return false;
  }
};

module.exports = userService;
