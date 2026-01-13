const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tytuł jest wymagany'],
    trim: true,
    maxlength: [200, 'Tytuł nie może być dłuższy niż 200 znaków']
  },
  description: {
    type: String,
    required: [true, 'Opis jest wymagany'],
    maxlength: [5000, 'Opis nie może być dłuższy niż 5000 znaków']
  },
  price: {
    type: Number,
    required: [true, 'Cena jest wymagana'],
    min: [0, 'Cena nie może być ujemna']
  },
  promotionalPrice: {
    type: Number,
    min: [0, 'Cena promocyjna nie może być ujemna'],
    validate: {
      validator: function(value) {
        // Promocyjna cena musi być niższa od zwykłej ceny
        return !value || value < this.price;
      },
      message: 'Cena promocyjna musi być niższa od zwykłej ceny'
    }
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  transactionType: {
    type: String,
    enum: {
      values: ['sprzedaż', 'wynajem', 'sprzedaż_wynajem'],
      message: 'Nieprawidłowy typ transakcji'
    },
    required: true
  },
  area: {
    type: Number,
    min: [1, 'Powierzchnia musi być większa niż 0']
  },
  rooms: {
    type: Number,
    min: [0, 'Liczba pokoi nie może być ujemna']
  },
  floor: Number,
  buildingFloors: Number,
  buildYear: Number,
  
  // Zdjęcia - Cloudinary URLs
  images: [{
    filename: String,  // Cloudinary public_id lub pełny URL
    url: String,       // Pełny Cloudinary URL
    isMain: {
      type: Boolean,
      default: false
    },
    alt: String
  }],
  
  location: {
    address: {
      type: String,
      required: [true, 'Adres jest wymagany']
    },
    city: {
      type: String,
      required: [true, 'Miasto jest wymagane']
    },
    district: String,
    voivodeship: String,
    country: {
      type: String,
      default: 'Polska'
    },
    postalCode: {
      type: String,
      match: [/^\d{2}-\d{3}$/, 'Podaj prawidłowy kod pocztowy (XX-XXX)']
    },
    coordinates: {
      x: Number,
      y: Number
    }
  },
  
  // Cechy dodatkowe
  features: [{
    type: String
  }],
  
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: {
      values: ['aktywne', 'sprzedane', 'wynajęte', 'wycofane', 'weryfikacja', 'rezerwacja'],
      message: 'Nieprawidłowy status'
    },
    default: 'aktywne'
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);
