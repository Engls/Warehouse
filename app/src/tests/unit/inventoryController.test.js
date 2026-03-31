const {
  // getProductById,
  createProduct,
  // updateProduct,
  // deleteProduct,
  // updateProduct,
  // deleteProduct,
  // addStock,
  removeStock,
  getAnalytics,
  getCategories,
  getProductTransactions,
} = require('../../controllers/inventoryController');
const db = require('../../models/db');

jest.mock('../../models/db');

describe('Inventory Controller', () => {
  let req; let
    res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  // describe('getAllProducts', () => {
  //   it('should return products with low_stock flag', async () => {
  //     const mockRows = [
  //       {
  //         id: 1, name: 'A', quantity: 5, min_quantity: 10,
  //       },
  //       {
  //         id: 2, name: 'B', quantity: 20, min_quantity: 5,
  //       },
  //     ];
  //     db.query.mockResolvedValue({ rows: mockRows });

  //     await getAllProducts(req, res);

  //     expect(res.json).toHaveBeenCalledWith([
  //       { ...mockRows[0], low_stock: true },
  //       { ...mockRows[1], low_stock: false },
  //     ]);
  //   });

  //   it('should handle database error', async () => {
  //     db.query.mockRejectedValue(new Error('DB error'));

  //     await getAllProducts(req, res);

  //     expect(res.status).toHaveBeenCalledWith(500);
  //     expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  //   });
  // });

  // describe('getProductById', () => {
  //   it('should return product by id', async () => {
  //     req.params.id = '1';
  //     const mockRow = {
  //       id: 1, name: 'A', quantity: 5, min_quantity: 10,
  //     };
  //     db.query.mockResolvedValue({ rows: [mockRow] });

  //     await getProductById(req, res);

  //     expect(db.query).toHaveBeenCalledWith(
  //       expect.stringContaining('WHERE p.id = $1'),
  //       ['1'],
  //     );
  //     expect(res.json).toHaveBeenCalledWith({ ...mockRow, low_stock: true });
  //   });

  //   it('should return 404 if product not found', async () => {
  //     req.params.id = '999';
  //     db.query.mockResolvedValue({ rows: [] });

  //     await getProductById(req, res);

  //     expect(res.status).toHaveBeenCalledWith(404);
  //     expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  //   });
  // });

  describe('createProduct', () => {
    const validProduct = {
      name: 'Test',
      category_id: 1,
      sku: 'TEST-123',
      quantity: 10,
      min_quantity: 5,
      price: 100,
    };

    it('should create product with valid data', async () => {
      req.body = validProduct;
      db.query.mockResolvedValueOnce({ rows: [] });
      const inserted = { id: 1, ...validProduct };
      db.query.mockResolvedValueOnce({ rows: [inserted] });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(inserted);
    });

    it('should return 400 if SKU exists', async () => {
      req.body = validProduct;
      db.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Product with this SKU already exists',
      });
    });

    it('should return 400 on validation error', async () => {
      req.body = { name: 'A' };
      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
  });

  // describe('update1Product', () => {
  //   it('should update existing product', async () => {
  //     req.params.id = '1';
  //     req.body = {
  //       name: 'Updated',
  //       category_id: 1,
  //       sku: 'TEST-123',
  //       quantity: 10,
  //       min_quantity: 5,
  //       price: 100,
  //     };
  //     db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
  //     db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Updated' }] });

  //     await updateProduct(req, res);

  //     expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Updated' });
  //   });

  //   it('should return 404 if product not found', async () => {
  //     req.params.id = '999';
  //     db.query.mockResolvedValue({ rows: [] });
  //     await deleteProduct(req, res);
  //     expect(db.query).toHaveBeenCalled();
  //     expect(res.status).toHaveBeenCalledWith(404);
  //     expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  //   });
  // });

  // describe('deleteProduct', () => {
  //   it('should delete product', async () => {
  //     req.params.id = '1';
  //     db.query.mockResolvedValue({ rows: [{ id: 1 }] });

  //     await deleteProduct(req, res);

  //     expect(res.json).toHaveBeenCalledWith({
  //       message: 'Product deleted successfully',
  //       id: 1,
  //     });
  //   });

  //   it('should return 404 if product not found', async () => {
  //     req.params.id = '999';
  //     db.query.mockResolvedValue({ rows: [] });

  //     await deleteProduct(req, res);

  //     expect(res.status).toHaveBeenCalledWith(404);
  //     expect(res.json).toHaveBeenCalledWith({ error: 'Product not found' });
  //   });
  // });

  // describe('addStock', () => {
  //   let mockClient;

  //   beforeEach(() => {
  //     mockClient = {
  //       query: jest.fn(),
  //       release: jest.fn(),
  //     };
  //     db.pool.connect.mockResolvedValue(mockClient);
  //     req.body = { product_id: 1, quantity: 5, notes: 'test' };
  //   });

  //   it('should add stock successfully', async () => {
  //     mockClient.query
  //       .mockResolvedValueOnce()
  //       .mockResolvedValueOnce({ rows: [{ quantity: 10, name: 'Prod' }] })
  //       .mockResolvedValueOnce()
  //       .mockResolvedValueOnce({ rows: [{ id: 100 }] })
  //       .mockResolvedValueOnce();

  //     await addStock(req, res);

  //     expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
  //     expect(mockClient.query).toHaveBeenCalledWith(
  //       expect.stringContaining('FOR UPDATE'),
  //       [1],
  //     );
  //     expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  //     expect(res.json).toHaveBeenCalledWith(
  //       expect.objectContaining({ message: 'Stock added successfully' }),
  //     );
  //     expect(mockClient.release).toHaveBeenCalled();
  //   });

  //   it('should rollback if product not found', async () => {
  //     mockClient.query
  //       .mockResolvedValueOnce()
  //       .mockResolvedValueOnce({ rows: [] });

  //     await addStock(req, res);

  //     expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  //     expect(res.status).toHaveBeenCalledWith(404);
  //   });
  // });

  describe('removeStock', () => {
    let mockClient;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      db.pool.connect.mockResolvedValue(mockClient);
      req.body = { product_id: 1, quantity: 5, notes: 'test' };
    });

    it('should remove stock successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce()
        .mockResolvedValueOnce({ rows: [{ quantity: 10, name: 'Prod' }] })
        .mockResolvedValueOnce()
        .mockResolvedValueOnce({ rows: [{ id: 101 }] })
        .mockResolvedValueOnce();

      await removeStock(req, res);

      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE products SET quantity = $1 WHERE id = $2',
        [5, 1],
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Stock removed successfully' }),
      );
    });

    it('should return 400 if insufficient stock', async () => {
      mockClient.query
        .mockResolvedValueOnce()
        .mockResolvedValueOnce({ rows: [{ quantity: 3, name: 'Prod' }] });

      await removeStock(req, res);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Insufficient stock' }),
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ count: 10 }] })
        .mockResolvedValueOnce({ rows: [{ count: 2 }] })
        .mockResolvedValueOnce({ rows: [{ count: 1 }] })
        .mockResolvedValueOnce({ rows: [{ total_value: 1000 }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      await getAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        summary: {
          total_products: 10,
          low_stock_items: 2,
          out_of_stock: 1,
          total_inventory_value: 1000,
        },
        recent_transactions: [],
        top_moving_products: [],
      });
    });
  });

  describe('getCategories', () => {
    it('should return categories', async () => {
      const categories = [{ id: 1, name: 'Cat', product_count: 5 }];
      db.query.mockResolvedValue({ rows: categories });

      await getCategories(req, res);

      expect(res.json).toHaveBeenCalledWith(categories);
    });
  });

  describe('getProductTransactions', () => {
    it('should return transactions for product', async () => {
      req.params.id = '1';
      const transactions = [{ id: 1, product_id: 1, quantity: 5 }];
      db.query.mockResolvedValue({ rows: transactions });

      await getProductTransactions(req, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE product_id = $1'),
        ['1'],
      );
      expect(res.json).toHaveBeenCalledWith(transactions);
    });
  });
});
