// mongodb-init/init.js

// Użytkownik aplikacyjny tworzony przez init-user.sh z ENV
db = db.getSiblingDB('realestate');

// Utwórz podstawowe kolekcje z indeksami
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.properties.createIndex({ "status": 1 });
db.properties.createIndex({ "type": 1 });
db.properties.createIndex({ "transactionType": 1 });
db.properties.createIndex({ "location.city": 1 });
db.properties.createIndex({ "price": 1 });
db.properties.createIndex({ "agent": 1 });
db.properties.createIndex({ "createdAt": -1 });
db.properties.createIndex({ "slug": 1 }, { unique: true });

print('Database initialized successfully!');
