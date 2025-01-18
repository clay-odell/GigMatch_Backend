const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const {sqlForPartialUpdate} = require('../helpers/sqlForPartialUpdate');
const bcrypt = require("bcrypt");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

class Admin {
  static async register(data) {
    if(data.password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters long.");
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const result = await db.query(
      `INSERT INTO Users (userId, name, email, password, userType, venueName, location, artistname)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING userId, name, email, userType, venueName, location, artistname`,
      [
        uuidv4(),
        data.name,
        data.email,
        hashedPassword,
        'Admin',
        data.venueName,
        data.location,
        data.artistname,
      ]
    );

    const user = result.rows[0];

    if (!user) {
      throw new BadRequestError("There was an error creating the admin user.");
    }

    return user;
  }

  static async login(email, password) {
    const result = await db.query(
      `SELECT userId, name, email, password, userType, venueName, location, artistName
       FROM Users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedError("Invalid email/password.");
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid email/password.");
    }

    delete user.password; // Remove password from user object before returning

    return user;
  }

  static async getAllEventRequests(requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError("You are not authorized to access all requests.");
    }

    const result = await db.query(
      `SELECT requestId, eventId, userId, status, requestDate, startTime, endTime, amount, artistName, eventName  
       FROM CalendarEventRequests`
    );

    if (!result.rows.length) {
      throw new NotFoundError("No event requests found.");
    }

    return result.rows;
  }

  static async deleteEventRequest(requestId, requester) {
    if (requester.userType !== "Admin") {
      throw new UnauthorizedError("You are not authorized to delete this request.");
    }

    const eventResult = await db.query(
      `SELECT requestId FROM CalendarEventRequests WHERE requestId = $1`,
      [requestId]
    );

    const event = eventResult.rows[0];
    if (!event) {
      throw new NotFoundError("Event request not found.");
    }

    const result = await db.query(
      `DELETE FROM CalendarEventRequests WHERE requestId = $1 
       RETURNING requestId, eventId, userId, status, requestDate, startTime, endTime, amount`,
      [requestId]
    );

    if (!result.rows.length) {
      throw new BadRequestError("There was an error deleting the event request.");
    }

    return { deleted: result.rows[0] };
  }

  static async updateEventRequest(requestId, updateData, requester) {
    if (requester.userType !== "Admin") {
      throw new UnauthorizedError("You are not authorized to update this request.");
    }

    const eventResult = await db.query(
      `SELECT requestId FROM CalendarEventRequests WHERE requestId = $1`,
      [requestId]
    );

    const event = eventResult.rows[0];
    if (!event) {
      throw new NotFoundError("Event request not found.");
    }

    const result = await db.query(
      `UPDATE CalendarEventRequests
       SET status = $1, requestDate = $2, startTime = $3, endTime = $4, amount = $5
       WHERE requestId = $6
       RETURNING requestId, eventId, userId, status, requestDate, startTime, endTime, amount`,
      [
        updateData.status,
        updateData.requestDate,
        updateData.startTime,
        updateData.endTime,
        updateData.amount,
        requestId,
      ]
    );

    if (!result.rows.length) {
      throw new BadRequestError("There was an error updating the event request.");
    }

    return result.rows[0];
  }

  static async getAllUsers(requester) {
    if (requester.userType !== "Admin") {
      throw new UnauthorizedError("You are not authorized to access all users.");
    }

    const result = await db.query(
      `SELECT userId, name, email, userType, artistName FROM Users ORDER BY email`
    );

    if (!result.rows.length) {
      throw new NotFoundError("No users found.");
    }

    return result.rows;
  }

  static async updateUser(userId, updateData) {
    // Check if the user exists
    const userResult = await db.query(
        `SELECT userId FROM users WHERE userId = $1`,
        [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
        throw new NotFoundError("User not found.");
    }

    // Generate the partial update SQL statement
    const { query, values } = sqlForPartialUpdate("Users", updateData, "userId", userId);

    
    const result = await db.query(query, values);
    return result.rows[0];
}


  static async deleteUser(userId, requester) {
    if (requester.userType !== "Admin") {
      throw new UnauthorizedError("You are not authorized to delete this user.");
    }

    const userResult = await db.query(
      `SELECT userId FROM Users WHERE userId = $1`,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const result = await db.query(
      `DELETE FROM Users WHERE userId = $1 
       RETURNING userId, name, email, userType`,
      [userId]
    );

    if (!result.rows.length) {
      throw new BadRequestError("There was an error deleting the user.");
    }

    return { deleted: result.rows[0] };
  }
}

module.exports = Admin;
