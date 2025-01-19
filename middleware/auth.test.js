"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  isAdmin,
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");

const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ sub: "test", userType: "User" }, SECRET_KEY);
const adminJwt = jwt.sign({ sub: "admin", userType: "Admin" }, SECRET_KEY);
const badJwt = jwt.sign({ sub: "test", userType: "User" }, "wrong");

describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(req.user).toEqual({
      userID: "test",
      userType: "User",
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = { headers: {} };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    authenticateJWT(req, res, next);
    expect(req.user).toBeUndefined();
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    authenticateJWT(req, res, next);
    expect(req.user).toBeUndefined();
  });
});

describe("isAdmin", function () {
  test("works: is admin", function () {
    expect.assertions(1);
    const req = { user: { userID: "admin", userType: "Admin" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    isAdmin(req, res, next);
  });

  test("unauth if not admin", function () {
    expect.assertions(1);
    const req = { user: { userID: "test", userType: "User" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    isAdmin(req, res, next);
  });

  test("unauth if no user", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    isAdmin(req, res, next);
  });
});

describe("ensureCorrectUserOrAdmin", function () {
  test("works: admin", function () {
    expect.assertions(1);
    const req = { params: { userId: "test" }, user: { userID: "admin", userType: "Admin" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("works: correct user", function () {
    expect.assertions(1);
    const req = { params: { userId: "test" }, user: { userID: "test", userType: "User" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("unauth: mismatch", function () {
    expect.assertions(1);
    const req = { params: { userId: "wrong" }, user: { userID: "test", userType: "User" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("unauth: if no user", function () {
    expect.assertions(1);
    const req = { params: { userId: "test" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });
});
