const db = require('../models/db');
const Joi = require('joi');

const productSchema = Joi.object({
    name: Joi.string().required().min(2).max(200),
    category_id: Joi.number().integer().required(),
    sku: Joi.string().required().pattern(/^[A-Z0-9-]+$/),
    description: Joi.string().max(1000),
    quantity: Joi.number().integer().min(0).default(0),
    min_quantity: Joi.number().integer().min(0).default(5),
    price: Joi.number().precision(2).positive()
});

const transactionSchema = Joi.object({
    product_id: Joi.number().integer().required(),
    transaction_type: Joi.string().valid('IN', 'OUT').required(),
    quantity: Joi.number().integer().min(1).required(),
    notes: Joi.string().max(500)
});

const getAllProducts = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id
        `);
        
        const productsWithWarning = result.rows.map(product => ({
            ...product,
            low_stock: product.quantity <= product.min_quantity
        }));
        
        res.json(productsWithWarning);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const product = {
            ...result.rows[0],
            low_stock: result.rows[0].quantity <= result.rows[0].min_quantity
        };
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { error, value } = productSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        
        const { name, category_id, sku, description, quantity, min_quantity, price } = value;
        
        const existingProduct = await db.query('SELECT id FROM products WHERE sku = $1', [sku]);
        if (existingProduct.rows.length > 0) {
            return res.status(400).json({ error: 'Product with this SKU already exists' });
        }
        
        const result = await db.query(`
            INSERT INTO products (name, category_id, sku, description, quantity, min_quantity, price)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, category_id, sku, description, quantity, min_quantity, price]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error, value } = productSchema.validate(req.body, { presence: 'optional' });
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        
        const existingProduct = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (existingProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        Object.keys(value).forEach(key => {
            updates.push(`${key} = $${paramCount}`);
            values.push(value[key]);
            paramCount++;
        });
        
        values.push(id);
        const query = `
            UPDATE products 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await db.query(query, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const addStock = async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { error, value } = transactionSchema.validate({
            ...req.body,
            transaction_type: 'IN'
        });
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        
        const { product_id, quantity, notes } = value;
        
        const productResult = await client.query(
            'SELECT quantity, name FROM products WHERE id = $1 FOR UPDATE',
            [product_id]
        );
        
        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const currentQuantity = productResult.rows[0].quantity;
        const newQuantity = currentQuantity + quantity;
        
        await client.query(
            'UPDATE products SET quantity = $1 WHERE id = $2',
            [newQuantity, product_id]
        );
        
        const transactionResult = await client.query(`
            INSERT INTO inventory_transactions 
            (product_id, transaction_type, quantity, previous_quantity, new_quantity, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [product_id, 'IN', quantity, currentQuantity, newQuantity, notes]);
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Stock added successfully',
            transaction: transactionResult.rows[0],
            product_name: productResult.rows[0].name
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

const removeStock = async (req, res) => {
    const client = await db.pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { error, value } = transactionSchema.validate({
            ...req.body,
            transaction_type: 'OUT'
        });
        
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        
        const { product_id, quantity, notes } = value;
        
        const productResult = await client.query(
            'SELECT quantity, name FROM products WHERE id = $1 FOR UPDATE',
            [product_id]
        );
        
        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const currentQuantity = productResult.rows[0].quantity;
        
        if (currentQuantity < quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Insufficient stock',
                available: currentQuantity,
                requested: quantity
            });
        }
        
        const newQuantity = currentQuantity - quantity;
        
        await client.query(
            'UPDATE products SET quantity = $1 WHERE id = $2',
            [newQuantity, product_id]
        );
        
        const transactionResult = await client.query(`
            INSERT INTO inventory_transactions 
            (product_id, transaction_type, quantity, previous_quantity, new_quantity, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [product_id, 'OUT', quantity, currentQuantity, newQuantity, notes]);
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Stock removed successfully',
            transaction: transactionResult.rows[0],
            product_name: productResult.rows[0].name
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error removing stock:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

const getAnalytics = async (req, res) => {
    try {
        const totalProducts = await db.query('SELECT COUNT(*) FROM products');
        
        const lowStock = await db.query(`
            SELECT COUNT(*) FROM products 
            WHERE quantity <= min_quantity
        `);
        
        const outOfStock = await db.query(`
            SELECT COUNT(*) FROM products 
            WHERE quantity = 0
        `);
        
        const totalValue = await db.query(`
            SELECT SUM(quantity * price) as total_value 
            FROM products
        `);
        
        const recentTransactions = await db.query(`
            SELECT 
                DATE(created_at) as date,
                transaction_type,
                SUM(quantity) as total_quantity,
                COUNT(*) as transaction_count
            FROM inventory_transactions
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at), transaction_type
            ORDER BY date DESC
        `);
        
        const topMovements = await db.query(`
            SELECT 
                p.name,
                p.sku,
                SUM(CASE WHEN t.transaction_type = 'IN' THEN t.quantity ELSE 0 END) as total_in,
                SUM(CASE WHEN t.transaction_type = 'OUT' THEN t.quantity ELSE 0 END) as total_out
            FROM products p
            LEFT JOIN inventory_transactions t ON p.id = t.product_id
            GROUP BY p.id, p.name, p.sku
            ORDER BY (
                COALESCE(SUM(CASE WHEN t.transaction_type = 'IN' THEN t.quantity ELSE 0 END), 0) + 
                COALESCE(SUM(CASE WHEN t.transaction_type = 'OUT' THEN t.quantity ELSE 0 END), 0)
            ) DESC
            LIMIT 10
        `);
        
        res.json({
            summary: {
                total_products: parseInt(totalProducts.rows[0].count),
                low_stock_items: parseInt(lowStock.rows[0].count),
                out_of_stock: parseInt(outOfStock.rows[0].count),
                total_inventory_value: parseFloat(totalValue.rows[0].total_value || 0)
            },
            recent_transactions: recentTransactions.rows,
            top_moving_products: topMovements.rows
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getCategories = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getProductTransactions = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT * FROM inventory_transactions
            WHERE product_id = $1
            ORDER BY created_at DESC
            LIMIT 100
        `, [id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    addStock,
    removeStock,
    getAnalytics,
    getCategories,
    getProductTransactions
};