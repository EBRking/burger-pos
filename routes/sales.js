const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Member = require('../models/Member');
const Promotion = require('../models/Promotion');
const { isAuthenticated, isOwner } = require('../middleware/auth');

// POS Page (new sale)
router.get('/pos', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ category: 1, name: 1 });
    const promotions = await Promotion.find({ isActive: true, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });
    res.render('sales/pos', { title: 'หน้าขาย POS', products, promotions, user: req.session.user, error: req.flash('error') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/dashboard');
  }
});

// Process sale
router.post('/pos', isAuthenticated, async (req, res) => {
  try {
    const { items, memberId, promotionId, discountType, discountValue, paymentMethod, amountPaid, note } = req.body;

    const parsedItems = JSON.parse(items || '[]');
    if (!parsedItems.length) {
      req.flash('error', 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return res.redirect('/sales/pos');
    }

    let saleItems = [];
    let subtotal = 0;

    for (const item of parsedItems) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      saleItems.push({
        product: product._id,
        productName: product.name,
        productCode: product.productCode,
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
      // Reduce stock
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();
    }

    let discountAmount = 0;
    let promotionName = '';
    let promoId = null;

    if (promotionId && promotionId !== '') {
      const promo = await Promotion.findById(promotionId);
      if (promo && subtotal >= promo.minAmount) {
        promoId = promo._id;
        promotionName = promo.name;
        if (promo.type === 'percent') discountAmount = subtotal * promo.value / 100;
        else discountAmount = promo.value;
      }
    } else if (discountType && discountType !== 'none' && discountValue > 0) {
      if (discountType === 'percent') discountAmount = subtotal * parseFloat(discountValue) / 100;
      else discountAmount = parseFloat(discountValue);
    }

    const total = Math.max(0, subtotal - discountAmount);
    const paid = parseFloat(amountPaid) || total;
    const change = Math.max(0, paid - total);

    const sale = new Sale({
      member: memberId || null,
      employee: req.session.user._id,
      items: saleItems,
      subtotal,
      discountType: discountType || 'none',
      discountValue: parseFloat(discountValue) || 0,
      discountAmount,
      promotion: promoId,
      promotionName,
      total,
      paymentMethod: paymentMethod || 'cash',
      amountPaid: paid,
      change,
      note: note || ''
    });
    await sale.save();

    // Update member points and spending
    if (memberId && memberId !== '') {
      const member = await Member.findById(memberId);
      if (member) {
        member.totalSpent += total;
        member.points += Math.floor(total / 10);
        await member.save();
      }
    }

    req.flash('success', 'บันทึกการขายสำเร็จ รหัส: ' + sale.saleCode);
    res.redirect('/sales/receipt/' + sale._id);
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/sales/pos');
  }
});

// Receipt page
router.get('/receipt/:id', isAuthenticated, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('member', 'name memberCode phone')
      .populate('employee', 'name');
    if (!sale) { req.flash('error', 'ไม่พบข้อมูลการขาย'); return res.redirect('/sales'); }
    res.render('sales/receipt', { title: 'ใบเสร็จ', sale, user: req.session.user, success: req.flash('success') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/sales');
  }
});

// Sales history
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const search = req.query.search || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';

    let query = {};
    if (search) query.saleCode = new RegExp(search, 'i');
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59);
        query.createdAt.$lte = end;
      }
    }

    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .populate('member', 'name memberCode')
      .populate('employee', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.render('sales/index', {
      title: 'ประวัติการขาย', sales, user: req.session.user,
      search, dateFrom, dateTo,
      currentPage: page, totalPages: Math.ceil(total / limit), total,
      success: req.flash('success'), error: req.flash('error')
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/dashboard');
  }
});

// Cancel sale
router.post('/:id/cancel', isAuthenticated, isOwner, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) { req.flash('error', 'ไม่พบข้อมูลการขาย'); return res.redirect('/sales'); }
    if (sale.status === 'cancelled') { req.flash('error', 'ยกเลิกไปแล้ว'); return res.redirect('/sales'); }
    sale.status = 'cancelled';
    await sale.save();
    // Restore stock
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
    req.flash('success', 'ยกเลิกการขายสำเร็จ');
    res.redirect('/sales');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/sales');
  }
});

module.exports = router;
