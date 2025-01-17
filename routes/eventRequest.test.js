const request = require("supertest");
const app = require("../app");
const CalendarEventRequest = require("../models/calendarEventRequest");

jest.mock("../models/calendarEventRequest");

describe("CalendarEventRequest Routes", () => {
  let token = "mock-token";

  describe("POST /event", () => {
    test("creates a new event request", async () => {
      CalendarEventRequest.create.mockResolvedValue({
        id: 1,
        eventName: "Test Event",
        artistName: "Test Artist",
        status: "pending",
        requestDate: "2025-01-15",
        startTime: "10:00",
        endTime: "12:00",
        userId: 1,
        amount: 100
      });

      const response = await request(app)
        .post("/event")
        .send({
          eventName: "Test Event",
          artistName: "Test Artist",
          status: "pending",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          userId: 1,
          amount: 100
        })
        .set("Authorization", `Bearer ${token}`)
        .expect(201);

      expect(response.body).toEqual({
        eventRequest: {
          id: 1,
          eventName: "Test Event",
          artistName: "Test Artist",
          status: "pending",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          userId: 1,
          amount: 100
        },
        token: "mock-token"
      });
    });

    test("handles missing artist name", async () => {
      const response = await request(app)
        .post("/event")
        .send({
          eventName: "Test Event",
          status: "pending",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          userId: 1,
          amount: 100
        })
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(response.body.error.message).toBe("Artist name is required");
    });
  });

  describe("PUT /event/:requestId", () => {
    test("updates an event request", async () => {
      CalendarEventRequest.updateRequest.mockResolvedValue({
        id: 1,
        eventName: "Updated Event",
        artistName: "Updated Artist",
        status: "approved",
        requestDate: "2025-01-15",
        startTime: "10:00",
        endTime: "12:00",
        userId: 1,
        amount: 150
      });

      const response = await request(app)
        .put("/event/1")
        .send({
          eventName: "Updated Event",
          artistName: "Updated Artist",
          status: "approved",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          amount: 150
        })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        id: 1,
        eventName: "Updated Event",
        artistName: "Updated Artist",
        status: "approved",
        requestDate: "2025-01-15",
        startTime: "10:00",
        endTime: "12:00",
        userId: 1,
        amount: 150
      });
    });
  });

  describe("GET /event", () => {
    test("fetches all event requests", async () => {
      CalendarEventRequest.getAll.mockResolvedValue([
        {
          id: 1,
          eventName: "Test Event",
          artistName: "Test Artist",
          status: "pending",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          userId: 1,
          amount: 100
        }
      ]);

      const response = await request(app)
        .get("/event")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([
        {
          id: 1,
          eventName: "Test Event",
          artistName: "Test Artist",
          status: "pending",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          userId: 1,
          amount: 100
        }
      ]);
    });

    test("handles no event requests found", async () => {
      CalendarEventRequest.getAll.mockResolvedValue([]);
      const response = await request(app)
        .get("/event")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe("GET /event/user/:userId", () => {
    test("fetches event requests by user ID", async () => {
      CalendarEventRequest.getByUserId.mockResolvedValue([
        {
          id: 1,
          eventName: "Test Event",
          artistName: "Test Artist",
          status: "pending",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          userId: 1,
          amount: 100
        }
      ]);

      const response = await request(app)
        .get("/event/user/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        eventRequests: [
          {
            id: 1,
            eventName: "Test Event",
            artistName: "Test Artist",
            status: "pending",
            requestDate: "2025-01-15",
            startTime: "10:00",
            endTime: "12:00",
            userId: 1,
            amount: 100
          }
        ]
      });
    });

    test("handles no event requests found for user", async () => {
      CalendarEventRequest.getByUserId.mockResolvedValue([]);
      const response = await request(app)
        .get("/event/user/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "No event requests found for this user.",
        eventRequests: []
      });
    });
  });

  describe("GET /event/:status", () => {
    test("fetches events by status", async () => {
      CalendarEventRequest.findByStatus.mockResolvedValue([
        {
          id: 1,
          eventName: "Test Event",
          artistName: "Test Artist",
          status: "pending",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          userId: 1,
          amount: 100
        }
      ]);

      const response = await request(app)
        .get("/event/pending")
        .expect(200);

      expect(response.body).toEqual([
        {
          id: 1,
          eventName: "Test Event",
          artistName: "Test Artist",
          status: "pending",
          requestDate: "2025-01-15",
          startTime: "10:00",
          endTime: "12:00",
          userId: 1,
          amount: 100
        }
      ]);
    });
  });
});
