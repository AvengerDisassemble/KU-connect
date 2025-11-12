/**
 * @fileoverview Unit tests for example route
 * @author KU Connect Team
 */

const request = require("supertest");
const express = require("express");
const exampleRouter = require("../../../src/routes/example");

describe("example route", () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/", exampleRouter);
  });

  it("GET / should return example message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "This is an example route!" });
  });
});
