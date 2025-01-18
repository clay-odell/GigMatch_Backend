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
         FROM Users WHERE email = $1`,
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
    artistName,
    userType = "Artist",
  }) {
    if (password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters.");
    }
    const duplicateCheck = await db.query(
      `SELECT userId, name, email, password, artistName, userType FROM Users WHERE email = $1`,
      [email]
    );

    if (duplicateCheck.rows[0]) {
      console.error("Existing user found:", duplicateCheck.rows[0]);
      throw new BadRequestError("Email is already registered.");
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(BCRYPT_WORK_FACTOR)
    );

    const result = await db.query(
      `INSERT INTO Users (userId, name, email, password, artistName, userType)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING userId, name, email, artistName, userType`,
      [userId, name, email, hashedPassword, artistName, userType]
    );

    const user = result.rows[0];
    const token = createToken(user);
    return { user, token };
  }

  static async findAll() {
    const result = await db.query(
      `SELECT name, email, userType, artistName FROM Users ORDER BY email`
    );

    if (!result.rows.length) throw new NotFoundError("No users found");
    return result.rows;
  }

  static async getUser(email) {
    const result = await db.query(
      `SELECT name, email, artistName, userType FROM Users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) throw new BadRequestError(`No user found for ${email}.`);

    return user;
  }

  static async getUserById(id, requester) {
    if (!requester) {
      throw new UnauthorizedError("Requester information is missing.");
    }
    if (requester.userType !== "admin" && requester.userId !== id) {
      throw new UnauthorizedError(
        "You are not authorized to access this user."
      );
    }

    const result = await db.query(
      `SELECT userId, name, email, password, artistName, userType 
      FROM Users WHERE userId = $1`,
      [id]
    );

    const user = result.rows[0];
    if (!user) throw new NotFoundError("User not found");

    return user;
  }

  static async getEventRequestsByUserId(userId, requester) {
    if (requester.userType !== "admin" && requester.userId !== userId) {
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

  static async updateUser(userId, updateData) {
    // Check if the user exists
    const userResult = await db.query(
      `SELECT userId FROM Users WHERE userId = $1`,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new NotFoundError("User not found.");
    }
  
    // Hash the new password if provided
    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(
        updateData.password,
        parseInt(BCRYPT_WORK_FACTOR)
      );
      updateData.password = hashedPassword;
    }

    // Generate the partial update SQL statement
    const { query, values } = sqlForPartialUpdate(
      "Users",
      updateData,
      "userId",
      userId
    );

    // Execute the update query
    const result = await db.query(query, values);

    return result.rows[0];
  }
}

module.exports = User;
