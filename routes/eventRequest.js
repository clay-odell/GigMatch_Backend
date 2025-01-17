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
const { token } = require("morgan");

// Create event request
router.post("/", authenticateJWT, async (req, res, next) => {
  try {
    const { eventName, artistName, status, requestDate, startTime, endTime, userId, amount } = req.body;

    if (!artistName) {
      throw new BadRequestError("Artist name is required");
    }

    const eventRequest = await CalendarEventRequest.create({
      eventName,
      artistName,
      status,
      requestDate,
      startTime,
      endTime,
      userId,
      amount
    });
    const token = req.token;

    res.status(201).json({eventRequest, token});
    
  } catch (error) {
    next(new BadRequestError(error.message));
  }
});

// Update event request
router.put("/:requestId", authenticateJWT, ensureCorrectUserOrAdmin, async (req, res, next) => {
  try {
    const updatedRequest = await CalendarEventRequest.updateRequest(
      req.params.requestId,
      req.body,
      req.user
    );
    res.json(updatedRequest);
  } catch (error) {
    next(new BadRequestError(error.message));
  }
});

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
  "/user/:userId",
  authenticateJWT,
  ensureCorrectUserOrAdmin,
  async (req, res, next) => {
    try {
      const eventRequests = await CalendarEventRequest.getByUserId(
        req.params.userId
      );
     
      if (!eventRequests || eventRequests.length === 0) {
        return res.json({
          message: "No event requests found for this user.",
          eventRequests: [],
        });
      }
      res.json({ eventRequests });
    } catch (error) {
      console.error("Error in fetching event requests:", error.message);
      // Log error details
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
})

module.exports = router;
