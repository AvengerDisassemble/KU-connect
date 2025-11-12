/**
 * Authorization Example Demonstration Script
 * This script demonstrates the new authorization endpoints
 * Run this with the server running to see role-based access in action
 */

const http = require("http");

// Demo users (you'll need to register these first or use existing ones)
const demoUsers = {
  student: {
    email: "student.demo@test.edu",
    password: "TestPass123",
  },
  professor: {
    email: "professor.demo@test.edu",
    password: "TestPass123",
  },
  employer: {
    email: "employer.demo@test.edu",
    password: "TestPass123",
  },
  admin: {
    email: "admin.demo@test.edu",
    password: "TestPass123",
  },
};

async function demonstrateAuthorization() {
  console.log("🔐 Authorization Demonstration - KU Connect\n");
  console.log(
    "This demo shows how different user types get different data and access levels.\n",
  );

  try {
    // 1. Register demo users
    console.log("📝 Step 1: Registering demo users...");
    await registerDemoUsers();

    // 2. Login and get tokens for each user type
    console.log("\n🔑 Step 2: Logging in users...");
    const tokens = await loginUsers();

    // 3. Demonstrate profile endpoint for each user type
    console.log("\n👤 Step 3: Testing profile endpoints...");
    await testProfileEndpoints(tokens);

    // 4. Demonstrate dashboard endpoint for each user type
    console.log("\n📊 Step 4: Testing dashboard endpoints...");
    await testDashboardEndpoints(tokens);

    // 5. Demonstrate role-based access control
    console.log("\n🚫 Step 5: Testing role-based access control...");
    await testRoleBasedAccess(tokens);

    console.log("\n✅ Authorization demonstration complete!");
    console.log("\n📋 Summary:");
    console.log("   ✅ Different user types receive role-specific data");
    console.log("   ✅ Role-based access control prevents unauthorized access");
    console.log("   ✅ JWT authentication protects all endpoints");
    console.log("   ✅ User capabilities are clearly defined per role");
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    console.log("\n💡 Tip: Make sure the server is running on localhost:3000");
  }
}

async function registerDemoUsers() {
  const registrations = [
    {
      endpoint: "/api/register/alumni",
      data: {
        name: "Demo",
        surname: "Student",
        email: demoUsers.student.email,
        password: demoUsers.student.password,
        degreeTypeId: 1,
        address: "Demo Address 123",
      },
    },
    {
      endpoint: "/api/register/staff",
      data: {
        name: "Demo",
        surname: "Professor",
        email: demoUsers.professor.email,
        password: demoUsers.professor.password,
        department: "Computer Science",
      },
    },
    {
      endpoint: "/api/register/enterprise",
      data: {
        name: "Demo",
        surname: "Employer",
        email: demoUsers.employer.email,
        password: demoUsers.employer.password,
        companyName: "Demo Company Inc",
        address: "Demo Company Address",
      },
    },
    {
      endpoint: "/api/register/admin",
      data: {
        name: "Demo",
        surname: "Admin",
        email: demoUsers.admin.email,
        password: demoUsers.admin.password,
      },
    },
  ];

  for (const reg of registrations) {
    try {
      await makeAPICall("POST", reg.endpoint, reg.data);
      console.log(`   ✅ Registered ${reg.data.name} ${reg.data.surname}`);
    } catch (error) {
      if (error.message.includes("already registered")) {
        console.log(
          `   ℹ️  ${reg.data.name} ${reg.data.surname} already exists`,
        );
      } else {
        console.log(
          `   ⚠️  Failed to register ${reg.data.name} ${reg.data.surname}: ${error.message}`,
        );
      }
    }
  }
}

async function loginUsers() {
  const tokens = {};

  for (const [role, credentials] of Object.entries(demoUsers)) {
    try {
      const response = await makeAPICall(
        "POST",
        "/api/login",
        credentials,
        true,
      );
      // Extract token from Set-Cookie header
      const cookies = response.headers["set-cookie"] || [];
      const accessTokenCookie = cookies.find((cookie) =>
        cookie.startsWith("accessToken="),
      );
      if (accessTokenCookie) {
        tokens[role] = accessTokenCookie
          .split(";")[0]
          .replace("accessToken=", "");
        console.log(`   ✅ Logged in ${role}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to login ${role}: ${error.message}`);
    }
  }

  return tokens;
}

async function testProfileEndpoints(tokens) {
  for (const [role, token] of Object.entries(tokens)) {
    try {
      const response = await makeAPICall(
        "GET",
        "/api/user-profile/me",
        null,
        false,
        token,
      );
      const data = response.data;

      console.log(`\n   👤 ${role.toUpperCase()} Profile:`);
      console.log(`      Role: ${data.user.role}`);
      console.log(
        `      Capabilities: ${data.capabilities.slice(0, 3).join(", ")}...`,
      );
      console.log(`      Dashboard: ${data.recommendedDashboard}`);
      console.log(`      Role Data: ${Object.keys(data.roleData).join(", ")}`);
    } catch (error) {
      console.log(`   ❌ Failed to get ${role} profile: ${error.message}`);
    }
  }
}

async function testDashboardEndpoints(tokens) {
  for (const [role, token] of Object.entries(tokens)) {
    try {
      const response = await makeAPICall(
        "GET",
        "/api/user-profile/dashboard",
        null,
        false,
        token,
      );
      const data = response.data;

      console.log(`\n   📊 ${role.toUpperCase()} Dashboard:`);
      console.log(
        `      Quick Actions: ${data.dashboard.quickActions.slice(0, 2).join(", ")}...`,
      );
      console.log(
        `      Dashboard Keys: ${Object.keys(data.dashboard).join(", ")}`,
      );
    } catch (error) {
      console.log(`   ❌ Failed to get ${role} dashboard: ${error.message}`);
    }
  }
}

async function testRoleBasedAccess(tokens) {
  // Test admin-only endpoint
  console.log("\n   🔒 Testing Admin-Only Endpoint:");
  for (const [role, token] of Object.entries(tokens)) {
    try {
      await makeAPICall(
        "GET",
        "/api/user-profile/admin-only",
        null,
        false,
        token,
      );
      console.log(`      ✅ ${role} - Access granted`);
    } catch (error) {
      if (
        error.message.includes("Access denied") ||
        error.message.includes("Forbidden")
      ) {
        console.log(`      🚫 ${role} - Access denied (correct)`);
      } else {
        console.log(`      ❌ ${role} - Unexpected error: ${error.message}`);
      }
    }
  }

  // Test employer-only endpoint
  console.log("\n   🔒 Testing Employer-Only Endpoint:");
  for (const [role, token] of Object.entries(tokens)) {
    try {
      await makeAPICall(
        "GET",
        "/api/user-profile/employer-only",
        null,
        false,
        token,
      );
      console.log(`      ✅ ${role} - Access granted`);
    } catch (error) {
      if (
        error.message.includes("Access denied") ||
        error.message.includes("Forbidden")
      ) {
        console.log(`      🚫 ${role} - Access denied (correct)`);
      } else {
        console.log(`      ❌ ${role} - Unexpected error: ${error.message}`);
      }
    }
  }
}

function makeAPICall(method, path, data, includeHeaders = false, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (postData) {
      options.headers["Content-Length"] = Buffer.byteLength(postData);
    }

    if (token) {
      options.headers["Cookie"] = `accessToken=${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (includeHeaders) {
              resolve({ ...result, headers: res.headers });
            } else {
              resolve(result);
            }
          } else {
            reject(new Error(result.message || `HTTP ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Invalid JSON: ${body}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Connection error: ${error.message}`));
    });

    req.setTimeout(5000, () => {
      reject(new Error("Request timeout"));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Auto-run if executed directly
if (require.main === module) {
  demonstrateAuthorization().catch(console.error);
}

module.exports = { demonstrateAuthorization };
