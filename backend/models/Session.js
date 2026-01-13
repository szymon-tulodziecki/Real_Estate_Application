const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index dla szybkiego wyszukiwania aktywnych sesji
sessionSchema.index({ userId: 1, isActive: 1 });
// sessionToken index już jest w schemacie jako unique
// sessionSchema.index({ sessionToken: 1 }); - USUNIĘTE bo duplikat

// Automatyczne usuwanie nieaktywnych sesji po 24 godzinach
sessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Session', sessionSchema);
