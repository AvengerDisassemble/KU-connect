const http = require("http");

/**
 * Simple test function to test the new registration endpoints
 * Tests staff and admin registration functionality
 */
async function testNewRegistrationEndpoints() {
  console.log("Testing new registration endpoints...\n");

  // Test data for staff registration
  const staffData = {
    name: "John",
    surname: "Professor",
    email: "john.professor@university.edu",
    password: "SecurePass123",
    department: "Computer Science",
  };

  // Test data for admin registration
  const adminData = {
    name: "Jane",
    surname: "Admin",
    email: "jane.admin@university.edu",
    password: "AdminPass123",
  };

  // Test staff registration
  console.log("1. Testing staff registration...");
  try {
    const staffResult = await makeRequest(
      "POST",
      "/api/register/staff",
      staffData,
    );
    console.log("✓ Staff registration successful:", staffResult.message);
    console.log("  User ID:", staffResult.data.user.id);
    console.log("  Role:", staffResult.data.user.role);
  } catch (error) {
    console.log("✗ Staff registration failed:", error.message);
  }

  console.log("");

  // Test admin registration
  console.log("2. Testing admin registration...");
  try {
    const adminResult = await makeRequest(
      "POST",
      "/api/register/admin",
      adminData,
    );
    console.log("✓ Admin registration successful:", adminResult.message);
    console.log("  User ID:", adminResult.data.user.id);
    console.log("  Role:", adminResult.data.user.role);
  } catch (error) {
    console.log("✗ Admin registration failed:", error.message);
  }

  console.log("");

  // Test validation - staff registration with missing department
  console.log("3. Testing validation (staff without department)...");
  try {
    const invalidStaffData = { ...staffData };
    delete invalidStaffData.department;
    invalidStaffData.email = "test.invalid@university.edu";

    await makeRequest("POST", "/api/register/staff", invalidStaffData);
    console.log("✗ Should have failed validation");
  } catch (error) {
    console.log("✓ Validation working correctly:", error.message);
  }

  console.log("\nTest completed!");
}

/**
 * Helper function to make HTTP requests
 */
function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(
              new Error(
                `${result.message || "Unknown error"} (Status: ${res.statusCode})`,
              ),
            );
          }
        } catch (error) {
          reject(
            new Error(
              `Invalid JSON response: ${body} (Status: ${res.statusCode})`,
            ),
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Connection error: ${error.message}`));
    });

    req.setTimeout(5000, () => {
      reject(new Error("Request timeout"));
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
testNewRegistrationEndpoints().catch(console.error);
