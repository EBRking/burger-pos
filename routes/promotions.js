const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');
const { isAuthenticated, isOwner } = require('../middleware/auth');

// List promotions
router.get('/', isAuthenticated, isOwner, async (req, res) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    res.render('promotions/index', { title: 'จัดการโปรโมชั่น', promotions, user: req.session.user, success: req.flash('success'), error: req.flash('error') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/dashboard');
  }
});

// New promotion form
router.get('/new', isAuthenticated, isOwner, (req, res) => {
  res.render('promotions/form', { title: 'เพิ่มโปรโมชั่น', promotion: null, user: req.session.user, error: req.flash('error') });
});

// Create promotion
router.post('/', isAuthenticated, isOwner, async (req, res) => {
  try {
    const { name, code, type, value, minAmount, startDate, endDate } = req.body;
    const promotion = new Promotion({ name, code, type, value: parseFloat(value), minAmount: parseFloat(minAmount) || 0, startDate, endDate });
    await promotion.save();
    req.flash('success', 'เพิ่มโปรโมชั่นสำเร็จ');
    res.redirect('/promotions');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/promotions/new');
  }
});

// Edit form
router.get('/:id/edit', isAuthenticated, isOwner, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) { req.flash('error', 'ไม่พบโปรโมชั่น'); return res.redirect('/promotions'); }
    res.render('promotions/form', { title: 'แก้ไขโปรโมชั่น', promotion, user: req.session.user, error: req.flash('error') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/promotions');
  }
});

// Update promotion
router.post('/:id', isAuthenticated, isOwner, async (req, res) => {
  try {
    const { name, code, type, value, minAmount, startDate, endDate, isActive } = req.body;
    await Promotion.findByIdAndUpdate(req.params.id, { name, code, type, value: parseFloat(value), minAmount: parseFloat(minAmount) || 0, startDate, endDate, isActive: isActive === 'true' });
    req.flash('success', 'อัปเดตโปรโมชั่นสำเร็จ');
    res.redirect('/promotions');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/promotions');
  }
});

// Delete promotion
router.post('/:id/delete', isAuthenticated, isOwner, async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    req.flash('success', 'ลบโปรโมชั่นสำเร็จ');
    res.redirect('/promotions');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/promotions');
  }
});

module.exports = router;
