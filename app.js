"use strict";

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { NotFoundError, BadRequestError } = require("./expressError");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRequest");
const adminRoutes = require("./routes/adminRoutes");

// Initialize Express App
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

// Routes
app.use('/user', userRoutes);
app.use('/event', eventRoutes);
app.use('/admin', adminRoutes);

// Handle 404 errors
app.use((req, res, next) => {
  if (req.method === "HEAD") {
    return res.status(404).end(); 
  }
  return next(new NotFoundError());
});


// Generic error handler; anything unhandled goes here
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;
  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
