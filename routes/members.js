const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const { isAuthenticated } = require('../middleware/auth');

// List members
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = search ? { $or: [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }, { memberCode: new RegExp(search, 'i') }] } : {};
    const members = await Member.find(query).sort({ createdAt: -1 });
    res.render('members/index', { title: 'จัดการสมาชิก', members, search, user: req.session.user, success: req.flash('success'), error: req.flash('error') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/dashboard');
  }
});

// New member form
router.get('/new', isAuthenticated, (req, res) => {
  res.render('members/form', { title: 'เพิ่มสมาชิก', member: null, user: req.session.user, error: req.flash('error') });
});

// Create member
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, phone, email, birthDate } = req.body;
    const existing = await Member.findOne({ phone });
    if (existing) {
      req.flash('error', 'เบอร์โทรนี้มีในระบบแล้ว');
      return res.redirect('/members/new');
    }
    const member = new Member({ name, phone, email, birthDate: birthDate || null });
    await member.save();
    req.flash('success', 'เพิ่มสมาชิกสำเร็จ รหัสสมาชิก: ' + member.memberCode);
    res.redirect('/members');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/members/new');
  }
});

// Edit member form
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) { req.flash('error', 'ไม่พบสมาชิก'); return res.redirect('/members'); }
    res.render('members/form', { title: 'แก้ไขสมาชิก', member, user: req.session.user, error: req.flash('error') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/members');
  }
});

// Update member
router.post('/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, phone, email, birthDate, isActive } = req.body;
    await Member.findByIdAndUpdate(req.params.id, { name, phone, email, birthDate: birthDate || null, isActive: isActive === 'true' });
    req.flash('success', 'อัปเดตข้อมูลสมาชิกสำเร็จ');
    res.redirect('/members');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/members');
  }
});

// Delete member
router.post('/:id/delete', isAuthenticated, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    req.flash('success', 'ลบสมาชิกสำเร็จ');
    res.redirect('/members');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/members');
  }
});

// API: search member by phone
router.get('/api/search', isAuthenticated, async (req, res) => {
  try {
    const { phone } = req.query;
    const member = await Member.findOne({ phone, isActive: true });
    if (member) res.json({ success: true, member });
    else res.json({ success: false });
  } catch (err) {
    res.json({ success: false });
  }
});

module.exports = router;
