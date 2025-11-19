/**
 * @fileoverview Unit tests for app.js (Express app setup)
 * @author KU Connect Team
 */

const request = require("supertest");
const app = require("../../src/app");

describe("app.js", () => {
  it("should mount /api/example route and return correct message", async () => {
    const res = await request(app).get("/api/example");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "This is an example route!" });
  });
});
