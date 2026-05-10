migrate((db) => {
  const dao = new Dao(db);

  // 1. Create Categories
  const categoriesData = [
    { name: "Snacks", description: "Typical snacks" },
    { name: "Biscuits", description: "Various biscuits" },
    { name: "Noodles", description: "Instant noodles" },
    { name: "Cookies", description: "Sweet cookies" },
    { name: "Chips", description: "Potato and corn chips" },
    { name: "Beverages", description: "Softdrinks and other drinks" },
    { name: "Household Items", description: "Paper cups, utensils, sanitary napkins" }
  ];

  const categoryMap = {};

  const categoriesCollection = dao.findCollectionByNameOrId("categories");
  
  for (const catData of categoriesData) {
    const record = new Record(categoriesCollection);
    record.set("name", catData.name);
    record.set("description", catData.description);
    dao.saveRecord(record);
    categoryMap[catData.name] = record.id;
  }

  // 2. Create Products
  const productsData = [
    { name: "Lays Classic", price: 35, stock_qty: 20, category: "Chips" },
    { name: "Piattos Cheese", price: 20, stock_qty: 30, category: "Chips" },
    { name: "Nova", price: 20, stock_qty: 25, category: "Chips" },
    
    { name: "Fita", price: 15, stock_qty: 40, category: "Biscuits" },
    { name: "Skyflakes", price: 10, stock_qty: 50, category: "Biscuits" },
    
    { name: "Oreo", price: 20, stock_qty: 35, category: "Cookies" },
    { name: "Cream-O", price: 15, stock_qty: 40, category: "Cookies" },
    
    { name: "Lucky Me! Pancit Canton", price: 25, stock_qty: 40, category: "Noodles" },
    { name: "Cup Noodles Seafood", price: 40, stock_qty: 20, category: "Noodles" },
    
    { name: "Coca-Cola 330ml", price: 30, stock_qty: 24, category: "Beverages" },
    { name: "Sprite 1.5L", price: 80, stock_qty: 12, category: "Beverages" },
    { name: "C2 Apple", price: 25, stock_qty: 30, category: "Beverages" },
    
    { name: "Sanitary Napkins (Pack)", price: 45, stock_qty: 15, category: "Household Items" },
    { name: "Plastic Fork (Pack of 12)", price: 15, stock_qty: 20, category: "Household Items" },
    { name: "Plastic Spoon (Pack of 12)", price: 15, stock_qty: 20, category: "Household Items" },
    { name: "Paper Cups (Pack of 20)", price: 30, stock_qty: 15, category: "Household Items" }
  ];

  const productsCollection = dao.findCollectionByNameOrId("products");

  for (const prodData of productsData) {
    const record = new Record(productsCollection);
    record.set("name", prodData.name);
    record.set("price", prodData.price);
    record.set("stock_qty", prodData.stock_qty);
    record.set("category", categoryMap[prodData.category]);
    dao.saveRecord(record);
  }

}, (db) => {
  const dao = new Dao(db);
  
  // Delete all seeded products
  const products = dao.findRecordsByExpr("products");
  for (const prod of products) {
    dao.deleteRecord(prod);
  }

  // Delete all seeded categories
  const categories = dao.findRecordsByExpr("categories");
  for (const cat of categories) {
    dao.deleteRecord(cat);
  }
});
