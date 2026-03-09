const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productCode: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  saleCode: { type: String, unique: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  discountType: { type: String, enum: ['none', 'percent', 'amount'], default: 'none' },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  promotion: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', default: null },
  promotionName: { type: String, default: '' },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'card'], default: 'cash' },
  amountPaid: { type: Number, default: 0 },
  change: { type: Number, default: 0 },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' },
  note: { type: String, default: '' }
}, { timestamps: true });

saleSchema.pre('save', async function(next) {
  if (!this.saleCode) {
    const count = await mongoose.model('Sale').countDocuments();
    this.saleCode = 'SALE' + String(count + 1).padStart(5, '0');
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
