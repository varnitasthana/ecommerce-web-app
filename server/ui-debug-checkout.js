require('dotenv').config();
const request = require('supertest');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const { app } = require('./server');
const jwt = require('jsonwebtoken');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { retryWrites: false });
  const email = 'ui-debug-8@example.com';
  const password = 'TestPassword#123';
  await User.deleteOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name: 'UI Debug Customer', email, password: passwordHash, role: 'customer', emailVerified: true });
  
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  const token = loginRes.body.token;
  
  console.log('TOKEN', token);
  console.log('TOKEN LENGTH', token.length);
  
  // Verify token manually
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('TOKEN PAYLOAD', JSON.stringify(payload, null, 2));
  } catch (err) {
    console.log('TOKEN VERIFY ERROR', err.message);
  }
  
  const product = await Product.findOne({ active: true, deleted: false, stock: { $gt: 0 } });
  
  // Try with explicit Bearer prefix
  const res1 = await request(app).post('/api/payments/create-order').set('Authorization', 'Bearer ' + token).set('Idempotency-Key', 'ui-debug-008a').send({ items: [{ product: product._id, quantity: 1 }], shippingAddress: { name: 'UI Debug', street: '123 Street', city: 'City', postalCode: '400001', country: 'India' } });
  console.log('WITH Bearer STATUS', res1.status);
  console.log('WITH Bearer BODY', JSON.stringify(res1.body, null, 2));
  
  // Try without Bearer prefix
  const res2 = await request(app).post('/api/payments/create-order').set('Authorization', token).set('Idempotency-Key', 'ui-debug-008b').send({ items: [{ product: product._id, quantity: 1 }], shippingAddress: { name: 'UI Debug', street: '123 Street', city: 'City', postalCode: '400001', country: 'India' } });
  console.log('WITHOUT Bearer STATUS', res2.status);
  console.log('WITHOUT Bearer BODY', JSON.stringify(res2.body, null, 2));
  
  await mongoose.disconnect();
})().catch((err) => { console.error(err); process.exit(1); });
