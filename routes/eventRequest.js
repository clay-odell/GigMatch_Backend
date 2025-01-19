const express = require("express");
const router = express.Router();
const CalendarEventRequest = require("../models/calendarEventRequest");
const {
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  isAdmin,
} = require("../middleware/auth");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../expressError");

// Create event request
router.post("/", authenticateJWT, async (req, res, next) => {
  try {
    const {
      eventname,
      artistname,
      status,
      requestdate,
      starttime,
      endtime,
      userid,
      amount,
    } = req.body;

    if (!artistname) {
      throw new BadRequestError("Artist name is required");
    }

    const eventRequest = await CalendarEventRequest.create({
      eventname,
      artistname,
      status,
      requestdate,
      starttime,
      endtime,
      userid,
      amount,
    });

    res.status(201).json({ eventRequest });
  } catch (error) {
    next(new BadRequestError(error.message));
  }
});

// Update event request
router.put(
  "/:requestid",
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const updatedRequest = await CalendarEventRequest.updateRequest(
        req.params.requestid,
        req.body,
        req.user
      );
      res.json(updatedRequest);
    } catch (error) {
      next(new BadRequestError(error.message));
    }
  }
);

// Get all event requests (only accessible by admin)
router.get("/", authenticateJWT, isAdmin, async (req, res, next) => {
  try {
    const eventRequests = await CalendarEventRequest.getAll();
    res.json(eventRequests);
  } catch (error) {
    next(new NotFoundError(error.message));
  }
});

// Get event requests by user ID
router.get(
  "/user/:userid",
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
      console.error("Error fetching event requests:", error.message);
      next(new NotFoundError(error.message));
    }
  }
);

// Get events by event status
router.get("/:status", async (req, res, next) => {
  try {
    const { status } = req.params;
    const events = await CalendarEventRequest.findByStatus(status);

    return res.json(events);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
