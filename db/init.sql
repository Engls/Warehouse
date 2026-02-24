
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER DEFAULT 5,
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('IN', 'OUT')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_transactions_date ON inventory_transactions(created_at);


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


INSERT INTO categories (name, description) VALUES
    ('Ноутбуки', 'Портативные компьютеры'),
    ('Смартфоны', 'Мобильные телефоны'),
    ('Аксессуары', 'Компьютерные аксессуары и периферия'),
    ('Комплектующие', 'Компьютерные комплектующие');

INSERT INTO products (name, category_id, sku, description, quantity, min_quantity, price) VALUES
    ('MacBook Pro 14"', 1, 'MBP14-001', 'Apple M2 Pro, 16GB RAM, 512GB SSD', 15, 5, 1999.99),
    ('iPhone 15 Pro', 2, 'IP15P-001', '256GB, Titanium', 25, 10, 1199.99),
    ('Logitech MX Master 3S', 3, 'LOG-MX3S', 'Беспроводная мышь', 50, 10, 89.99),
    ('Samsung 1TB SSD', 4, 'SSD-1TB-01', 'NVMe M.2 SSD', 30, 8, 149.99),
    ('ASUS ROG Strix', 1, 'ASUS-ROG-01', 'Игровой ноутбук, RTX 4060', 8, 3, 1499.99);