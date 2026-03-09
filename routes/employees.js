const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated, isOwner } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// List employees
router.get('/', isAuthenticated, isOwner, async (req, res) => {
  try {
    const employees = await User.find().sort({ createdAt: -1 });
    res.render('employees/index', { title: 'จัดการพนักงาน', employees, user: req.session.user, success: req.flash('success'), error: req.flash('error') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/dashboard');
  }
});

// New employee form
router.get('/new', isAuthenticated, isOwner, (req, res) => {
  res.render('employees/form', { title: 'เพิ่มพนักงาน', employee: null, user: req.session.user, error: req.flash('error') });
});

// Create employee
router.post('/', isAuthenticated, isOwner, uploadProfile.single('profileImage'), async (req, res) => {
  try {
    const { username, password, name, role, phone, email } = req.body;
    const existing = await User.findOne({ username });
    if (existing) {
      req.flash('error', 'ชื่อผู้ใช้นี้มีอยู่แล้ว');
      return res.redirect('/employees/new');
    }
    const employee = new User({
      username, password, name, role, phone, email,
      profileImage: req.file ? '/uploads/profiles/' + req.file.filename : ''
    });
    await employee.save();
    req.flash('success', 'เพิ่มพนักงานสำเร็จ');
    res.redirect('/employees');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/employees/new');
  }
});

// Edit employee form
router.get('/:id/edit', isAuthenticated, isOwner, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) { req.flash('error', 'ไม่พบพนักงาน'); return res.redirect('/employees'); }
    res.render('employees/form', { title: 'แก้ไขพนักงาน', employee, user: req.session.user, error: req.flash('error') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/employees');
  }
});

// Update employee
router.post('/:id', isAuthenticated, isOwner, uploadProfile.single('profileImage'), async (req, res) => {
  try {
    const { name, role, phone, email, isActive, newPassword } = req.body;
    const employee = await User.findById(req.params.id);
    if (!employee) { req.flash('error', 'ไม่พบพนักงาน'); return res.redirect('/employees'); }

    employee.name = name;
    employee.role = role;
    employee.phone = phone;
    employee.email = email;
    employee.isActive = isActive === 'true';

    if (newPassword && newPassword.trim() !== '') {
      employee.password = await bcrypt.hash(newPassword, 10);
    }

    if (req.file) {
      if (employee.profileImage) {
        const oldPath = path.join(__dirname, '../public', employee.profileImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      employee.profileImage = '/uploads/profiles/' + req.file.filename;
    }

    await employee.save({ validateBeforeSave: false });
    req.flash('success', 'อัปเดตข้อมูลพนักงานสำเร็จ');
    res.redirect('/employees');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/employees');
  }
});

// Delete employee
router.post('/:id/delete', isAuthenticated, isOwner, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (employee && employee._id.toString() === req.session.user._id.toString()) {
      req.flash('error', 'ไม่สามารถลบบัญชีตัวเองได้');
      return res.redirect('/employees');
    }
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'ลบพนักงานสำเร็จ');
    res.redirect('/employees');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/employees');
  }
});

module.exports = router;
