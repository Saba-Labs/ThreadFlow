import serverless from "serverless-http";
import { createServer } from "../../server";

let handler: any = null;

function createHandler() {
  const app = createServer();
  return serverless(app);
}

export async function apiHandler(event: any, context: any) {
  // Ensure body is a string so express.json() middleware can parse it
  if (event.body && typeof event.body === "object") {
    event.body = JSON.stringify(event.body);
  }

  // Handle base64 encoded bodies
  if (event.isBase64Encoded && event.body) {
    try {
      event.body = Buffer.from(event.body, "base64").toString("utf-8");
    } catch (e) {
      console.error("Failed to decode base64 body:", e);
    }
  }

  if (!handler) {
    handler = createHandler();
  }

  return handler(event, context);
}

exports.handler = apiHandler;
