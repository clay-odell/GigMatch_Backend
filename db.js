"use strict";
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");



const db = new Client({
  connectionString: getDatabaseUri(),

});


db.connect()
  .then(() => console.log("Connected to the database"))
  .catch((err) => {
    console.error("Connection error:", err.stack);
    process.exit(1);
  });

module.exports = db;
