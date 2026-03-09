const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Promotion = require('../models/Promotion');
const User = require('../models/User');

// ============ MEMBERS API ============
router.get('/members/search', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json({ success: false, message: 'Phone required' });
    const member = await Member.findOne({ phone });
    if (member) {
      return res.json({ success: true, member });
    }
    res.json({ success: false, message: 'Member not found' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/members/all', async (req, res) => {
  try {
    const members = await Member.find();
    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ PRODUCTS API ============
router.get('/products/all', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/products/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category, isActive: true });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ PROMOTIONS API ============
router.get('/promotions/all', async (req, res) => {
  try {
    const promotions = await Promotion.find();
    res.json({ success: true, promotions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/promotions/active', async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    res.json({ success: true, promotions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ SALES API ============
router.get('/sales/history', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', dateFrom, dateTo } = req.query;
    const query = {};
    
    if (search) query.saleCode = { $regex: search, $options: 'i' };
    if (dateFrom && dateTo) {
      query.createdAt = {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      };
    }
    
    const sales = await Sale.find(query)
      .populate('employee', 'name')
      .populate('member', 'name memberCode')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Sale.countDocuments(query);
    res.json({ success: true, sales, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/sales/receipt/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('employee', 'name')
      .populate('member', 'name memberCode phone');
    
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sales/create', async (req, res) => {
  try {
    const { items, memberId, promotionId, discountType, discountValue, paymentMethod, amountPaid, note } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in cart' });
    }

    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      subtotal += product.price * item.quantity;
      saleItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity
      });

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    let discountAmount = 0;
    if (promotionId) {
      const promo = await Promotion.findById(promotionId);
      if (promo && subtotal >= promo.minAmount) {
        discountAmount = promo.type === 'percent' ? subtotal * promo.value / 100 : promo.value;
      }
    } else if (discountType === 'percent') {
      discountAmount = subtotal * (parseFloat(discountValue) || 0) / 100;
    } else if (discountType === 'amount') {
      discountAmount = parseFloat(discountValue) || 0;
    }

    const total = Math.max(0, subtotal - discountAmount);
    const change = paymentMethod === 'cash' ? (amountPaid - total) : 0;

    const sale = new Sale({
      saleCode: `SALE${Date.now()}`,
      employee: req.session.user?._id,
      member: memberId || null,
      items: saleItems,
      subtotal,
      discountAmount,
      total,
      promotion: promotionId || null,
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? amountPaid : total,
      change,
      note,
      status: 'completed'
    });

    await sale.save();

    // Add points to member
    if (memberId) {
      const member = await Member.findById(memberId);
      if (member) {
        member.points += Math.floor(total / 10);
        member.totalSpent += total;
        await member.save();
      }
    }

    res.json({ success: true, message: 'Sale created', sale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ DASHBOARD API ============
router.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySales = await Sale.find({
      createdAt: { $gte: today },
      status: 'completed'
    });

    const totalRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const totalOrders = todaySales.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const totalProducts = await Product.countDocuments();
    const totalMembers = await Member.countDocuments();
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } }).countDocuments();

    res.json({
      success: true,
      stats: {
        todayRevenue: totalRevenue,
        todayOrders: totalOrders,
        avgOrder,
        totalProducts,
        totalMembers,
        lowStockProducts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
