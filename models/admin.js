const db = require("../db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");
const { BCRYPT_WORK_FACTOR } = require("../config");

class Admin {
  static async register(data) {
    if (data.password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }
    const hashedPassword = await bcrypt.hash(
      data.password,
      parseInt(BCRYPT_WORK_FACTOR)
    );
    const result = await db.query(
      `INSERT INTO users (userid, name, email, password, usertype, venuename, location, artistname)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING userid, name, email, usertype, venuename, location, artistname`,
      [
        uuidv4(),
        data.name,
        data.email,
        hashedPassword,
        "Admin",
        data.venuename,
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
      `SELECT userid, name, email, password, usertype, venuename, location, artistname
       FROM users
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

    delete user.password; // Exclude password from the user object

    return user;
  }

  static async getAllEventRequests(requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError(
        "You are not authorized to access all requests."
      );
    }

    const result = await db.query(
      `SELECT requestid, eventid, userid, status, requestdate, starttime, endtime, amount, artistname, eventname  
       FROM calendareventrequests`
    );

    if (!result.rows.length) {
      throw new NotFoundError("No event requests found.");
    }

    return result.rows;
  }

  static async deleteEventRequest(requestid, requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError(
        "You are not authorized to delete this request."
      );
    }

    const eventResult = await db.query(
      `SELECT requestid FROM calendareventrequests WHERE requestid = $1`,
      [requestid]
    );

    const event = eventResult.rows[0];
    if (!event) {
      throw new NotFoundError("Event request not found.");
    }

    const result = await db.query(
      `DELETE FROM calendareventrequests WHERE requestid = $1 
       RETURNING requestid, eventid, userid, status, requestdate, starttime, endtime, amount`,
      [requestid]
    );

    if (!result.rows.length) {
      throw new BadRequestError(
        "There was an error deleting the event request."
      );
    }

    return { deleted: result.rows[0] };
  }

  static async updateEventRequest(requestid, updateData, requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError(
        "You are not authorized to update this request."
      );
    }

    const eventResult = await db.query(
      `SELECT requestid FROM calendareventrequests WHERE requestid = $1`,
      [requestid]
    );

    const event = eventResult.rows[0];
    if (!event) {
      throw new NotFoundError("Event request not found.");
    }

    const result = await db.query(
      `UPDATE calendareventrequests
       SET status = $1, requestdate = $2, starttime = $3, endtime = $4, amount = $5
       WHERE requestid = $6
       RETURNING requestid, eventid, userid, status, requestdate, starttime, endtime, amount`,
      [
        updateData.status,
        updateData.requestdate,
        updateData.starttime,
        updateData.endtime,
        updateData.amount,
        requestid,
      ]
    );

    if (!result.rows.length) {
      throw new BadRequestError(
        "There was an error updating the event request."
      );
    }

    return result.rows[0];
  }

  static async getAllUsers(requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError(
        "You are not authorized to access all users."
      );
    }

    const result = await db.query(
      `SELECT userid, name, email, usertype, artistname FROM users ORDER BY email`
    );

    if (!result.rows.length) {
      throw new NotFoundError("No users found.");
    }

    return result.rows;
  }

  static async updateUser(userid, updateData) {
    // Check if the user exists
    const userResult = await db.query(
      `SELECT userid, password FROM users WHERE userid = $1`,
      [userid]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    // Check if password is provided and valid, otherwise use current password
    if (updateData.password && updateData.password.length === 0) {
      updateData.password = user.password; // Retain current password if new password is blank
    } else if (updateData.password && updateData.password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    } else if (updateData.password) {
      const hashedPassword = await bcrypt.hash(
        updateData.password,
        parseInt(BCRYPT_WORK_FACTOR)
      );
      updateData.password = hashedPassword;
    }

    // Generate the partial update SQL statement
    const { query, values } = sqlForPartialUpdate(
      "users",
      updateData,
      "userid",
      userid
    );

    // Execute the update query
    const result = await db.query(query, values);

    if (!result.rows.length) {
      throw new BadRequestError("There was an error updating the user.");
    }

    return result.rows[0];
  }

  static async deleteUser(userid, requester) {
    if (!requester || requester.usertype !== "Admin") {
      throw new UnauthorizedError(
        "You are not authorized to delete this user."
      );
    }

    const userResult = await db.query(
      `SELECT userid FROM users WHERE userid = $1`,
      [userid]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    const result = await db.query(
      `DELETE FROM users WHERE userid = $1 
       RETURNING userid, name, email, usertype`,
      [userid]
    );

    if (!result.rows.length) {
      throw new BadRequestError("There was an error deleting the user.");
    }

    return { deleted: result.rows[0] };
  }
}

module.exports = Admin;
