const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuthenticated, isOwner } = require('../middleware/auth');
const { uploadProduct } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// List products
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const search = req.query.search || '';
    const category = req.query.category || '';
    let query = {};
    if (search) query.name = new RegExp(search, 'i');
    if (category) query.category = category;
    const products = await Product.find(query).sort({ category: 1, name: 1 });

    // Analysis data
    const allProducts = await Product.find({ isActive: true });
    const totalProducts = allProducts.length;
    const totalStock = allProducts.reduce((s, p) => s + p.stock, 0);
    const avgPrice = totalProducts > 0 ? (allProducts.reduce((s, p) => s + p.price, 0) / totalProducts).toFixed(2) : 0;
    const lowStock = allProducts.filter(p => p.stock <= 5).length;

    res.render('products/index', {
      title: 'จัดการสินค้า', products, search, category, user: req.session.user,
      success: req.flash('success'), error: req.flash('error'),
      stats: { totalProducts, totalStock, avgPrice, lowStock }
    });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/dashboard');
  }
});

// New product form
router.get('/new', isAuthenticated, isOwner, (req, res) => {
  res.render('products/form', { title: 'เพิ่มสินค้า', product: null, user: req.session.user, error: req.flash('error') });
});

// Create product
router.post('/', isAuthenticated, isOwner, uploadProduct.single('image'), async (req, res) => {
  try {
    const { name, category, description, price, cost, stock, unit } = req.body;
    const product = new Product({
      name, category, description,
      price: parseFloat(price) || 0,
      cost: parseFloat(cost) || 0,
      stock: parseInt(stock) || 0,
      unit,
      image: req.file ? '/uploads/products/' + req.file.filename : ''
    });
    await product.save();
    req.flash('success', 'เพิ่มสินค้าสำเร็จ');
    res.redirect('/products');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด: ' + err.message);
    res.redirect('/products/new');
  }
});

// Edit product form
router.get('/:id/edit', isAuthenticated, isOwner, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { req.flash('error', 'ไม่พบสินค้า'); return res.redirect('/products'); }
    res.render('products/form', { title: 'แก้ไขสินค้า', product, user: req.session.user, error: req.flash('error') });
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/products');
  }
});

// Update product
router.post('/:id', isAuthenticated, isOwner, uploadProduct.single('image'), async (req, res) => {
  try {
    const { name, category, description, price, cost, stock, unit, isActive } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) { req.flash('error', 'ไม่พบสินค้า'); return res.redirect('/products'); }

    product.name = name;
    product.category = category;
    product.description = description;
    product.price = parseFloat(price) || 0;
    product.cost = parseFloat(cost) || 0;
    product.stock = parseInt(stock) || 0;
    product.unit = unit;
    product.isActive = isActive === 'true';

    if (req.file) {
      if (product.image) {
        const oldPath = path.join(__dirname, '../public', product.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      product.image = '/uploads/products/' + req.file.filename;
    }
    await product.save();
    req.flash('success', 'อัปเดตสินค้าสำเร็จ');
    res.redirect('/products');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/products');
  }
});

// Delete product
router.post('/:id/delete', isAuthenticated, isOwner, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && product.image) {
      const imgPath = path.join(__dirname, '../public', product.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', 'ลบสินค้าสำเร็จ');
    res.redirect('/products');
  } catch (err) {
    req.flash('error', 'เกิดข้อผิดพลาด');
    res.redirect('/products');
  }
});

// API: get all active products for POS
router.get('/api/list', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).select('name productCode price image category stock');
    res.json(products);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;
