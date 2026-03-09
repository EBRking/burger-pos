const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'amount'], required: true },
  value: { type: Number, required: true, min: 0 },
  minAmount: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
