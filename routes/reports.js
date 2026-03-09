const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Member = require('../models/Member');
const { isAuthenticated, isOwner } = require('../middleware/auth');

// Reports main page
router.get('/', isAuthenticated, isOwner, (req, res) => {
  res.render('reports/index', { title: 'รายงาน', user: req.session.user });
});

// Sales summary report
router.get('/sales', isAuthenticated, isOwner, async (req, res) => {
  try {
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : defaultFrom;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : today;
    dateTo.setHours(23, 59, 59);

    const sales = await Sale.find({
      createdAt: { $gte: dateFrom, $lte: dateTo },
      status: 'completed'
    }).populate('employee', 'name').populate('member', 'name memberCode');

    const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0);
    const totalOrders = sales.length;
    const totalDiscount = sales.reduce((s, sale) => s + sale.discountAmount, 0);
    const avgOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

    // Daily breakdown
    const dailyMap = {};
    for (const sale of sales) {
      const day = sale.createdAt.toISOString().split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0 };
      dailyMap[day].revenue += sale.total;
      dailyMap[day].orders += 1;
    }
    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Payment method breakdown
    const paymentMap = { cash: 0, transfer: 0, card: 0 };
    for (const sale of sales) paymentMap[sale.paymentMethod] = (paymentMap[sale.paymentMethod] || 0) + sale.total;

    res.render('reports/sales', {
      title: 'รายงานการขาย', user: req.session.user,
      sales, totalRevenue, totalOrders, totalDiscount, avgOrder,
      daily, paymentMap,
      dateFrom: req.query.dateFrom || dateFrom.toISOString().split('T')[0],
      dateTo: req.query.dateTo || today.toISOString().split('T')[0]
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/reports');
  }
});

// Best-selling products report
router.get('/products', isAuthenticated, isOwner, async (req, res) => {
  try {
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : defaultFrom;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : today;
    dateTo.setHours(23, 59, 59);

    const sales = await Sale.find({ createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed' });

    const productMap = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.productCode || item.productName;
        if (!productMap[key]) productMap[key] = { name: item.productName, code: item.productCode, qty: 0, revenue: 0 };
        productMap[key].qty += item.quantity;
        productMap[key].revenue += item.subtotal;
      }
    }
    const productStats = Object.values(productMap).sort((a, b) => b.qty - a.qty);

    // Category breakdown
    const allProducts = await Product.find({ isActive: true });
    const categoryMap = {};
    for (const p of allProducts) {
      if (!categoryMap[p.category]) categoryMap[p.category] = { count: 0, stock: 0 };
      categoryMap[p.category].count += 1;
      categoryMap[p.category].stock += p.stock;
    }

    res.render('reports/products', {
      title: 'รายงานสินค้า', user: req.session.user,
      productStats, categoryMap,
      dateFrom: req.query.dateFrom || dateFrom.toISOString().split('T')[0],
      dateTo: req.query.dateTo || today.toISOString().split('T')[0]
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/reports');
  }
});

// Members report
router.get('/members', isAuthenticated, isOwner, async (req, res) => {
  try {
    const members = await Member.find({ isActive: true }).sort({ totalSpent: -1 });
    const totalMembers = members.length;
    const totalPoints = members.reduce((s, m) => s + m.points, 0);
    const topMembers = members.slice(0, 10);

    res.render('reports/members', {
      title: 'รายงานสมาชิก', user: req.session.user,
      members, totalMembers, totalPoints, topMembers
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/reports');
  }
});

// Employee performance report
router.get('/employees', isAuthenticated, isOwner, async (req, res) => {
  try {
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : defaultFrom;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : today;
    dateTo.setHours(23, 59, 59);

    const sales = await Sale.find({ createdAt: { $gte: dateFrom, $lte: dateTo }, status: 'completed' }).populate('employee', 'name username role');

    const empMap = {};
    for (const sale of sales) {
      if (!sale.employee) continue;
      const id = sale.employee._id.toString();
      if (!empMap[id]) empMap[id] = { name: sale.employee.name, role: sale.employee.role, orders: 0, revenue: 0 };
      empMap[id].orders += 1;
      empMap[id].revenue += sale.total;
    }
    const empStats = Object.values(empMap).sort((a, b) => b.revenue - a.revenue);

    res.render('reports/employees', {
      title: 'รายงานพนักงาน', user: req.session.user,
      empStats,
      dateFrom: req.query.dateFrom || dateFrom.toISOString().split('T')[0],
      dateTo: req.query.dateTo || today.toISOString().split('T')[0]
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/reports');
  }
});

module.exports = router;
