"use strict";

const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const Admin = require("../models/admin");

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

afterAll(async () => {
  await db.end();
});

describe("Admin class", function () {
  describe("register", function () {
    it("should register a new admin user", async function () {
      const data = {
        name: "Admin User",
        email: "admin@example.com",
        password: "password",
        venueName: "Venue",
        location: "Location",
        artistname: "Artist",
      };

      const user = {
        userId: uuidv4(),
        name: data.name,
        email: data.email,
        userType: "Admin",
        venueName: data.venueName,
        location: data.location,
        artistname: data.artistname,
      };

      const hashedPassword = await bcrypt.hash(data.password, 10);

      db.query = jest.fn().mockResolvedValueOnce({
        rows: [
          {
            userId: user.userId,
            name: user.name,
            email: user.email,
            userType: user.userType,
            venueName: user.venueName,
            location: user.location,
            artistname: user.artistname,
          },
        ],
      });

      const result = await Admin.register(data);
      expect(result).toEqual(user);
    });
  });

  describe("login", function () {
    it("should login with correct credentials", async function () {
      const email = "admin@example.com";
      const password = "password";

      const user = {
        userId: "mock-uuid",
        name: "Admin User",
        email: "admin@example.com",
        password: await bcrypt.hash(password, 10),
        userType: "Admin",
        venueName: "Venue",
        location: "Location",
        artistname: "Artist",
      };

      db.query = jest.fn().mockResolvedValueOnce({
        rows: [
          {
            userId: user.userId,
            name: user.name,
            email: user.email,
            password: user.password,
            userType: user.userType,
            venueName: user.venueName,
            location: user.location,
            artistname: user.artistname,
          },
        ],
      });

      const result = await Admin.login(email, password);
      expect(result).toEqual({
        userId: user.userId,
        name: user.name,
        email: user.email,
        userType: user.userType,
        venueName: user.venueName,
        location: user.location,
        artistname: user.artistname,
      });
    });

    it("should throw UnauthorizedError for incorrect email", async function () {
      db.query = jest.fn().mockResolvedValueOnce({ rows: [] });

      await expect(
        Admin.login("wrong@example.com", "password")
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError for incorrect password", async function () {
      const email = "admin@example.com";
      const password = "password";

      const user = {
        userId: "mock-uuid",
        name: "Admin User",
        email: "admin@example.com",
        password: await bcrypt.hash("wrongpassword", 10),
        userType: "Admin",
        venueName: "Venue",
        location: "Location",
        artistname: "Artist",
      };

      db.query = jest.fn().mockResolvedValueOnce({
        rows: [
          {
            userId: user.userId,
            name: user.name,
            email: user.email,
            password: user.password,
            userType: user.userType,
            venueName: user.venueName,
            location: user.location,
            artistname: user.artistname,
          },
        ],
      });

      await expect(Admin.login(email, password)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("getAllEventRequests", function () {
    it("should return all event requests for admin", async function () {
      const requester = { usertype: "Admin" };

      const eventRequests = [
        {
          requestId: "1",
          eventId: "1",
          userId: "1",
          status: "Pending",
          requestDate: "2022-01-01",
          startTime: "10:00",
          endTime: "12:00",
          amount: 100,
        },
      ];

      db.query = jest.fn().mockResolvedValueOnce({ rows: eventRequests });

      const result = await Admin.getAllEventRequests(requester);
      expect(result).toEqual(eventRequests);
    });

    it("should throw UnauthorizedError if requester is not admin", async function () {
      const requester = { usertype: "User" };

      await expect(Admin.getAllEventRequests(requester)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should throw NotFoundError if no event requests found", async function () {
      const requester = { usertype: "Admin" };

      db.query = jest.fn().mockResolvedValueOnce({ rows: [] });

      await expect(Admin.getAllEventRequests(requester)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("deleteEventRequest", function () {
    it("should delete an event request for admin", async function () {
      const requester = { userType: "Admin" };
      const requestId = "1";

      db.query = jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ requestId }] })
        .mockResolvedValueOnce({
          rows: [
            {
              requestId,
              eventId: "1",
              userId: "1",
              status: "Pending",
              requestDate: "2022-01-01",
              startTime: "10:00",
              endTime: "12:00",
              amount: 100,
            },
          ],
        });

      const result = await Admin.deleteEventRequest(requestId, requester);
      expect(result).toEqual({
        deleted: {
          requestId,
          eventId: "1",
          userId: "1",
          status: "Pending",
          requestDate: "2022-01-01",
          startTime: "10:00",
          endTime: "12:00",
          amount: 100,
        },
      });
    });

    it("should throw UnauthorizedError if requester is not admin", async function () {
      const requester = { userType: "User" };
      const requestId = "1";

      await expect(
        Admin.deleteEventRequest(requestId, requester)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw NotFoundError if event request not found", async function () {
      const requester = { userType: "Admin" };
      const requestId = "1";

      db.query = jest.fn().mockResolvedValueOnce({ rows: [] });

      await expect(
        Admin.deleteEventRequest(requestId, requester)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateEventRequest", function () {
    it("should update an event request for admin", async function () {
      const requester = { userType: "Admin" };
      const requestId = "1";
      const updateData = {
        status: "Approved",
        requestDate: "2022-01-02",
        startTime: "11:00",
        endTime: "13:00",
        amount: 150,
      };

      db.query = jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ requestId }] })
        .mockResolvedValueOnce({
          rows: [
            {
              requestId,
              eventId: "1",
              userId: "1",
              status: updateData.status,
              requestDate: updateData.requestDate,
              startTime: updateData.startTime,
              endTime: updateData.endTime,
              amount: updateData.amount,
            },
          ],
        });

      const result = await Admin.updateEventRequest(
        requestId,
        updateData,
        requester
      );
      expect(result).toEqual({
        requestId,
        eventId: "1",
        userId: "1",
        status: updateData.status,
        requestDate: updateData.requestDate,
        startTime: updateData.startTime,
        endTime: updateData.endTime,
        amount: updateData.amount,
      });
    });

    it("should throw UnauthorizedError if requester is not admin", async function () {
      const requester = { userType: "User" };
      const requestId = "1";
      const updateData = {
        status: "Approved",
        requestDate: "2022-01-02",
        startTime: "11:00",
        endTime: "13:00",
        amount: 150,
      };

      await expect(
        Admin.updateEventRequest(requestId, updateData, requester)
      ).rejects.toThrow(UnauthorizedError);
    });
    it("should throw NotFoundError if event request not found", async function () {
      const requester = { userType: "Admin" };
      const requestId = "1";
      const updateData = {
        status: "Approved",
        requestDate: "2022-01-02",
        startTime: "11:00",
        endTime: "13:00",
        amount: 150,
      };

      db.query = jest.fn().mockResolvedValueOnce({ rows: [] });

      await expect(
        Admin.updateEventRequest(requestId, updateData, requester)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getAllUsers", function () {
    it("should return all users for admin", async function () {
      const requester = { userType: "Admin" };

      const users = [
        {
          userId: "1",
          name: "User One",
          email: "user1@example.com",
          userType: "User",
        },
        {
          userId: "2",
          name: "User Two",
          email: "user2@example.com",
          userType: "User",
        },
      ];

      db.query = jest.fn().mockResolvedValueOnce({ rows: users });

      const result = await Admin.getAllUsers(requester);
      expect(result).toEqual(users);
    });

    it("should throw UnauthorizedError if requester is not admin", async function () {
      const requester = { userType: "User" };

      await expect(Admin.getAllUsers(requester)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should throw NotFoundError if no users found", async function () {
      const requester = { userType: "Admin" };

      db.query = jest.fn().mockResolvedValueOnce({ rows: [] });

      await expect(Admin.getAllUsers(requester)).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteUser", function () {
    it("should delete a user for admin", async function () {
      const requester = { userType: "Admin" };
      const userId = "1";

      db.query = jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ userId }] })
        .mockResolvedValueOnce({
          rows: [
            {
              userId,
              name: "User One",
              email: "user1@example.com",
              userType: "User",
            },
          ],
        });

      const result = await Admin.deleteUser(userId, requester);
      expect(result).toEqual({
        deleted: {
          userId,
          name: "User One",
          email: "user1@example.com",
          userType: "User",
        },
      });
    });

    it("should throw UnauthorizedError if requester is not admin", async function () {
      const requester = { userType: "User" };
      const userId = "1";

      await expect(Admin.deleteUser(userId, requester)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should throw NotFoundError if user not found", async function () {
      const requester = { userType: "Admin" };
      const userId = "1";

      db.query = jest.fn().mockResolvedValueOnce({ rows: [] });

      await expect(Admin.deleteUser(userId, requester)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});


