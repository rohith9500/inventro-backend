const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get products filtered by userEmail
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

// Add or Update Product based on Name + Category for dynamic pricing
router.post('/', async (req, res) => {
    try {
        const { name, category, price, quantity, userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ message: "User email is required to add product" });
        }

        const cleanEmail = userEmail.trim().toLowerCase();
        const cleanName = name.trim();
        const cleanCategory = category ? category.trim() : '';

        // Check if the exact product name and category already exists for this user
        let existingProduct = await Product.findOne({
            userEmail: cleanEmail,
            name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
            category: cleanCategory
        });

        if (existingProduct) {
            // Update price to the latest one and update/add stock quantity as needed
            existingProduct.price = Number(price);
            existingProduct.quantity = Number(quantity); // Or existingProduct.quantity + Number(quantity) if you want to add stock
            await existingProduct.save();
            return res.status(200).json(existingProduct);
        }

        // If not exists, create a new product entry
        const newProduct = new Product({
            name: cleanName,
            category: cleanCategory,
            price: Number(price),
            quantity: Number(quantity),
            userEmail: cleanEmail
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Product explicitly via Edit button
router.put('/:id', async (req, res) => {
    try {
        const { name, category, price, quantity } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            { 
                name: name.trim(), 
                category: category ? category.trim() : '', 
                price: Number(price), 
                quantity: Number(quantity) 
            }, 
            { new: true }
        );
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
            buyerName: `Sold to ${buyerName}`
        });

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Stock & History
router.post('/:id/add-stock', async (req, res) => {
    try {
        const { addQty, supplierName } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        product.quantity += Number(addQty);
        product.history.push({
            quantityReduced: -Number(addQty),
            buyerName: `Added from ${supplierName}`
        });

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete specific history log and revert stock
router.delete('/:productId/history/:historyId', async (req, res) => {
    try {
        const { productId, historyId } = req.params;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const historyItem = product.history.id(historyId);
        if (!historyItem) {
            return res.status(404).json({ message: "History log not found" });
        }

        product.quantity += Number(historyItem.quantityReduced);
        product.history.pull(historyId);

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;