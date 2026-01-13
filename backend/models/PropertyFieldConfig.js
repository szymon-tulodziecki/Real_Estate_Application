const mongoose = require('mongoose');

const propertyFieldConfigSchema = new mongoose.Schema({
  type: { type: mongoose.Schema.Types.ObjectId, ref: 'PropertyType', required: true, index: true },
  fieldKey: { type: String, required: true }, // e.g. 'title', 'location.address'
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  inputType: { type: String, default: 'text' },
  options: [{ type: String }],
  order: { type: Number, default: 0 }
}, { timestamps: true });

propertyFieldConfigSchema.index({ type: 1, fieldKey: 1 }, { unique: true });

module.exports = mongoose.model('PropertyFieldConfig', propertyFieldConfigSchema);
