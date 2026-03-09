const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Member = require('./models/Member');
const Promotion = require('./models/Promotion');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/burger_pos';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Create owner account
  const existingAdmin = await User.findOne({ username: 'admin' });
  if (!existingAdmin) {
    await User.create({ username: 'admin', password: 'admin123', name: 'เจ้าของร้าน', role: 'owner', phone: '081-000-0000', email: 'admin@burgerpos.com' });
    console.log('✅ Created admin user (admin/admin123)');
  }

  // Create employee
  const existingEmp = await User.findOne({ username: 'emp01' });
  if (!existingEmp) {
    await User.create({ username: 'emp01', password: 'emp123', name: 'สมชาย ใจดี', role: 'employee', phone: '082-111-2222' });
    console.log('✅ Created employee (emp01/emp123)');
  }

  // Create products
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const products = [
      { name: 'Classic Burger', category: 'burger', description: 'เบอร์เกอร์คลาสสิก เนื้อวัว 100%', price: 89, cost: 35, stock: 50 },
      { name: 'Double Cheese Burger', category: 'burger', description: 'เบอร์เกอร์คู่ชีส 2 ชั้น', price: 129, cost: 55, stock: 40 },
      { name: 'Spicy Chicken Burger', category: 'burger', description: 'เบอร์เกอร์ไก่สไปซี่', price: 99, cost: 40, stock: 45 },
      { name: 'BBQ Bacon Burger', category: 'burger', description: 'เบอร์เกอร์เบคอน BBQ', price: 149, cost: 65, stock: 30 },
      { name: 'Veggie Burger', category: 'burger', description: 'เบอร์เกอร์ผัก สำหรับคนรักสุขภาพ', price: 79, cost: 30, stock: 25 },
      { name: 'French Fries (S)', category: 'side', description: 'เฟรนช์ฟรายส์ขนาดเล็ก', price: 39, cost: 10, stock: 100 },
      { name: 'French Fries (L)', category: 'side', description: 'เฟรนช์ฟรายส์ขนาดใหญ่', price: 59, cost: 15, stock: 100 },
      { name: 'Onion Rings', category: 'side', description: 'ออนิ่งริงส์กรอบๆ', price: 49, cost: 15, stock: 60 },
      { name: 'Coleslaw', category: 'side', description: 'โคลสลอว์สูตรเด็ด', price: 29, cost: 8, stock: 80 },
      { name: 'Coke (M)', category: 'drink', description: 'โค้กขนาดกลาง', price: 25, cost: 8, stock: 200 },
      { name: 'Coke (L)', category: 'drink', description: 'โค้กขนาดใหญ่', price: 35, cost: 10, stock: 200 },
      { name: 'Orange Juice', category: 'drink', description: 'น้ำส้มสด', price: 45, cost: 15, stock: 80 },
      { name: 'Milkshake Chocolate', category: 'drink', description: 'มิลค์เชคช็อกโกแลต', price: 65, cost: 20, stock: 50 },
      { name: 'Ice Cream Sundae', category: 'dessert', description: 'ไอศกรีมซันเดย์', price: 45, cost: 12, stock: 60 },
      { name: 'Apple Pie', category: 'dessert', description: 'แอปเปิ้ลพาย', price: 35, cost: 10, stock: 40 },
      { name: 'Burger Combo A', category: 'combo', description: 'Classic Burger + Fries S + Coke M', price: 139, cost: 55, stock: 999 },
      { name: 'Burger Combo B', category: 'combo', description: 'Double Cheese + Fries L + Coke L', price: 199, cost: 85, stock: 999 },
    ];
    await Product.insertMany(products);
    console.log('✅ Created', products.length, 'products');
  }

  // Create members
  const memberCount = await Member.countDocuments();
  if (memberCount === 0) {
    const members = [
      { name: 'สมหญิง รักเบอร์เกอร์', phone: '081-234-5678', email: 'somying@email.com' },
      { name: 'วิชัย กินอร่อย', phone: '089-876-5432', email: 'wichai@email.com' },
      { name: 'นิดา ชอบกิน', phone: '085-111-2222' },
    ];
    for (const m of members) {
      await Member.create(m);
    }
    console.log('✅ Created', members.length, 'members');
  }

  // Create promotions
  const promoCount = await Promotion.countDocuments();
  if (promoCount === 0) {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
    await Promotion.create([
      { name: 'ลด 10% ทุกออเดอร์', code: 'SAVE10', type: 'percent', value: 10, minAmount: 100, startDate: now, endDate: end },
      { name: 'ลด 20 บาท', code: 'FLAT20', type: 'amount', value: 20, minAmount: 150, startDate: now, endDate: end },
    ]);
    console.log('✅ Created promotions');
  }

  console.log('\n🍔 Seed completed!');
  console.log('Login: admin / admin123 (เจ้าของร้าน)');
  console.log('Login: emp01 / emp123 (พนักงาน)');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
