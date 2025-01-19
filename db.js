"use strict";
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

console.log(getDatabaseUri);
 
const db = new Client({
  connectionString: getDatabaseUri(),
  ssl: {
    rejectUnauthorized: false
  }
});


db.connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => {
    console.error("Connection error:", err.stack);
    process.exit(1);
  });

module.exports = db;
