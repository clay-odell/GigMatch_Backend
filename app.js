const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { NotFoundError } = require("./expressError");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRequest");
const adminRoutes = require("./routes/adminRoutes");
const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

//Define root
app.get("/", (req, res) => {
  res.send("Welcome to GigMatch Server");
});

app.use("/user", userRoutes);
app.use("/event", eventRoutes);
app.use("/admin", adminRoutes);

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
