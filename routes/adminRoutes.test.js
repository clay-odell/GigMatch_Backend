const request = require("supertest");
const app = require("../app"); // Adjust the path to your Express app
const Admin = require("../models/admin");
const { createToken } = require("../helpers/tokens");

jest.mock("../models/admin");
jest.mock("../helpers/tokens");

describe("Admin Routes", () => {
  let token;

  beforeAll(() => {
    token = createToken({ id: 1, isAdmin: true });
  });

  describe("POST /register", () => {
    test("registers a new admin", async () => {
      Admin.register.mockResolvedValue({ id: 1, email: "test@admin.com" });
      const response = await request(app)
        .post("/admin/register")
        .send({ email: "test@admin.com", password: "password" })
        .expect(201);

      expect(response.body).toEqual({
        token,
        newAdmin: { id: 1, email: "test@admin.com" },
      });
    });

    test("handles registration error", async () => {
      Admin.register.mockRejectedValue(new Error("Registration failed"));
      const response = await request(app)
        .post("/admin/register")
        .send({ email: "test@admin.com", password: "password" })
        .expect(500);

      expect(response.body.error.message).toBe("Registration failed");
    });
  });

  describe("POST /login", () => {
    test("logs in an admin", async () => {
      Admin.login.mockResolvedValue({ id: 1, email: "test@admin.com" });
      const response = await request(app)
        .post("/admin/login")
        .send({ email: "test@admin.com", password: "password" })
        .expect(200);

      expect(response.body).toEqual({
        token,
        admin: { id: 1, email: "test@admin.com" },
      });
    });

    test("handles login error", async () => {
      Admin.login.mockRejectedValue(new Error("Invalid credentials"));
      const response = await request(app)
        .post("/admin/login")
        .send({ email: "test@admin.com", password: "password" })
        .expect(500);

      expect(response.body.error.message).toBe("Invalid credentials");
    });
  });

  describe("GET /event-requests", () => {
    test("fetches all event requests", async () => {
      Admin.getAllEventRequests.mockResolvedValue([{ id: 1, event: "test event" }]);
      const response = await request(app)
        .get("/admin/event-requests")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([{ id: 1, event: "test event" }]);
    });

    test("handles no event requests found", async () => {
      Admin.getAllEventRequests.mockResolvedValue(null);
      const response = await request(app)
        .get("/admin/event-requests")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.error.message).toBe("No event requests found");
    });
  });

  describe("DELETE /event-requests/:id", () => {
    test("deletes an event request", async () => {
      Admin.deleteEventRequest.mockResolvedValue({ success: true });
      const response = await request(app)
        .delete("/admin/event-requests/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });

    test("handles event request not found", async () => {
      Admin.deleteEventRequest.mockResolvedValue(null);
      const response = await request(app)
        .delete("/admin/event-requests/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.error.message).toBe("Event request not found");
    });
  });

  describe("PUT /event-requests/:id", () => {
    test("updates an event request", async () => {
      Admin.updateEventRequest.mockResolvedValue({ id: 1, event: "updated event" });
      const response = await request(app)
        .put("/admin/event-requests/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ event: "updated event" })
        .expect(200);

      expect(response.body).toEqual({ id: 1, event: "updated event" });
    });

    test("handles event request not found", async () => {
      Admin.updateEventRequest.mockResolvedValue(null);
      const response = await request(app)
        .put("/admin/event-requests/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ event: "updated event" })
        .expect(404);

      expect(response.body.error.message).toBe("Event request not found");
    });

    test("handles missing update data", async () => {
      const response = await request(app)
        .put("/admin/event-requests/1")
        .set("Authorization", `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.error.message).toBe("Update data is missing");
    });
  });

  describe("GET /users", () => {
    test("fetches all users", async () => {
      Admin.getAllUsers.mockResolvedValue([{ id: 1, email: "user@admin.com" }]);
      const response = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual([{ id: 1, email: "user@admin.com" }]);
    });

    test("handles no users found", async () => {
      Admin.getAllUsers.mockResolvedValue(null);
      const response = await request(app)
        .get("/admin/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.error.message).toBe("No users found");
    });
  });

  describe("DELETE /users/:id", () => {
    test("deletes a user", async () => {
      Admin.deleteUser.mockResolvedValue({ success: true });
      const response = await request(app)
        .delete("/admin/users/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({ success: true });
    });

    test("handles user not found", async () => {
      Admin.deleteUser.mockResolvedValue(null);
      const response = await request(app)
        .delete("/admin/users/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.error.message).toBe("User not found");
    });
  });
});
