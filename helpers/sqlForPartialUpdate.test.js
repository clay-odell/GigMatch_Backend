"use strict";

const { sqlForPartialUpdate } = require("./sqlForPartialUpdate");

describe("sqlForPartialUpdate", function () {
  test("generates correct SQL query and values", function () {
    expect.assertions(2);
    const table = "users";
    const items = { firstName: "John", age: 30 };
    const key = "id";
    const id = 1;
    const result = sqlForPartialUpdate(table, items, key, id);

    expect(result.query).toEqual('UPDATE "users" SET "firstName"=$1, "age"=$2 WHERE "id"=$3 RETURNING *');
    expect(result.values).toEqual(["John", 30, 1]);
  });

  test("works with single field update", function () {
    expect.assertions(2);
    const table = "users";
    const items = { age: 30 };
    const key = "id";
    const id = 1;
    const result = sqlForPartialUpdate(table, items, key, id);

    expect(result.query).toEqual('UPDATE "users" SET "age"=$1 WHERE "id"=$2 RETURNING *');
    expect(result.values).toEqual([30, 1]);
  });

  test("works with no field update", function () {
    expect.assertions(2);
    const table = "users";
    const items = {};
    const key = "id";
    const id = 1;
    const result = sqlForPartialUpdate(table, items, key, id);

    expect(result.query).toEqual('UPDATE "users" SET  WHERE "id"=$1 RETURNING *');
    expect(result.values).toEqual([1]);
  });
});
