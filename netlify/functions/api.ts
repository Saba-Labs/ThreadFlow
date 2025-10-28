import serverless from "serverless-http";
import express from "express";
import { createServer } from "../../server";

let cachedHandler: any = null;

function initializeHandler() {
  const app = createServer();

  // Parse body BEFORE serverless-http wraps the app
  app.use(express.json({ limit: "50mb" }));
  app.use(express.text({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Manual body parsing for serverless environments
  app.use((req: any, res, next) => {
    if (!req.body && req.rawBody) {
      try {
        req.body = JSON.parse(typeof req.rawBody === "string" ? req.rawBody : Buffer.from(req.rawBody).toString());
      } catch (e) {
        console.error("Failed to parse rawBody:", e);
      }
    }
    next();
  });

  return serverless(app);
}

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    cachedHandler = initializeHandler();
  }
  return cachedHandler(event, context);
};
