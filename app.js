const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/burger_pos';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'burger-pos-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));
app.use(flash());

// Routes
app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/employees', require('./routes/employees'));
app.use('/members', require('./routes/members'));
app.use('/products', require('./routes/products'));
app.use('/sales', require('./routes/sales'));
app.use('/promotions', require('./routes/promotions'));
app.use('/reports', require('./routes/reports'));

// Root redirect
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/auth/login');
});

// 404
app.use((req, res) => {
  res.status(404).send('<div style="text-align:center;padding:50px;font-family:sans-serif;"><h1>404</h1><p>ไม่พบหน้าที่ต้องการ</p><a href="/">กลับหน้าหลัก</a></div>');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🍔 Burger POS running at http://localhost:${PORT}`);
});

module.exports = app;
