/**
 * @fileoverview Unit tests for example-subroute/index.js route
 * @author KU Connect Team
 */

const request = require("supertest");
const express = require("express");
const exampleSubrouteIndexRouter = require("../../../../src/routes/example-subroute/index");

describe("example-subroute/index.js route", () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/", exampleSubrouteIndexRouter);
  });

  it("GET / should return default subroute message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "This is an example default subroute!",
    });
  });

  it("GET /subroute1 should return subsubroute message", async () => {
    const res = await request(app).get("/subroute1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "This is an example subsubroute!" });
  });
});
