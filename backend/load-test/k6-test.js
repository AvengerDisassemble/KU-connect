// K6 Load Testing Script for KU Connect Backend
// Install K6: https://k6.io/docs/getting-started/installation/
// Run: k6 run load-test/k6-test.js
// Run with options: k6 run --vus 50 --duration 60s load-test/k6-test.js

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Warm up to 10 users
    { duration: "1m", target: 20 }, // Normal load: 20 concurrent users
    { duration: "1m", target: 50 }, // Peak load: 50 concurrent users
    { duration: "1m", target: 100 }, // Stress test: 100 concurrent users
    { duration: "30s", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<1500", "p(99)<3000"], // 95% < 1.5s, 99% < 3s
    http_req_failed: ["rate<0.05"], // Error rate < 5%
    errors: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Test scenarios
export default function () {
  const scenarios = [
    testJobBrowsing,
    testAuthentication,
    testProfileAccess,
    testDegreeEndpoint,
  ];

  // Randomly select a scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  // Random sleep between 1-3 seconds to simulate real user behavior
  sleep(Math.random() * 2 + 1);
}

// Scenario 1: Job Browsing
function testJobBrowsing() {
  const responses = http.batch([
    ["GET", `${BASE_URL}/api/jobs`],
    ["GET", `${BASE_URL}/api/jobs?search=developer`],
    ["GET", `${BASE_URL}/api/jobs?location=Bangkok`],
  ]);

  responses.forEach((res) => {
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "response time < 2s": (r) => r.timings.duration < 2000,
    });
    errorRate.add(!success);
  });
}

// Scenario 2: Authentication
function testAuthentication() {
  const refreshRes = http.post(
    `${BASE_URL}/api/auth/refresh`,
    JSON.stringify({ refreshToken: "test-token" }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const success = check(refreshRes, {
    "status is 400 or 401": (r) => r.status === 400 || r.status === 401,
  });
  errorRate.add(!success);
}

// Scenario 3: Profile Access
function testProfileAccess() {
  const profileRes = http.get(`${BASE_URL}/api/profile`, {
    headers: { Authorization: "Bearer invalid-token" },
  });

  const success = check(profileRes, {
    "status is 401 or 403": (r) => r.status === 401 || r.status === 403,
    "response time < 1s": (r) => r.timings.duration < 1000,
  });
  errorRate.add(!success);
}

// Scenario 4: Degree Endpoint (Public)
function testDegreeEndpoint() {
  const degreeRes = http.get(`${BASE_URL}/api/degree`);

  const success = check(degreeRes, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "has degree data": (r) => r.json().length > 0,
  });
  errorRate.add(!success);
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log("Starting load test...");
  console.log(`Target: ${BASE_URL}`);
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log("Load test completed.");
}
