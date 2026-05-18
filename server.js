const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/products', require('./routes/products'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/auth', require('./routes/auth'));

// FIXED PORT HANDLING (VERY IMPORTANT)
const PORT = process.env.PORT || 8080;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });