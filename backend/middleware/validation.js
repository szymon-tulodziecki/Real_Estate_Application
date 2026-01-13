const { body, validationResult } = require('express-validator');

// Walidacja użytkownika
const validateUser = [
  body('employeeId')
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('ID pracownika musi mieć od 4 do 10 cyfr')
    .matches(/^[0-9]+$/)
    .withMessage('ID pracownika może zawierać tylko cyfry'),
  
  body('email')
    .isEmail()
    .withMessage('Podaj prawidłowy email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Hasło musi mieć minimum 6 znaków'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Imię musi mieć od 2 do 50 znaków'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nazwisko musi mieć od 2 do 50 znaków'),
  
  body('phone')
    .optional()
    .matches(/^[+]?[0-9\s\-()]+$/)
    .withMessage('Podaj prawidłowy numer telefonu'),
  
  body('role')
    .optional()
    .isIn(['admin', 'agent'])
    .withMessage('Nieprawidłowa rola użytkownika'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().reduce((acc, error) => {
        acc[error.path] = error.msg;
        return acc;
      }, {});
      
      return res.status(400).json({
        message: 'Błędy walidacji',
        errors: formattedErrors
      });
    }
    next();
  }
];

// Walidacja logowania
const validateLogin = [
  body('employeeId')
    .trim()
    .isLength({ min: 4, max: 10 })
    .withMessage('Numer pracownika musi mieć od 4 do 10 cyfr')
    .matches(/^[0-9]+$/)
    .withMessage('Numer pracownika może zawierać tylko cyfry'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Hasło musi mieć minimum 6 znaków'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().reduce((acc, error) => {
        acc[error.path] = error.msg;
        return acc;
      }, {});
      
      return res.status(400).json({
        message: 'Błędy walidacji',
        errors: formattedErrors
      });
    }
    next();
  }
];

// Walidacja nieruchomości

const validateProperty = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Tytuł musi mieć od 3 do 200 znaków'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Opis musi mieć od 10 do 5000 znaków'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Cena musi być liczbą większą od 0'),
  
  body('type')
    .isIn(['mieszkanie', 'dom', 'działka', 'lokal', 'garaż', 'biuro', 'magazyn', 'inne'])
    .withMessage('Nieprawidłowy typ nieruchomości'),
  
  body('transactionType')
    .isIn(['sprzedaż', 'wynajem', 'sprzedaż_wynajem'])
    .withMessage('Nieprawidłowy typ transakcji'),
  
  body('area')
    .isFloat({ min: 1 })
    .withMessage('Powierzchnia musi być liczbą większą od 0'),
  
  body('rooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Liczba pokoi musi być liczbą całkowitą większą lub równą 0'),
  
  body('floor')
    .optional()
    .isInt()
    .withMessage('Piętro musi być liczbą całkowitą'),
  
  body('buildingFloors')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Liczba pięter musi być liczbą całkowitą większą od 0'),
  
  body('buildYear')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage('Rok budowy musi być liczbą całkowitą między 1800 a bieżącym rokiem'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Adres musi mieć od 2 do 200 znaków'),
  
  body('location.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Miejscowość jest wymagana i musi mieć od 2 do 100 znaków'),
  
  body('location.district')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Dzielnica musi mieć od 2 do 100 znaków'),
  
  body('location.voivodeship')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Województwo musi mieć od 2 do 100 znaków'),
  
  body('location.postalCode')
    .optional()
    .matches(/^\d{2}-\d{3}$/)
    .withMessage('Kod pocztowy musi być w formacie XX-XXX'),
  
  body('features')
    .optional()
    .isArray()
    .withMessage('Cechy muszą być tablicą'),
  
  body('features.*')
    .optional()
    .isIn([
      'balkon', 'taras', 'ogród', 'garaż', 'piwnica', 'strych',
      'klimatyzacja', 'kominek', 'internet', 'ochrona',
      'winda', 'dostępny_dla_niepełnosprawnych', 'zwierzęta_dozwolone',
      'parking', 'meble', 'kuchnia_wyposażona'
    ])
    .withMessage('Nieprawidłowa cecha nieruchomości'),
  
  body('status')
    .optional()
    .isIn(['aktywne', 'sprzedane', 'wynajęte', 'wycofane', 'weryfikacja', 'rezerwacja'])
    .withMessage('Nieprawidłowy status'),
  
  body('isPromoted')
    .optional()
    .isBoolean()
    .withMessage('Pole promowane musi być wartością logiczną'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Convert errors array to object with field paths as keys
      const formattedErrors = errors.array().reduce((acc, error) => {
        acc[error.path] = error.msg;
        return acc;
      }, {});
      
      return res.status(400).json({
        message: 'Błędy walidacji',
        errors: formattedErrors
      });
    }
    next();
  }
];

module.exports = { validateProperty, validateUser, validateLogin };

module.exports.dynamicPropertyValidation = async (req, res, next) => {
  try {
    const isCreate = req.method === 'POST';
    const data = req.body || {};
    const errors = {};

    const requiredOnCreate = ['title','price','type','transactionType'];
    if (isCreate) {
      requiredOnCreate.forEach(f => {
        if (data[f] === undefined || data[f] === null || data[f] === '') {
          errors[f] = `${f} jest wymagane`;
        }
      });
    }

    // Helper validations only if field provided
    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length < 3 || data.title.trim().length > 200) {
        errors.title = 'Tytuł musi mieć od 3 do 200 znaków';
      }
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string' || data.description.trim().length < 3 || data.description.trim().length > 5000) {
        errors.description = 'Opis musi mieć od 3 do 5000 znaków';
      }
    }

    const toNumberFields = ['price','promotionalPrice','area','rooms','floor','buildingFloors','buildYear'];
    toNumberFields.forEach(f => {
      if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
        const num = Number(data[f]);
        if (Number.isNaN(num)) {
          errors[f] = `${f} musi być liczbą`;
        } else {
          data[f] = num;
        }
      } else if (data[f] === '') {
        delete data[f];
      }
    });

    if (data.price !== undefined && data.price < 0) {
      errors.price = 'Cena musi być >= 0';
    }

    if (data.promotionalPrice !== undefined) {
      if (data.promotionalPrice < 0) errors.promotionalPrice = 'Cena promocyjna >= 0';
      if (data.price !== undefined && data.promotionalPrice >= data.price) {
        errors.promotionalPrice = 'Cena promocyjna musi być niższa od ceny';
      }
    }

    if (data.area !== undefined && data.area <= 0) {
      errors.area = 'Powierzchnia musi być > 0';
    }

    if (data.rooms !== undefined && (!Number.isInteger(data.rooms) || data.rooms < 0)) {
      errors.rooms = 'Liczba pokoi musi być liczbą całkowitą >= 0';
    }

    // Dynamic rules based on property type
    const noRoomsTypes = ['działka', 'lokal'];
    if (data.type && noRoomsTypes.includes(data.type)) {
      // Force remove rooms for these types
      if (data.rooms !== undefined) delete data.rooms;
    }

    // Location nested validation (only present fields)
    if (data.location) {
      if (typeof data.location !== 'object') {
        errors['location'] = 'Location musi być obiektem';
      } else {
        if (data.location.address !== undefined) {
          const v = String(data.location.address).trim();
          if (v && (v.length < 2 || v.length > 200)) errors['location.address'] = 'Adres 2-200 znaków';
          if (v) data.location.address = v;
          else delete data.location.address;
        }
        if (data.location.city !== undefined) {
          const v = String(data.location.city).trim();
          if (v.length < 2 || v.length > 100) errors['location.city'] = 'Miejscowość 2-100 znaków';
          data.location.city = v;
        }
        if (data.location.postalCode !== undefined) {
          const pc = String(data.location.postalCode).trim();
            if (pc && !/^\d{2}-\d{3}$/.test(pc)) errors['location.postalCode'] = 'Kod pocztowy w formacie XX-XXX';
            if(!pc) delete data.location.postalCode;
        }
        // Parsowanie współrzędnych z FormData
        if (data.location.coordinates !== undefined) {
          if (typeof data.location.coordinates === 'object' && data.location.coordinates !== null) {
            const coords = data.location.coordinates;
            if (coords.x !== undefined && coords.y !== undefined) {
              const x = Number(coords.x);
              const y = Number(coords.y);
              if (!isNaN(x) && !isNaN(y)) {
                data.location.coordinates = { x, y };
              } else {
                errors['location.coordinates'] = 'Współrzędne muszą być liczbami';
              }
            } else {
              delete data.location.coordinates;
            }
          } else {
            delete data.location.coordinates;
          }
        }
      }
    }

    // Parsowanie współrzędnych z FormData dla EditProperty (location[coordinates][x], location[coordinates][y])
    if (data['location[coordinates][x]'] !== undefined && data['location[coordinates][y]'] !== undefined) {
      const x = Number(data['location[coordinates][x]']);
      const y = Number(data['location[coordinates][y]']);
      if (!isNaN(x) && !isNaN(y)) {
        if (!data.location) data.location = {};
        data.location.coordinates = { x, y };
      }
      // Usuń te pola z FormData
      delete data['location[coordinates][x]'];
      delete data['location[coordinates][y]'];
    }    // Features
    if (data.features !== undefined) {
      if (!Array.isArray(data.features)) {
        errors.features = 'Cechy muszą być tablicą';
      } else {
        data.features = data.features.filter(f => typeof f === 'string' && f.trim()).map(f => f.trim());
      }
    }

    // Basic status validation if provided
    const validStatus = ['aktywne','sprzedane','wynajęte','wycofane','weryfikacja','rezerwacja'];
    if (data.status && !validStatus.includes(data.status)) {
      errors.status = 'Nieprawidłowy status';
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Błędy walidacji', errors });
    }

    // Remove empty string fields
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });

    req.body = data;
    return next();
  } catch (e) {
    return res.status(500).json({ message: 'Błąd walidacji', error: e.message });
  }
};


