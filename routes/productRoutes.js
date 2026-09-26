const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get products strictly filtered by userEmail query parameter
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: "Email query parameter is required" });
        }
        const products = await Product.find({ userEmail: email.trim().toLowerCase() });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Product linked to userEmail
router.post('/', async (req, res) => {
    try {
        const { name, price, quantity, userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ message: "User email is required to add product" });
        }
        const newProduct = new Product({
            name,
            price,
            quantity,
            userEmail: userEmail.trim().toLowerCase()
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Product
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Product
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reduce Stock & History
router.post('/:id/reduce', async (req, res) => {
    try {
        const { reduceQty, buyerName } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.quantity < reduceQty) {
            return res.status(400).json({ message: "Insufficient stock quantity!" });
        }

        product.quantity -= Number(reduceQty);
        product.history.push({
            quantityReduced: Number(reduceQty),
            buyerName
        });

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;