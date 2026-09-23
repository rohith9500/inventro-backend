const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully! ✅'))
  .catch((err) => console.log('MongoDB Connection Failed: ❌', err));

app.get('/', (req, res) => {
    res.send('Inventory API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});