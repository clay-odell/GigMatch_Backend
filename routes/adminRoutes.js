const express = require("express");
const Admin = require("../models/admin");
const { createToken } = require("../helpers/tokens");
const {
  authenticateJWT,
  isAdmin,
  ensureCorrectUserOrAdmin,
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

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.authenticate(email, password);  // Use Admin.authenticate instead of User.authenticate

    if (admin.usertype !== 'Admin') {
      throw new UnauthorizedError("User is not an admin");
    }

    const token = createToken(admin);  // Create token with admin details
    return res.json({ token, admin });
  } catch (err) {
    return next(err);
  }
});


// Route to fetch all event requests
router.get("/event-requests", async (req, res, next) => {
  try {
    const requests = await Admin.getAllEventRequests(req.user);
    if (!requests) {
      throw new NotFoundError("No event requests found");
    }
    return res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Update user
router.put("/:userid", async (req, res, next) => { // Matching param name to your schema
  try {
    const userid = req.params.userid;
    const updateData = req.body;
    const updatedUser = await Admin.updateUser(userid, updateData);
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// Route to delete an event request
router.delete(
  "/event-requests/:requestid",
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const result = await Admin.deleteEventRequest(
        req.params.requestid,
        req.user
      );
      if (!result) {
        throw new NotFoundError("Event request not found");
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Route to update an event request
router.put("/event-requests/:requestid", isAdmin, async (req, res, next) => {
  try {
    if (!req.body) {
      throw new BadRequestError("Update data is missing");
    }
    const result = await Admin.updateEventRequest(
      req.params.requestid,
      req.body,
      req.user
    );
    if (!result) {
      throw new NotFoundError("Event request not found");
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Route to fetch all users
router.get("/users",  isAdmin, async (req, res, next) => {
  try {

    const users = await Admin.getAllUsers(req.user);
    if (!users) {
      throw new NotFoundError("No users found");
    }
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Route to delete a user
router.delete(
  "/users/:userid",
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const result = await Admin.deleteUser(req.params.userid, req.user);
      if (!result) {
        throw new NotFoundError("User not found");
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
