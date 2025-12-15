const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/Product');

// =======================
// Multer config
// =======================
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024, // 5MB
    files: 10
  }
});

// =======================
// POST /api/products
// =======================
router.post('/', upload.array('productImages'), async (req, res) => {
  const uploadedPublicIds = [];

  try {
    const {
      name,
      category,
      price,
      description,
      sizes,
      colors,
      defaultImageIndex
    } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const parsedSizes = JSON.parse(sizes);
    const parsedColors = JSON.parse(colors);

    if (parsedColors.length !== req.files.length) {
      return res.status(400).json({
        message: 'Colors count and images count must match'
      });
    }

    // ---------- Upload images ----------
    const uploadPromises = req.files.map(file =>
      cloudinary.uploader.upload(file.path, {
        folder: 'products',
        resource_type: 'image',
        timeout: 120000,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' }
        ]
      }).then(result => {
        fs.unlinkSync(file.path);
        return {
          imageUrl: result.secure_url,
          cloudinaryId: result.public_id
        };
      })
    );

    const uploadedImages = await Promise.all(uploadPromises);


    // ---------- Merge color + image ----------
    const finalColors = parsedColors.map((color, index) => ({
      name: color.name,
      hexCode: color.hexCode,
      imageUrl: uploadedImages[index].imageUrl,
      cloudinaryId: uploadedImages[index].cloudinaryId
    }));

    // ---------- Save product ----------
    const product = await Product.create({
      name,
      category,
      price,
      description,
      sizes: parsedSizes,
      colors: finalColors,
      defaultImageIndex: Number(defaultImageIndex)
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    // 🔥 Cleanup orphan Cloudinary images
    for (const id of uploadedPublicIds) {
      await cloudinary.uploader.destroy(id);
    }

    console.error('CREATE PRODUCT ERROR:', error);
    res.status(500).json({
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// =======================
// GET /api/products
// =======================
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json(products);
  } catch (error) {
    console.error('FETCH PRODUCTS ERROR:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// =======================
// DELETE /api/products/:id
// =======================
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete Cloudinary images
    for (const color of product.colors) {
      if (color.cloudinaryId) {
        await cloudinary.uploader.destroy(color.cloudinaryId);
      }
    }

    await product.deleteOne();

    res.status(200).json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('DELETE PRODUCT ERROR:', error);
    res.status(500).json({
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

module.exports = router;
