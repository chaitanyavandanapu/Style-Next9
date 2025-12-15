const mongoose = require('mongoose');

const ColorSchema = new mongoose.Schema({
  name: String,
  hexCode: String,
  imageUrl: String,
  cloudinaryId: String
});

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: String,

    sizes: [String],

    colors: [ColorSchema],

    defaultImageIndex: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
