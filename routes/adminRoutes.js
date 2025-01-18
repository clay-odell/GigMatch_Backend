const express = require("express");
const Admin = require("../models/admin");
const { createToken } = require("../helpers/tokens");
const {
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  isAdmin,
} = require("../middleware/auth");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = express.Router();

// Admin registration route
router.post("/register", async (req, res, next) => {
  try {
    const newAdmin = await Admin.register(req.body);
    const token = createToken(newAdmin);
    return res.status(201).json({ token, newAdmin });
  } catch (err) {
    return next(err);
  }
});

// Admin login route
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.login(email, password);
    const token = createToken(admin);
    return res.json({ token, admin });
  } catch (err) {
    return next(err);
  }
});

// Route to fetch all event requests
router.get("/event-requests", authenticateJWT, isAdmin, async (req, res, next) => {
  try {
    const requests = await Admin.getAllEventRequests();
    if (!requests) throw new NotFoundError("No event requests found");
    return res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Route to update an event request
router.put("/event-requests/:requestId", authenticateJWT, isAdmin, async (req, res, next) => {
  try {
    if (!req.body) throw new BadRequestError("Update data is missing");
    const result = await Admin.updateEventRequest(req.params.requestId, req.body, req.user);
    if (!result) throw new NotFoundError("Event request not found");
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Route to delete an event request
router.delete("/event-requests/:requestId", authenticateJWT, isAdmin, async (req, res, next) => {
  try {
    const result = await Admin.deleteEventRequest(req.params.requestId);
    if (!result) throw new NotFoundError("Event request not found");
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
