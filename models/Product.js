const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['burger', 'drink', 'side', 'dessert', 'combo'],
    required: true
  },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, default: 0, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'ชิ้น' },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.pre('save', async function(next) {
  if (!this.productCode) {
    const count = await mongoose.model('Product').countDocuments();
    this.productCode = 'PRD' + String(count + 1).padStart(4, '0');
  }
  next();
});

productSchema.virtual('profit').get(function() {
  return this.price - this.cost;
});

productSchema.virtual('profitMargin').get(function() {
  if (this.price === 0) return 0;
  return ((this.price - this.cost) / this.price * 100).toFixed(2);
});

module.exports = mongoose.model('Product', productSchema);
