/**
 * @fileoverview Unit tests for example-database-usage route
 * @author KU Connect Team
 */

const request = require("supertest");
const express = require("express");

<<<<<<< HEAD
// Mock the Prisma module before importing the route
const mockFindMany = jest.fn();
jest.mock("../../../../src/generated/prisma", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findMany: mockFindMany,
      },
    })),
  };
});
=======
// Mock the Prisma singleton before importing the route
const mockFindMany = jest.fn()
jest.mock('../../../../src/models/prisma', () => ({
  user: {
    findMany: mockFindMany
  }
}))
>>>>>>> dev

const exampleDbRouter = require("../../../../src/routes/example-database-usage/index");

describe("example-database-usage route", () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/", exampleDbRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET / should return users from prisma", async () => {
    const users = [{ id: 1, username: "prof.johndoe" }];
    mockFindMany.mockResolvedValue(users);
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(users);
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });

  it("GET / should handle prisma error", async () => {
    mockFindMany.mockRejectedValue(new Error("Database failure"));
    const res = await request(app).get("/");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
    expect(mockFindMany).toHaveBeenCalledTimes(1);
  });
});
