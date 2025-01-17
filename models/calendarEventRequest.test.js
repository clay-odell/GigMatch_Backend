"use strict";

const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const CalendarEventRequest = require("../models/calendarEventRequest");

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid"),
}));

afterAll(async () => {
  await db.end(); // Ensure the database connection is closed
});

describe("CalendarEventRequest class", function () {
  describe("create", function () {
    it("should create a new event request", async function () {
      const data = {
        userId: "testUser",
        requestDate: "2022-01-01",
        artistName: "Artist",
        eventName: "Event",
        startTime: "10:00",
        endTime: "12:00",
        amount: 100,
      };

      db.query = jest.fn().mockResolvedValueOnce({
        rows: [
          {
            requestId: uuidv4(),
            eventId: uuidv4(),
            userId: data.userId,
            status: "Pending",
            requestDate: data.requestDate,
            artistName: data.artistName,
            eventName: data.eventName,
            startTime: data.startTime,
            endTime: data.endTime,
            amount: data.amount,
          },
        ],
      });

      const result = await CalendarEventRequest.create(data);
      expect(result).toEqual({
        requestId: "mock-uuid",
        eventId: "mock-uuid",
        userId: data.userId,
        status: "Pending",
        requestDate: data.requestDate,
        artistName: data.artistName,
        eventName: data.eventName,
        startTime: data.startTime,
        endTime: data.endTime,
        amount: data.amount,
      });
    });

    it("should throw BadRequestError if creation fails", async function () {
      const data = {
        userId: "testUser",
        requestDate: "2022-01-01",
        artistName: "Artist",
        eventName: "Event",
        startTime: "10:00",
        endTime: "12:00",
        amount: 100,
      };

      db.query = jest.fn().mockResolvedValueOnce({ rows: [] });

      await expect(CalendarEventRequest.create(data)).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe("get", function () {
    it("should get an event request by requestId", async function () {
      const requestId = "mock-uuid";

      db.query = jest.fn().mockResolvedValueOnce({
        rows: [
          {
            requestId,
            eventId: "mock-event-id",
            userId: "testUser",
            status: "Pending",
            requestDate: "2022-01-01",
            startTime: "10:00",
            endTime: "12:00",
            amount: 100,
          },
        ],
      });

      const result = await CalendarEventRequest.get(requestId);
      expect(result).toEqual({
        requestId,
        eventId: "mock-event-id",
        userId: "testUser",
        status: "Pending",
        requestDate: "2022-01-01",
        startTime: "10:00",
        endTime: "12:00",
        amount: 100,
      });
    });

    it("should return a message if no event request is found", async function () {
      const requestId = "mock-uuid";

      db.query = jest.fn().mockResolvedValueOnce({ rows: [] });

      const result = await CalendarEventRequest.get(requestId);
      expect(result).toEqual({
        message: "There were no requests found for by that requestId",
      });
    });
  });

  describe("updateRequest", function () {
    it("should update an event request", async function () {
      const requestId = "mock-uuid";
      const updateData = {
        status: "Approved",
        requestDate: "2022-01-02",
        startTime: "11:00",
        endTime: "13:00",
        amount: 150,
      };
      const requester = { usertype: "Admin" };

      db.query = jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ userId: "testUser" }] })
        .mockResolvedValueOnce({
          rows: [
            {
              requestId,
              eventId: "mock-event-id",
              userId: "testUser",
              status: updateData.status,
              requestDate: updateData.requestDate,
              startTime: updateData.startTime,
              endTime: updateData.endTime,
              amount: updateData.amount,
            },
          ],
        });

      const result = await CalendarEventRequest.updateRequest(requestId, updateData, requester);
      expect(result).toEqual({
        requestId,
        eventId: "mock-event-id",
        userId: "testUser",
        status: updateData.status,
        requestDate: updateData.requestDate,
        startTime: updateData.startTime,
        endTime: updateData.endTime,
        amount: updateData.amount,
      });
    });

    it("should throw UnauthorizedError if requester is not authorized", async function () {
      const requestId = "mock-uuid";
      const updateData = {
        status: "Approved",
        requestDate: "2022-01-02",
        startTime: "11:00",
        endTime: "13:00",
        amount: 150,
      };
      const requester = { usertype: "User", userId: "wrongUser" };

      db.query = jest.fn().mockResolvedValueOnce({ rows: [{ userId: "testUser" }] });

      await expect(
        CalendarEventRequest.updateRequest(requestId, updateData, requester)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should throw NotFoundError if no event requests are found", async function () {
        db.query = jest.fn().mockResolvedValueOnce({ rows: [] });
  
        await expect(CalendarEventRequest.getAll()).rejects.toThrow(
          NotFoundError
        );
      });
    });
  
    describe("getByUserId", function () {
      it("should return event requests by userId", async function () {
        const userId = "testUser";
  
        const eventRequests = [
          {
            requestId: "1",
            eventName: "Event One",
            eventId: "event-1",
            userId: "testUser",
            status: "Pending",
            requestDate: "2022-01-01",
            startTime: "10:00",
            endTime: "12:00",
            amount: 100,
            artistName: "Artist One",
          },
        ];
  
        db.query = jest.fn().mockResolvedValueOnce({ rows: eventRequests });
  
        const result = await CalendarEventRequest.getByUserId(userId);
        expect(result).toEqual(eventRequests);
      });
    });
  
    describe("findByStatus", function () {
      it("should return event requests by status", async function () {
        const status = "Pending";
  
        const eventRequests = [
          {
            requestId: "1",
            eventId: "event-1",
            userId: "testUser",
            eventName: "Event One",
            requestDate: "2022-01-01",
            startTime: "10:00",
            endTime: "12:00",
            amount: 100,
            status: "Pending",
            artistName: "Artist One",
          },
        ];
  
        db.query = jest.fn().mockResolvedValueOnce({ rows: eventRequests });
  
        const result = await CalendarEventRequest.findByStatus(status);
        expect(result).toEqual(eventRequests);
      });
    });
  });
  