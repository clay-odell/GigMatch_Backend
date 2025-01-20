const express = require("express");
const router = express.Router();
const User = require("../models/user");
const {
  authenticateJWT,
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../expressError");
const CalendarEventRequest = require("../models/calendarEventRequest"); // Ensure this is imported correctly
const Admin = require("../models/admin");

// Route for user login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Email and password are required.");
    }

    // Authenticate the user
    const { user, token } = await User.authenticate(email, password);

    // Respond with the token and user information
    return res.json({ token, user });
  } catch (err) {
    return next(err);
  }
});

// Route for user registration
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, userType, artistName } = req.body;
    const { user, token } = await User.register({
      name,
      email,
      password,
      artistName,
      userType,
    });

    // Respond with the token and new user information
    return res.status(201).json({ token, user });
  } catch (err) {
    return next(err);
  }
});

// Route to get all users
router.get("/", authenticateJWT, async (req, res, next) => {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

// Route to get user by email
router.get("/:email", authenticateJWT, async (req, res, next) => {
  try {
    const user = await User.getUser(req.params.email);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

// Route to get user by ID
router.get(
  "/:userid",
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const requester = req.user;
      const user = await User.getUserById(req.params.userid, requester);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

// Get event requests by user ID
router.get(
  "/events/:userid",
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const eventRequests = await CalendarEventRequest.getByUserId(
        req.params.userid
      );
      if (!eventRequests || eventRequests.length === 0) {
        return res.json({
          message: "No event requests found for this user.",
          eventRequests: [],
        });
      }
      res.json({ eventRequests });
    } catch (error) {
      next(new NotFoundError(error.message));
    }
  }
);

// Route to update a user
router.put(
  "/:userid",
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const userId = req.params.userid;
      const updateData = req.body;
      const updatedUser = await User.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
