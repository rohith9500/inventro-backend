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
    history: [historySchema]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);