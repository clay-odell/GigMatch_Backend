const db = require("../db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { createToken } = require("../helpers/tokens");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sqlForPartialUpdate");
const { BCRYPT_WORK_FACTOR } = require("../config");

class User {
  static async authenticate(email, password) {
    const result = await db.query(
      `SELECT userId, name, email, password, artistName, userType 
         FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) throw new NotFoundError("User not found");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedError("Invalid username/password");

    // Exclude the password from the user object before returning it
    const { password: _password, ...userWithoutPassword } = user;
    const token = createToken(userWithoutPassword);
    return { user: userWithoutPassword, token };
  }

  static async register({
    name,
    email,
    password,
    artistname,
    usertype = "Artist",
  }) {
    if (password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters.");
    }

    const duplicateCheck = await db.query(
      `SELECT userId, name, email, password, artistName, userType FROM users WHERE email = $1`,
      [email]
    );

    if (duplicateCheck.rows[0]) {
      console.error("Existing user found:", duplicateCheck.rows[0]);
      throw new BadRequestError("Email is already registered.");
    }

    const userid = uuidv4();
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(BCRYPT_WORK_FACTOR)
    );

    const result = await db.query(
      `INSERT INTO users (userId, name, email, password, artistName, userType)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING userId, name, email, artistName, userType`,
      [userid, name, email, hashedPassword, artistname, usertype]
    );

    const user = result.rows[0];
    const token = createToken(user);
    return { user, token };
  }

  static async findAll() {
    const result = await db.query(
      `SELECT name, email, userType, artistName FROM users ORDER BY email`
    );

    if (!result.rows.length) throw new NotFoundError("No users found");
    return result.rows;
  }

  static async getUser(email) {
    const result = await db.query(
      `SELECT name, email, artistName, userType FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) throw new BadRequestError(`No user found for ${email}.`);

    return user;
  }

  static async getUserById(userId, requester) {
    if (!requester) {
      throw new UnauthorizedError("Requester information is missing.");
    }
    if (requester.userType !== "admin" && requester.userId !== userId) {
      throw new UnauthorizedError(
        "You are not authorized to access this user."
      );
    }

    const result = await db.query(
      `SELECT userId, name, email, password, artistName, userType 
      FROM users WHERE userid = $1`,
      [userId]
    );

    const user = result.rows[0];
    if (!user) throw new NotFoundError("User not found");

    return user;
  }

  static async getEventRequestsByUserId(userId, requester) {
    if (requester.userType !== "admin" && requester.userid !== userId) {
      throw new UnauthorizedError(
        "You are not authorized to access these requests."
      );
    }

    const result = await db.query(
      `SELECT requestId, eventId, userId, status, requestDate, startTime, endTime, amount, artistName 
      FROM CalendarEventRequests WHERE userId = $1`,
      [userId]
    );

    return result.rows;
  }

  static async updateUser(userid, updateData) {
    // Check if the user exists
    const userResult = await db.query(
      `SELECT userId, password FROM users WHERE userId = $1`,
      [userid]
    );

    const user = userResult.rows[0];
    if (!user) throw new NotFoundError("User not found.");

    // Check if password is provided and valid, otherwise use current password
    if (updateData.password && updateData.password.length === 0) {
      updateData.password = user.password; // Retain the current password
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

    if (!result.rows.length)
      throw new BadRequestError("There was an error updating the user.");

    return result.rows[0];
  }
}

module.exports = User;
