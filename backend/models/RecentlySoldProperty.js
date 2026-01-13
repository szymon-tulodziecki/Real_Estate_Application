const mongoose = require('mongoose');

const recentlySoldPropertySchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  promotionalPrice: {
    type: Number,
    min: 0,
  },
  transactionType: {
    type: String,
    enum: ['sprzedaż', 'wynajem', 'sprzedaż_wynajem'],
    default: 'sprzedaż',
  },
  area: {
    type: Number,
  },
  rooms: {
    type: Number,
  },
  location: {
    address: String,
    city: String,
    district: String,
    voivodeship: String,
    postalCode: String,
  },
  coordinates: {
    x: Number,
    y: Number,
  },
  image: {
    filename: String,
    url: String,
  },
  agent: {
    firstName: String,
    lastName: String,
    avatar: String,
  },
  soldAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

recentlySoldPropertySchema.index({ soldAt: -1 });

module.exports = mongoose.model('RecentlySoldProperty', recentlySoldPropertySchema);
