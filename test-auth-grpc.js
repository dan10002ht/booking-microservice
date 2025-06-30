const grpc = require("@grpc/grpc-js");
const path = require("path");

// Load the proto file
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync(
  path.join(__dirname, "shared-lib/protos/auth.proto"),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);

const authProto = grpc.loadPackageDefinition(packageDefinition);

// Create client
const client = new authProto.auth.AuthService(
  "127.0.0.1:50051",
  grpc.credentials.createInsecure()
);

// Test health check
console.log("🔍 Testing auth service health...");
client.health({}, (error, response) => {
  if (error) {
    console.error("❌ Health check failed:", error.message);
  } else {
    console.log("✅ Health check passed:", response);
  }
});

// Test login
console.log("🔐 Testing login...");
const loginRequest = {
  email: "admin@bookingsystem.com",
  password: "admin123",
  correlationId: "test-" + Date.now(),
};

client.login(loginRequest, (error, response) => {
  if (error) {
    console.error("❌ Login failed:", error.message);
    console.error("Error details:", error);
  } else {
    console.log("✅ Login successful:", response);
  }
});

// Wait a bit for responses
setTimeout(() => {
  console.log("🏁 Test completed");
  process.exit(0);
}, 3000);
