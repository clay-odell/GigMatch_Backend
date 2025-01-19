"use strict";
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");
const fs = require("fs");
const path = require("path");

const db = new Client({
  connectionString: getDatabaseUri(),
  ssl: {
    rejectUnauthorized: false,
   
  }
});

db.on('error', err => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

db.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => {
    console.error('Connection error:', err.stack);
    process.exit(1);
  });

module.exports = db;
