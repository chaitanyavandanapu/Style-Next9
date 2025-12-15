// =======================
// 1. IMPORTS
// =======================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const productRoutes = require('./routes/productRoute');

// =======================
// 2. APP INIT
// =======================
const app = express();
const PORT = process.env.PORT || 3001;

// =======================
// 3. MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// 4. CLOUDINARY CONFIG
// =======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// =======================
// 5. MONGODB CONNECTION
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });

// =======================
// 6. ROUTES
// =======================
app.use('/api/products', productRoutes);

// =======================
// 7. HEALTH CHECK (OPTIONAL)
// =======================
app.get('/', (req, res) => {
  res.send('API is running');
});

// =======================
// 8. START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
