import fetch from "node-fetch";

const BASE_URL = "http://localhost:3175/api/auth";

// Test helper function
async function test(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`\n📡 ${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    return { response, data };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

// Helper function to test with token
async function testWithToken(endpoint, method = "GET", body = null, token) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`\n📡 ${method} ${endpoint} (Protected)`);
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    return { response, data };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

// Test Authentication Flow
async function runTests() {
  console.log("🧪 Testing Authentication APIs\n");
  console.log("=" .repeat(50));

  // Test 1: Send OTP for new user registration
  console.log("\n1️⃣ Testing: Send OTP (New User Registration)");
  const otpResult = await test("/send-otp", "POST", {
    email: "test@example.com",
    password: "test123456",
    name: "Test User",
  });

  if (!otpResult || !otpResult.data.success) {
    console.log("❌ Failed to send OTP");
    return;
  }

  // Wait a bit for email (in real scenario, check email)
  console.log("\n⏳ Please check your email for OTP...");
  console.log("💡 For testing, you can check the console logs or database for OTP");

  // Test 2: Verify OTP (you'll need to replace with actual OTP from email)
  console.log("\n2️⃣ Testing: Verify OTP");
  console.log("⚠️  Note: Replace '123456' with actual OTP from email");
  const verifyResult = await test("/verify-otp", "POST", {
    email: "test@example.com",
    otp: "123456", // Replace with actual OTP
    name: "Test User",
  });

  if (!verifyResult || !verifyResult.data.success) {
    console.log("❌ Failed to verify OTP");
    console.log("💡 Make sure to use the actual OTP from your email");
    return;
  }

  const token = verifyResult.data.token;
  console.log(`\n✅ Authentication successful! Token: ${token.substring(0, 20)}...`);

  // Test 3: Get current user (protected route)
  console.log("\n3️⃣ Testing: Get Current User (Protected Route)");
  const meResult = await testWithToken("/me", "GET", null, token);

  // Test 4: Login with email and password (for existing users)
  console.log("\n4️⃣ Testing: Login with Email/Password");
  const loginResult = await test("/login", "POST", {
    email: "test@example.com",
    password: "test123456",
  });

  if (loginResult && loginResult.data.success) {
    console.log("✅ Login successful!");
  }

  // Test 5: Health check
  console.log("\n5️⃣ Testing: Health Check");
  const healthResult = await fetch("http://localhost:3175/api/health");
  const healthData = await healthResult.json();
  console.log("Health:", healthData);

  console.log("\n" + "=".repeat(50));
  console.log("✅ All tests completed!");
}

// Run tests
runTests().catch(console.error);

