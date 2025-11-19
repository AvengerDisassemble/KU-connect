/**
 * @fileoverview Unit tests for routes/index.js (main API router with automatic route registration)
 * @author KU Connect Team
 */

const express = require("express");
const request = require("supertest");
const routesRouter = require("../../../src/routes/index");

describe("routes/index.js", () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api", routesRouter);
  });

  it("should automatically register example route", async () => {
    const res = await request(app).get("/api/example");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "This is an example route!" });
  });
});
