#!/usr/bin/env bash
set -euo pipefail

mongosh <<'EOF'
db = db.getSiblingDB('realestate');

db.createUser({
  user: "${MONGO_APP_USER}",
  pwd: "${MONGO_APP_PASSWORD}",
  roles: [
    { role: "readWrite", db: "realestate" },
    { role: "dbAdmin", db: "realestate" }
  ]
});

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
EOF
