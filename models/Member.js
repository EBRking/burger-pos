const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberCode: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, unique: true },
  email: { type: String, trim: true },
  birthDate: { type: Date },
  points: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

memberSchema.pre('save', async function(next) {
  if (!this.memberCode) {
    const count = await mongoose.model('Member').countDocuments();
    this.memberCode = 'MEM' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('Member', memberSchema);
