import serverless from "serverless-http";
import express from "express";
import { createServer } from "../../server";

let cachedHandler: any = null;

function initializeHandler() {
  const app = createServer();

  // These are redundant since createServer() already adds them, 
  // but we add them again to ensure they run FIRST
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  return serverless(app, {
    // Configure serverless-http to properly handle body
    request: (request: any, event: any, context: any) => {
      // Ensure the body from the Lambda event is parsed
      if (event.body) {
        try {
          if (typeof event.body === "string") {
            request.body = JSON.parse(event.body);
          } else {
            request.body = event.body;
          }
        } catch (e) {
          console.error("Failed to parse event body:", e);
        }
      }
    },
  });
}

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    cachedHandler = initializeHandler();
  }
  return cachedHandler(event, context);
};
