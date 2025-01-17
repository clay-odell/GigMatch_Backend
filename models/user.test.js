const db = require("../db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { createToken } = require("../helpers/tokens");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const User = require("./user");

// Mocking necessary modules and methods
jest.mock("bcrypt");
jest.mock("../db");
jest.mock("uuid", () => ({ v4: jest.fn() }));
jest.mock("../helpers/tokens");

describe("User", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
    db.end();
  });

  describe("authenticate method", () => {
    it("should authenticate a user with valid credentials", async () => {
      const email = "testing@example.com";
      const password = "password";
      const user = {
        userId: "1",
        name: "Test",
        email,
        password: "hashedpassword",
        artistName: "Artist",
        userType: "Artist",
      };

      db.query.mockResolvedValueOnce({
        rows: [
          {
            userId: "1",
            name: "Test",
            email,
            password: "hashedpassword",
            artistName: "Artist",
            userType: "Artist",
          },
        ],
      });
      bcrypt.compare.mockResolvedValueOnce(true);
      createToken.mockReturnValue("mockToken");

      const result = await User.authenticate(email, password);

      expect(result).toEqual({
        user: {
          userId: "1",
          name: "Test",
          email: "testing@example.com",
          artistName: "Artist",
          userType: "Artist",
        },
        token: "mockToken",
      });

      // Verify the query call
      expect(db.query.mock.calls[0]).toEqual([
        `SELECT userId, name, email, password, artistName, userType 
         FROM Users WHERE email = $1`,
        [email],
      ]);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, "hashedpassword");
    });

    it("should throw NotFoundError if user not found", async () => {
      const email = "notfound@example.com";
      const password = "password";

      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(User.authenticate(email, password)).rejects.toThrow(
        NotFoundError
      );

      // Verify the query call
      expect(db.query.mock.calls[0]).toEqual([
        `SELECT userId, name, email, password, artistName, userType 
         FROM Users WHERE email = $1`,
        [email],
      ]);
    });

    it("should throw UnauthorizedError if password is invalid", async () => {
      const email = "testing@example.com";
      const password = "wrongpassword";

      db.query.mockResolvedValueOnce({
        rows: [
          {
            userId: "1",
            name: "Test",
            email,
            password: "hashedpassword",
            artistName: "Artist",
            userType: "Artist",
          },
        ],
      });

      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(User.authenticate(email, password)).rejects.toThrow(
        UnauthorizedError
      );

      // Verify the query call
      expect(db.query.mock.calls[0]).toEqual([
        `SELECT userId, name, email, password, artistName, userType 
         FROM Users WHERE email = $1`,
        [email],
      ]);
    });
  });

  describe("register method", () => {
    const newUser = {
      name: "New User",
      email: "new@example.com",
      password: "password",
      artistName: "New Artist",
      userType: "Artist",
    };

    it("should register a new user", async function () {
      // Mock the duplicate check query
      db.query.mockResolvedValueOnce({ rows: [] }); // No duplicate user found

      // Mock the insert query
      bcrypt.hash.mockResolvedValueOnce("hashedpassword");
      uuidv4.mockReturnValue("new-uuid");
      db.query.mockResolvedValueOnce({
        rows: [
          {
            userId: "new-uuid",
            name: "New User",
            email: "new@example.com",
            artistName: "New Artist",
            userType: "Artist",
          },
        ],
      });
      createToken.mockReturnValue("mockToken");

      const result = await User.register(newUser);

      expect(result).toEqual({
        user: {
          userId: "new-uuid",
          name: "New User",
          email: "new@example.com",
          artistName: "New Artist",
          userType: "Artist",
        },
        token: "mockToken",
      });

      // Check the first call for duplicate check
      expect(db.query.mock.calls[0]).toEqual([
        `SELECT userId, name, email, password, artistName, userType FROM Users WHERE email = $1`,
        [newUser.email],
      ]);

      // Check the second call for user registration
      expect(db.query.mock.calls[1]).toEqual([
        `INSERT INTO Users (userId, name, email, password, artistName, userType)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING userId, name, email, artistName, userType`,
        [
          "new-uuid",
          "New User",
          "new@example.com",
          "hashedpassword",
          "New Artist",
          "Artist",
        ],
      ]);
    });

    it("should throw BadRequestError if email is already registered", async function () {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            userId: "existing-uuid",
            name: "Existing User",
            email: "new@example.com",
            artistName: "Existing Artist",
            userType: "Artist",
          },
        ],
      });

      await expect(User.register(newUser)).rejects.toThrow(BadRequestError);
    });
  });

  describe("findAll method", () => {
    it("should return all users", async function () {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            name: "Test User1",
            email: "user1@example.com",
            userType: "Admin",
          },
          {
            name: "Test User2",
            email: "user2@example.com",
            userType: "Artist",
          },
        ],
      });

      const users = await User.findAll();

      expect(users).toEqual([
        {
          name: "Test User1",
          email: "user1@example.com",
          userType: "Admin",
        },
        {
          name: "Test User2",
          email: "user2@example.com",
          userType: "Artist",
        },
      ]);

      expect(db.query.mock.calls.length).toBe(1);
      expect(db.query.mock.calls[0][0]).toBe(
        `SELECT name, email, userType FROM Users ORDER BY email`
      );
    });

    it("should throw NotFoundError if no users found", async function () {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(User.findAll()).rejects.toThrow(NotFoundError);
    });
  });

  describe("getUser method", () => {
    it("should return user by email", async function () {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            name: "Test User",
            email: "test@example.com",
            artistName: "Test Artist",
            userType: "Artist",
          },
        ],
      });

      const user = await User.getUser("test@example.com");

      expect(user).toEqual({
        name: "Test User",
        email: "test@example.com",
        artistName: "Test Artist",
        userType: "Artist",
      });
      expect(db.query.mock.calls).toEqual([
        [
          `SELECT name, email, artistName, userType FROM Users WHERE email = $1`,
          ["test@example.com"],
        ],
      ]);
    });

    it("should throw BadRequestError if user not found", async function () {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(User.getUser("nonexistent@example.com")).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("getUserById method", () => {
    const requesterAdmin = { userType: "admin" };
    const requesterUser = { userType: "Artist", userId: "1" };
  
    it("should return user by ID if requester is admin", async function () {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            userId: "1",
            name: "Test User",
            email: "test@example.com",
            password: "hashedpassword",
            artistName: "Test Artist",
            userType: "Artist",
          },
        ],
      });
  
      const user = await User.getUserById("1", requesterAdmin);
  
      expect(user).toEqual({
        userId: "1",
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        artistName: "Test Artist",
        userType: "Artist",
      });
  
      // Verify the query call
      expect(db.query.mock.calls.length).toBe(1);
      expect(db.query.mock.calls[0][0]).toEqual(
        `SELECT userId, name, email, password, artistName, userType 
      FROM Users WHERE userId = $1`
      );
      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
    });
  
    it("should return user by ID if requester is the same user", async function () {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            userId: "1",
            name: "Test User",
            email: "test@example.com",
            password: "hashedpassword",
            artistName: "Test Artist",
            userType: "Artist",
          },
        ],
      });
  
      const user = await User.getUserById("1", requesterUser);
  
      expect(user).toEqual({
        userId: "1",
        name: "Test User",
        email: "test@example.com",
        password: "hashedpassword",
        artistName: "Test Artist",
        userType: "Artist",
      });
  
      // Verify the query call
      expect(db.query.mock.calls.length).toBe(1);
      expect(db.query.mock.calls[0][0]).toEqual(
        `SELECT userId, name, email, password, artistName, userType 
      FROM Users WHERE userId = $1`
      );
      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
    });
  
    it("should throw UnauthorizedError if requester is not authorized", async function () {
      const requester = { userType: "Artist", userId: "2" };
  
      await expect(User.getUserById("1", requester)).rejects.toThrow(
        UnauthorizedError
      );
  
      // No query call should be made
      expect(db.query.mock.calls.length).toBe(0);
    });
  
    it("should throw NotFoundError if user not found", async function () {
      db.query.mockResolvedValueOnce({ rows: [] });
  
      await expect(User.getUserById("1", requesterAdmin)).rejects.toThrow(
        NotFoundError
      );
  
      // Verify the query call
      expect(db.query.mock.calls.length).toBe(1);
      expect(db.query.mock.calls[0][0]).toEqual(
        `SELECT userId, name, email, password, artistName, userType 
      FROM Users WHERE userId = $1`
      );
      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
    });
  });
  describe("getEventRequestsByUserId method", () => {
    const requesterAdmin = { userType: "admin" };
    const requesterUser = { userType: "Artist", userId: "1" };
  
    it("should return event requests for a user if requester is admin", async function () {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            requestId: "1",
            eventId: "1",
            userId: "1",
            status: "pending",
            requestDate: "2023-01-01",
            startTime: "10:00",
            endTime: "12:00",
            amount: 100,
            artistName: "Artist",
          },
        ],
      });
  
      const eventRequests = await User.getEventRequestsByUserId("1", requesterAdmin);
  
      expect(eventRequests).toEqual([
        {
          requestId: "1",
          eventId: "1",
          userId: "1",
          status: "pending",
          requestDate: "2023-01-01",
          startTime: "10:00",
          endTime: "12:00",
          amount: 100,
          artistName: "Artist",
        },
      ]);
  
      // Verify the query call
      expect(db.query.mock.calls.length).toBe(1);
      expect(db.query.mock.calls[0][0]).toEqual(
        `SELECT requestId, eventId, userId, status, requestDate, startTime, endTime, amount, artistName 
      FROM CalendarEventRequests WHERE userId = $1`
      );
      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
    });
  
    it("should return event requests for a user if requester is the same user", async function () {
      db.query.mockResolvedValueOnce({
        rows: [
          {
            requestId: "1",
            eventId: "1",
            userId: "1",
            status: "pending",
            requestDate: "2023-01-01",
            startTime: "10:00",
            endTime: "12:00",
            amount: 100,
            artistName: "Artist",
          },
        ],
      });
  
      const eventRequests = await User.getEventRequestsByUserId("1", requesterUser);
  
      expect(eventRequests).toEqual([
        {
          requestId: "1",
          eventId: "1",
          userId: "1",
          status: "pending",
          requestDate: "2023-01-01",
          startTime: "10:00",
          endTime: "12:00",
          amount: 100,
          artistName: "Artist",
        },
      ]);
  
      // Verify the query call
      expect(db.query.mock.calls.length).toBe(1);
      expect(db.query.mock.calls[0][0]).toEqual(
        `SELECT requestId, eventId, userId, status, requestDate, startTime, endTime, amount, artistName 
      FROM CalendarEventRequests WHERE userId = $1`
      );
      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
    });
  
    it("should throw UnauthorizedError if requester is not authorized", async function () {
      const requester = { userType: "Artist", userId: "2" };
  
      await expect(User.getEventRequestsByUserId("1", requester)).rejects.toThrow(
        UnauthorizedError
      );
  
      // No query call should be made
      expect(db.query.mock.calls.length).toBe(0);
    });
  });
  
});
