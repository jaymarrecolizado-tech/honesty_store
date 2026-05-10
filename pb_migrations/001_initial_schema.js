/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
    // Categories table
    db.newQuery(`
        CREATE TABLE categories (
            id TEXT PRIMARY KEY DEFAULT ('r' || lower(hex(randomblob(7)))),
            name TEXT NOT NULL,
            description TEXT,
            created TEXT NOT NULL DEFAULT (datetime('now')),
            updated TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `).execute();

    // Products table
    db.newQuery(`
        CREATE TABLE products (
            id TEXT PRIMARY KEY DEFAULT ('r' || lower(hex(randomblob(7)))),
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER NOT NULL CHECK (price >= 0),
            stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
            category TEXT NOT NULL,
            image TEXT,
            created TEXT NOT NULL DEFAULT (datetime('now')),
            updated TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (category) REFERENCES categories(id) ON DELETE RESTRICT
        );
    `).execute();

    // Orders table
    db.newQuery(`
        CREATE TABLE orders (
            id TEXT PRIMARY KEY DEFAULT ('r' || lower(hex(randomblob(7)))),
            user TEXT NOT NULL,
            total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
            payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'debt')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
            created TEXT NOT NULL DEFAULT (datetime('now')),
            updated TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user) REFERENCES _auth(id) ON DELETE CASCADE
        );
    `).execute();

    // Order items table
    db.newQuery(`
        CREATE TABLE order_items (
            id TEXT PRIMARY KEY DEFAULT ('r' || lower(hex(randomblob(7)))),
            order_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
            total_price INTEGER NOT NULL CHECK (total_price >= 0),
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
        );
    `).execute();

    // Debt ledger table (immutable)
    db.newQuery(`
        CREATE TABLE debt_ledger (
            id TEXT PRIMARY KEY DEFAULT ('r' || lower(hex(randomblob(7)))),
            user TEXT NOT NULL,
            amount INTEGER NOT NULL,
            description TEXT NOT NULL,
            transaction_date TEXT NOT NULL DEFAULT (datetime('now')),
            created TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user) REFERENCES _auth(id) ON DELETE CASCADE
        );
    `).execute();

    // Stock movements table (immutable)
    db.newQuery(`
        CREATE TABLE stock_movements (
            id TEXT PRIMARY KEY DEFAULT ('r' || lower(hex(randomblob(7)))),
            product_id TEXT NOT NULL,
            quantity_change INTEGER NOT NULL,
            reason TEXT NOT NULL CHECK (reason IN ('sale', 'adjustment', 'restock')),
            actor TEXT NOT NULL,
            created TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (actor) REFERENCES _auth(id) ON DELETE CASCADE
        );
    `).execute();

    // Audit logs table
    db.newQuery(`
        CREATE TABLE audit_logs (
            id TEXT PRIMARY KEY DEFAULT ('r' || lower(hex(randomblob(7)))),
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
            old_values TEXT,
            new_values TEXT,
            user TEXT,
            created TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user) REFERENCES _auth(id) ON DELETE SET NULL
        );
    `).execute();

    // Create indexes for performance
    db.newQuery(`CREATE INDEX idx_products_category_name ON products(category, name);`).execute();
    db.newQuery(`CREATE INDEX idx_products_name ON products(name);`).execute();
    db.newQuery(`CREATE INDEX idx_orders_user_created ON orders(user, created);`).execute();
    db.newQuery(`CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);`).execute();
    db.newQuery(`CREATE INDEX idx_debt_ledger_user_date ON debt_ledger(user, transaction_date);`).execute();
    db.newQuery(`CREATE INDEX idx_stock_movements_product_created ON stock_movements(product_id, created);`).execute();
    db.newQuery(`CREATE INDEX idx_stock_movements_actor_created ON stock_movements(actor, created);`).execute();
    db.newQuery(`CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);`).execute();
    db.newQuery(`CREATE INDEX idx_audit_logs_created ON audit_logs(created);`).execute();
    db.newQuery(`CREATE INDEX idx_audit_logs_user_created ON audit_logs(user, created);`).execute();
    db.newQuery(`CREATE INDEX idx_categories_name ON categories(name);`).execute();

}, (db) => {
    // Rollback function - drop tables in reverse order
    db.newQuery(`DROP TABLE IF EXISTS audit_logs;`).execute();
    db.newQuery(`DROP TABLE IF EXISTS stock_movements;`).execute();
    db.newQuery(`DROP TABLE IF EXISTS debt_ledger;`).execute();
    db.newQuery(`DROP TABLE IF EXISTS order_items;`).execute();
    db.newQuery(`DROP TABLE IF EXISTS orders;`).execute();
    db.newQuery(`DROP TABLE IF EXISTS products;`).execute();
    db.newQuery(`DROP TABLE IF EXISTS categories;`).execute();
});