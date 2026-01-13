const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createError } = require('../utils/errorUtils');

/**
 * Serwis do obsługi logiki biznesowej związanej z uwierzytelnianiem
 */
const authService = {
  /**
   * Rejestracja nowego użytkownika
   */
  register: async (userData) => {
    const { employeeId, email } = userData;

    // Sprawdź czy użytkownik z takim numerem już istnieje
    const existingEmployeeId = await User.findOne({ employeeId });
    if (existingEmployeeId) {
      throw createError('Użytkownik z takim numerem pracownika już istnieje', 400);
    }

    // Sprawdź czy użytkownik z takim email już istnieje
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw createError('Użytkownik z takim adresem email już istnieje', 400);
    }

    // Tworzenie nowego użytkownika
    const user = new User(userData);
    await user.save();
    
    // Nie zwracaj hasła
    const userObject = user.toObject();
    delete userObject.password;
    
    return userObject;
  },

  /**
   * Logowanie użytkownika - tylko po numerze pracownika
   */
  login: async (employeeId, password) => {
    // Sprawdź czy użytkownik istnieje (tylko po employeeId)
    const user = await User.findOne({ employeeId: employeeId });
    if (!user) {
      throw createError('Nieprawidłowe dane logowania', 401);
    }

    // Sprawdź czy konto jest aktywne
    if (!user.isActive) {
      throw createError('Konto nieaktywne', 401);
    }

    // Sprawdź hasło
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw createError('Nieprawidłowe dane logowania', 401);
    }

    // Aktualizuj ostatnie logowanie
    user.lastLogin = new Date();
    await user.save();

    // Zwróć użytkownika bez hasła
    const userObject = user.toObject();
    delete userObject.password;
    
    return userObject;
  },

  /**
   * Pobiera dane aktualnie zalogowanego użytkownika
   */
  getCurrentUser: async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw createError('Użytkownik nie istnieje', 404);
    }
    return user;
  },

  /**
   * Zmiana hasła użytkownika
   */
  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);
    if (!user) {
      throw createError('Użytkownik nie istnieje', 404);
    }

    // Sprawdź poprawność aktualnego hasła
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw createError('Aktualne hasło jest nieprawidłowe', 400);
    }

    // Walidacja siły nowego hasła
    if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/.test(newPassword)) {
      throw createError('Hasło musi mieć min. 10 znaków, wielką literę, cyfrę i znak specjalny', 400);
    }
    user.password = newPassword;
    await user.save();
    return { message: 'Hasło zostało zmienione pomyślnie' };
  },

  /**
   * Resetowanie hasła użytkownika (bez wymagania aktualnego hasła)
   * Uwaga: Ta metoda powinna być używana tylko przez admina lub po weryfikacji
   * resetującego przez token/email itp.
   */
  resetPassword: async (userId, newPassword) => {
    const user = await User.findById(userId);
    if (!user) {
      throw createError('Użytkownik nie istnieje', 404);
    }

    // Walidacja siły nowego hasła
    if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/.test(newPassword)) {
      throw createError('Hasło musi mieć min. 10 znaków, wielką literę, cyfrę i znak specjalny', 400);
    }
    user.password = newPassword;
    await user.save();
    return { message: 'Hasło zostało zresetowane pomyślnie' };
  }
};

module.exports = authService;
