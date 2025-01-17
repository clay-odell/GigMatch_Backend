const request = require("supertest");
const app = require("../app"); // Adjust the path to your Express app
const User = require("../models/user");
const CalendarEventRequest = require("../models/calendarEventRequest");

jest.mock("../models/user");
jest.mock("../models/calendarEventRequest");

describe("User Routes", () => {
  let token;

  beforeAll(() => {
    // Mock token for authentication
    token = "mock-token";
  });

  describe("POST /login", () => {
    test("logs in a user", async () => {
      User.authenticate.mockResolvedValue({
        user: { id: 1, email: "user@test.com" },
        token
      });

      const response = await request(app)
        .post("/users/login")
        .send({ email: "user@test.com", password: "password" })
        .expect(200);

      expect(response.body).toEqual({
        token,
        user: { id: 1, email: "user@test.com" }
      });
    });

    test("handles missing email or password", async () => {
      const response = await request(app)
        .post("/users/login")
        .send({ email: "" })
        .expect(400);

      expect(response.body.error.message).toBe("Email and password are required.");
    });
  });

  describe("POST /register", () => {
    test("registers a new user", async () => {
      User.register.mockResolvedValue({
        user: { id: 1, email: "user@test.com", name: "Test User" },
        token
      });

      const response = await request(app)
        .post("/users/register")
        .send({ name: "Test User", email: "user@test.com", password: "password", userType: "admin", artistName: "Test Artist" })
        .expect(201);

      expect(response.body).toEqual({
        token,
        user: { id: 1, email: "user@test.com", name: "Test User" }
      });
    });
  });

  describe("GET /", () => {
    test("fetches all users", async () => {
      User.findAll.mockResolvedValue([
        { id: 1, email: "user1@test.com" },
        { id: 2, email: "user2@test.com" }
      ]);

      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        users: [
          { id: 1, email: "user1@test.com" },
          { id: 2, email: "user2@test.com" }
        ]
      });
    });
  });

  describe("GET /:email", () => {
    test("fetches a user by email", async () => {
      User.getUser.mockResolvedValue({ id: 1, email: "user@test.com" });

      const response = await request(app)
        .get("/users/user@test.com")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        user: { id: 1, email: "user@test.com" }
      });
    });
  });

  describe("GET /:id", () => {
    test("fetches a user by ID", async () => {
      User.getUserById.mockResolvedValue({ id: 1, email: "user@test.com" });

      const response = await request(app)
        .get("/users/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        user: { id: 1, email: "user@test.com" }
      });
    });
  });

  describe("GET /events/:userId", () => {
    test("fetches event requests by user ID", async () => {
      CalendarEventRequest.getByUserId.mockResolvedValue([
        { id: 1, eventName: "Test Event", artistName: "Test Artist", userId: 1 }
      ]);

      const response = await request(app)
        .get("/users/events/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        eventRequests: [
          { id: 1, eventName: "Test Event", artistName: "Test Artist", userId: 1 }
        ]
      });
    });

    test("handles no event requests found for user", async () => {
      CalendarEventRequest.getByUserId.mockResolvedValue([]);
      const response = await request(app)
        .get("/users/events/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "No event requests found for this user.",
        eventRequests: []
      });
    });
  });
});
