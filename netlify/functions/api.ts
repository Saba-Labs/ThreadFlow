import serverless from "serverless-http";
import express from "express";
import { createServer } from "../../server";

let handler: any = null;

function createHandler() {
  const app = createServer();
  return serverless(app);
}

export async function apiHandler(event: any, context: any) {
  // Parse body from Lambda event and inject it into the event
  if (event.body && typeof event.body === "string") {
    try {
      event.body = JSON.parse(event.body);
    } catch (e) {
      console.error("Failed to parse body from event:", event.body, e);
    }
  }

  // Set isBase64Encoded to false to ensure body is treated as string
  if (event.isBase64Encoded) {
    try {
      const decoded = Buffer.from(event.body, "base64").toString("utf-8");
      event.body = JSON.parse(decoded);
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
