const db = require("../db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { NotFoundError, BadRequestError, UnauthorizedError } = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { createToken } = require("../helpers/tokens");  
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");

class Admin {
  static async authenticate(email, password) {
    const result = await db.query(
      `SELECT userid, name, email, password, usertype, venuename, location, artistname
       FROM users WHERE email = $1`,
      [email]
    );

    const admin = result.rows[0];
    if (!admin) {
      throw new NotFoundError("Admin not found");
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email/password");
    }

    const { password: _password, ...adminWithoutPassword } = admin;
    const token = createToken(adminWithoutPassword);
    return { admin: adminWithoutPassword, token };
  }

  static async register({
    name,
    email,
    password,
    venuename,
    location,
    artistname,
  }) {
    if (password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters.");
    }

    const duplicateCheck = await db.query(
      `SELECT userid, email FROM users WHERE email = $1`,
      [email]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError("Email is already registered.");
    }

    const userid = uuidv4();
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (userid, name, email, password, usertype, venuename, location, artistname)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING userid, name, email, usertype, venuename, location, artistname`,
      [userid, name, email, hashedPassword, "Admin", venuename, location, artistname]
    );

    const admin = result.rows[0];
    const token = createToken(admin);
    return { admin, token };
  }

  static async getAllEventRequests(requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError("You are not authorized to access all requests.");
    }

    const result = await db.query(
      `SELECT requestid, eventid, userid, status, requestdate, starttime, endtime, amount, artistname, eventname  
       FROM calendareventrequests`,
    );

    if (!result.rows.length) {
      throw new NotFoundError("No event requests found.");
    }

    return result.rows;
  }

  static async deleteEventRequest(requestid, requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError("You are not authorized to delete this request.");
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

    if (!result.rows[0]) {
      throw new BadRequestError("There was an error deleting the event request.");
    }

    return { deleted: result.rows[0] };
  }

  static async updateEventRequest(requestid, updateData, requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError("You are not authorized to update this request.");
    }

    const eventResult = await db.query(
      `SELECT requestid FROM calendareventrequests WHERE requestid = $1`,
      [requestid]
    );

    const event = eventResult.rows[0];
    if (!event) {
      throw new NotFoundError("Event request not found.");
    }

    const { query, values } = sqlForPartialUpdate(
      "calendareventrequests",
      updateData,
      "requestid",
      requestid
    );

    const result = await db.query(query, values);

    if (!result.rows.length) {
      throw new BadRequestError("There was an error updating the event request.");
    }

    return result.rows[0];
  }

  static async getAllUsers(requester) {
    if (requester.usertype !== "Admin") {
      throw new UnauthorizedError("You are not authorized to access all users.");
    }

    const result = await db.query(
      `SELECT userid, name, email, usertype, artistname 
       FROM users ORDER BY email`
    );

    if (!result.rows.length) {
      throw new NotFoundError("No users found.");
    }

    return result.rows;
  }

  static async updateUser(userid, updateData) {
    const userResult = await db.query(
      `SELECT userid, password FROM users WHERE userid = $1`,
      [userid]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    if (updateData.password && updateData.password.length === 0) {
      updateData.password = user.password;
    } else if (updateData.password && updateData.password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    } else if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, BCRYPT_WORK_FACTOR);
      updateData.password = hashedPassword;
    }

    const { query, values } = sqlForPartialUpdate("users", updateData, "userid", userid);

    const result = await db.query(query, values);

    if (!result.rows.length) {
      throw new BadRequestError("There was an error updating the user.");
    }

    return result.rows[0];
  }

  static async deleteUser(userid, requester) {
    if (!requester || requester.usertype !== "Admin") {
      throw new UnauthorizedError("You are not authorized to delete this user.");
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
