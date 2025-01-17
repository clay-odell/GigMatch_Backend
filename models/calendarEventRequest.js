const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const {sqlForPartialUpdate} = require('../helpers/sqlForPartialUpdate');

class CalendarEventRequest {
  static async create(data) {
    data.requestId = uuidv4();
    data.eventId = uuidv4(); // Generate a unique eventId for each request

    try {
      // Insert into CalendarEventRequests table
      const result = await db.query(
        `INSERT INTO CalendarEventRequests (requestId, eventId, userId, status, requestDate, artistName, eventName, startTime, endTime, amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING requestId, eventId, artistName, userId, status, requestDate, startTime, endTime, amount`,
        [
          data.requestId,
          data.eventId,
          data.userId,
          data.status || "Pending",
          data.requestDate,
          data.artistName,
          data.eventName,
          data.startTime,
          data.endTime,
          data.amount,
        ]
      );

      if (!result.rows.length) {
        throw new BadRequestError(
          "There was an error creating the event request."
        );
      }

      return result.rows[0];
    } catch (err) {
      throw new BadRequestError(err.message);
    }
  }

  static async get(requestId) {
    const result = await db.query(
      `SELECT requestId, eventId, userId, status, requestDate, startTime, endTime, amount 
        FROM CalendarEventRequests WHERE requestId = $1`,
      [requestId]
    );

    if (!result.rows.length) {
      return {
        message: "There were no requests found for by that requestId",
      };
    }

    return result.rows[0];
  }

  static async updateRequest(requestId, updateData, requester) {
    const eventResult = await db.query(
      `SELECT userId FROM CalendarEventRequests WHERE requestId = $1`,
      [requestId]
    );
    const event = eventResult.rows[0];
    
    if (!event) {
      throw new NotFoundError("Event request not found.");
    }
  
    // Check if the requester is an admin or the owner of the event
    if (requester.usertype !== "Admin" && requester.userId !== event.userId) {
      throw new UnauthorizedError(
        "You are not authorized to update this request."
      );
    }
  
    const { query, values } = sqlForPartialUpdate(
      "calendareventrequests",
      updateData,
      "requestid",
      requestId
    );
    const result = await db.query(query, values);
  
    if (!result.rows.length) {
      throw new BadRequestError("There was an error updating the request.");
    }
  
    return result.rows[0];
  }
  
  static async delete(requestId, requester) {
    const eventResult = await db.query(
      `SELECT userId FROM CalendarEventRequests WHERE requestId = $1`,
      [requestId]
    );

    const event = eventResult.rows[0];
    if (!event) {
      throw new NotFoundError("Event request not found.");
    }

    if (requester.usertype !== "admin" && requester.userId !== event.userId) {
      throw new UnauthorizedError(
        "You are not authorized to delete this request."
      );
    }

    const result = await db.query(
      `DELETE FROM CalendarEventRequests WHERE requestId = $1 
        RETURNING requestId, eventId, userId, status, requestDate, startTime, endTime, amount`,
      [requestId]
    );

    if (!result.rows.length) {
      throw new BadRequestError("There was an error deleting event request.");
    }

    return { deleted: result.rows[0] };
  }

  static async getAll() {
    const result = await db.query(
      `SELECT requestId, artistName, eventId, eventName, userId, status, requestDate, startTime, endTime, amount 
         FROM CalendarEventRequests`
    );

    if (!result.rows.length) {
      throw new NotFoundError("No event requests found.");
    }

    return result.rows;
  }

  static async getByUserId(userId) {
    const result = await db.query(
      `SELECT requestId, eventName, eventId, userId, status, requestDate, startTime, endTime, amount, artistName 
         FROM CalendarEventRequests WHERE userId = $1`,
      [userId]
    );
    return result.rows;
  }

  static async findByStatus(status) {
    const result = await db.query(
      `SELECT requestId, eventId, userId, eventName,  requestDate, startTime, endTime, amount, status, artistName
          FROM CalendarEventRequests
          WHERE status = $1`,
      [status]
    );
    return result.rows;
  }
}

module.exports = CalendarEventRequest;
