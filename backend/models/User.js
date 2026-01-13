const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Numer pracownika jest wymagany'],
    unique: true,
    trim: true,
    minlength: [4, 'Numer pracownika musi mieć minimum 4 cyfry'],
    maxlength: [10, 'Numer pracownika może mieć maksimum 10 cyfr'],
    match: [/^[0-9]+$/, 'Numer pracownika może zawierać tylko cyfry']
  },
  email: {
    type: String,
    required: [true, 'Email jest wymagany'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Podaj prawidłowy email']
  },
  password: {
    type: String,
    required: [true, 'Hasło jest wymagane'],
    minlength: [10, 'Hasło musi mieć minimum 10 znaków'],
    validate: {
      validator: function(v) {
        return /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/.test(v);
      },
      message: 'Hasło musi mieć min. 10 znaków, wielką literę, cyfrę i znak specjalny'
    }
  },
  firstName: {
    type: String,
    required: [true, 'Imię jest wymagane'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Nazwisko jest wymagane'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String, // pełny URL do pliku z serwera plików
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  specializations: [{ type: String, trim: true }],
  experienceYears: { type: Number, min: 0 },
  socialMedia: {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true }
  },
  role: {
    type: String,
    enum: ['root', 'admin', 'agent'],
    default: 'agent'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null oznacza że to super admin (root)
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  forceLogoutAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indeks ułatwiający listowanie publicznych agentów
userSchema.index({ role: 1, isActive: 1, isPublic: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
