const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Member = require('../models/Member');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await Sale.find({ createdAt: { $gte: today, $lt: tomorrow }, status: 'completed' });
    const todayRevenue = todaySales.reduce((s, sale) => s + sale.total, 0);
    const todayOrders = todaySales.length;

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthSales = await Sale.find({ createdAt: { $gte: monthStart }, status: 'completed' });
    const monthRevenue = monthSales.reduce((s, sale) => s + sale.total, 0);

    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.find({ isActive: true, stock: { $lte: 5 } }).limit(5);
    const totalMembers = await Member.countDocuments({ isActive: true });
    const totalEmployees = await User.countDocuments({ isActive: true });

    // Recent sales
    const recentSales = await Sale.find({ status: 'completed' })
      .populate('employee', 'name')
      .populate('member', 'name')
      .sort({ createdAt: -1 })
      .limit(8);

    // Weekly sales for chart (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59);
      const daySales = await Sale.find({ createdAt: { $gte: d, $lte: dEnd }, status: 'completed' });
      const dayRevenue = daySales.reduce((s, sale) => s + sale.total, 0);
      weeklyData.push({ date: d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }), revenue: dayRevenue, orders: daySales.length });
    }

    res.render('dashboard', {
      title: 'แดชบอร์ด', user: req.session.user,
      todayRevenue, todayOrders, monthRevenue,
      totalProducts, totalMembers, totalEmployees,
      lowStockProducts, recentSales,
      weeklyData: JSON.stringify(weeklyData),
      success: req.flash('success'), error: req.flash('error')
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { title: 'แดชบอร์ด', user: req.session.user, todayRevenue: 0, todayOrders: 0, monthRevenue: 0, totalProducts: 0, totalMembers: 0, totalEmployees: 0, lowStockProducts: [], recentSales: [], weeklyData: '[]', success: [], error: [] });
  }
});

module.exports = router;
