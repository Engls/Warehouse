const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventoryController');

// Products
router.get('/products', controller.getAllProducts);
router.get('/products/:id', controller.getProductById);
router.post('/products', controller.createProduct);
router.put('/products/:id', controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);

// Stock management
router.post('/products/:id/stock/in', controller.addStock);
router.post('/products/:id/stock/out', controller.removeStock);

// Transactions
router.get('/products/:id/transactions', controller.getProductTransactions);

// Categories
router.get('/categories', controller.getCategories);

// Analytics
router.get('/analytics', controller.getAnalytics);

module.exports = router;