"use strict";

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { createToken } = require("./tokens");

describe("createToken", function () {
  test("works: create token for user", function () {
    expect.assertions(1);
    const user = {
      userid: "testUser",
      email: "test@example.com",
      usertype: "User"
    };
    const token = createToken(user);
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      sub: "testUser",
      email: "test@example.com",
      userType: "User",
      iat: expect.any(Number),
      exp: expect.any(Number)
    });
  });

  test("fails: invalid token signature", function () {
    expect.assertions(1);
    const user = {
      userid: "testUser",
      email: "test@example.com",
      usertype: "User"
    };
    const token = createToken(user);
    try {
      jwt.verify(token, "wrongKey");
    } catch (error) {
      expect(error).toBeInstanceOf(jwt.JsonWebTokenError);
    }
  });
});
