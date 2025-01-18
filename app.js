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
app.use(cors({
  origin: 'https://gigmatch-frontend-calendar-app.onrender.com'
}));
app.use(morgan("tiny"));

// Routes
app.use('/user', userRoutes);
app.use('/event', eventRoutes);
app.use('/admin', adminRoutes);

// Handle 404 errors -- This matches everything
app.use((req, res, next) => {
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
