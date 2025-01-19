"use strict";

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { NotFoundError, BadRequestError } = require("./expressError");
const path = require("path");

// Initialize Express App
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

// API Routes
app.use("/user", require("./routes/userRoutes"));
app.use("/event", require("./routes/eventRequest"));
app.use("/admin", require("./routes/adminRoutes"));

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend", "dist", "assets"))); // Ensure this matches your build directory path

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html")); // Ensure this matches your build directory path
  });
}

// Handle 404 errors
app.use((req, res, next) => {
  return next(new NotFoundError());
});

// Generic error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;
  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
