migrate((db) => {
  const dao = new Dao(db);

  // Update the existing 'users' collection to add new fields
  const users = dao.findCollectionByNameOrId("users");
  if (users) {
    users.schema.addField(new SchemaField({
      name: "role",
      type: "select",
      required: false,
      options: {
        maxSelect: 1,
        values: ["customer", "admin", "cashier"]
      }
    }));
    users.schema.addField(new SchemaField({
      name: "debt_ceiling",
      type: "number",
      required: false,
      options: {
        min: 0
      }
    }));
    dao.saveCollection(users);
  }

  // Categories collection
  const categories = new Collection({
    name: "categories",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text", required: false }
    ]
  });
  dao.saveCollection(categories);

  // Products collection
  const products = new Collection({
    name: "products",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    schema: [
      { name: "name", type: "text", required: true },
      { name: "description", type: "text", required: false },
      { name: "price", type: "number", required: true, options: { min: 0 } },
      { name: "stock_qty", type: "number", required: true, options: { min: 0 } },
      { name: "category", type: "relation", required: true, options: { collectionId: categories.id, cascadeDelete: false, maxSelect: 1 } },
      { name: "image", type: "file", required: false, options: { maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"] } }
    ]
  });
  dao.saveCollection(products);

  // Orders collection
  const orders = new Collection({
    name: "orders",
    type: "base",
    listRule: "@request.auth.id != '' && (@request.auth.id = user || @request.auth.role = 'admin')",
    viewRule: "@request.auth.id != '' && (@request.auth.id = user || @request.auth.role = 'admin')",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      { name: "user", type: "relation", required: true, options: { collectionId: users.id, cascadeDelete: true, maxSelect: 1 } },
      { name: "total_amount", type: "number", required: true, options: { min: 0 } },
      { name: "payment_type", type: "select", required: true, options: { maxSelect: 1, values: ["cash", "debt"] } },
      { name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["pending", "completed", "cancelled"] } }
    ]
  });
  dao.saveCollection(orders);

  // Order items collection
  const orderItems = new Collection({
    name: "order_items",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.role = 'admin'",
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      { name: "order_id", type: "relation", required: true, options: { collectionId: orders.id, cascadeDelete: true, maxSelect: 1 } },
      { name: "product_id", type: "relation", required: true, options: { collectionId: products.id, cascadeDelete: false, maxSelect: 1 } },
      { name: "quantity", type: "number", required: true, options: { min: 1 } },
      { name: "unit_price", type: "number", required: true, options: { min: 0 } },
      { name: "total_price", type: "number", required: true, options: { min: 0 } }
    ]
  });
  dao.saveCollection(orderItems);

  // Debt ledger
  const debtLedger = new Collection({
    name: "debt_ledger",
    type: "base",
    listRule: "@request.auth.id != '' && (@request.auth.id = user || @request.auth.role = 'admin')",
    viewRule: "@request.auth.id != '' && (@request.auth.id = user || @request.auth.role = 'admin')",
    createRule: "@request.auth.id != ''",
    updateRule: null,
    deleteRule: null,
    schema: [
      { name: "user", type: "relation", required: true, options: { collectionId: users.id, cascadeDelete: true, maxSelect: 1 } },
      { name: "amount", type: "number", required: true },
      { name: "description", type: "text", required: true },
      { name: "transaction_date", type: "date", required: true }
    ]
  });
  dao.saveCollection(debtLedger);

  // Stock movements
  const stockMovements = new Collection({
    name: "stock_movements",
    type: "base",
    listRule: "@request.auth.role = 'admin'",
    viewRule: "@request.auth.role = 'admin'",
    createRule: "@request.auth.role = 'admin'",
    schema: [
      { name: "product_id", type: "relation", required: true, options: { collectionId: products.id, cascadeDelete: true, maxSelect: 1 } },
      { name: "quantity_change", type: "number", required: true },
      { name: "reason", type: "select", required: true, options: { maxSelect: 1, values: ["sale", "adjustment", "restock"] } },
      { name: "actor", type: "relation", required: true, options: { collectionId: users.id, cascadeDelete: false, maxSelect: 1 } }
    ]
  });
  dao.saveCollection(stockMovements);

  // Audit logs
  const auditLogs = new Collection({
    name: "audit_logs",
    type: "base",
    listRule: "@request.auth.role = 'admin'",
    viewRule: "@request.auth.role = 'admin'",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    schema: [
      { name: "table_name", type: "text", required: true },
      { name: "record_id", type: "text", required: true },
      { name: "action", type: "select", required: true, options: { maxSelect: 1, values: ["insert", "update", "delete"] } },
      { name: "old_values", type: "json", required: false },
      { name: "new_values", type: "json", required: false },
      { name: "user", type: "relation", required: false, options: { collectionId: users.id, cascadeDelete: false, maxSelect: 1 } }
    ]
  });
  dao.saveCollection(auditLogs);

}, (db) => {
  const dao = new Dao(db);
  const collections = ["audit_logs", "stock_movements", "debt_ledger", "order_items", "orders", "products", "categories"];
  for (const name of collections) {
    try {
      const collection = dao.findCollectionByNameOrId(name);
      if (collection) dao.deleteCollection(collection);
    } catch (_) {}
  }

  try {
    const users = dao.findCollectionByNameOrId("users");
    if (users) {
      users.schema.removeField("role");
      users.schema.removeField("debt_ceiling");
      dao.saveCollection(users);
    }
  } catch (_) {}
});
