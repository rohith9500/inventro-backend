const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    quantityReduced: { type: Number, required: true },
    buyerName: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 },
    userEmail: { type: String, required: true }, // Which user added this product
    history: [historySchema]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);