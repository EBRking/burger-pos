const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET Login page
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'เข้าสู่ระบบ', error: req.flash('error'), success: req.flash('success') });
});

// POST Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      req.flash('error', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return res.redirect('/auth/login');
    }
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      req.flash('error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      return res.redirect('/auth/login');
    }
    const match = await user.comparePassword(password);
    if (!match) {
      req.flash('error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      return res.redirect('/auth/login');
    }
    req.session.user = {
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage
    };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    res.redirect('/auth/login');
  }
});

// GET Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;
