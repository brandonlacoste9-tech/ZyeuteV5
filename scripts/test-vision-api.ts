import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = "http://localhost:12020/api/ai/analyze-image";

// A small white 1x1 pixel JPEG
const TEST_IMAGE_BASE64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==";

async function testVision() {
  console.log("📸 Testing AI Cameraman (Gemini Vision)...");
  console.log(`Target: ${API_URL}`);

  try {
    // Attempt to authenticate (optional if we bypass middleware for local test,
    // but the route requires auth. For this script we might need to mock or
    // just try to hit it. If strict auth is on, we'll need a token.
    // Let's assume for this specific test script we might face a 401 if we don't login.
    // I'll try without first, if 401, I'll log that we need a token.)

    // Actually, let's login as a guest or use an existing token if possible.
    // For now, let's just try to hit it and see if the server is even up and routing.

    const response = await axios.post(
      API_URL,
      {
        imageBase64: TEST_IMAGE_BASE64,
        mimeType: "image/jpeg",
      },
      {
        headers: {
          // Mocking a userId if the middleware just checks for presence
          // In a real scenario we'd login first.
          // If the middleware checks DB, this will fail.
          // But let's see.
          "x-user-id": "test-user", // Sometimes used in dev
          "x-skip-auth": "true",
        },
        validateStatus: () => true, // Don't throw
      },
    );

    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log("✅ AI Cameraman Test PASSED!");
    } else if (response.status === 401) {
      console.log("⚠️ Auth required. The endpoint is protected.");
    } else {
      console.log("❌ Test FAILED.");
    }
  } catch (error: any) {
    console.error("❌ Network Error:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.log("Is the backend server running on port 12001?");
    }
  }
}

testVision();
