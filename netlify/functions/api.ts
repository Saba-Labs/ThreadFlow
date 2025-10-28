import serverless from "serverless-http";
import express from "express";
import { createServer } from "../../server";

let cachedHandler: any = null;

function initializeHandler() {
  const app = createServer();

  // Add explicit body parsing middleware with larger limit for serverless
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Add request logging middleware for debugging
  app.use((req, res, next) => {
    console.log("Request:", {
      method: req.method,
      path: req.path,
      contentType: req.headers["content-type"],
      bodyLength: JSON.stringify(req.body).length,
    });
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
