import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initializeDatabase } from "./db";
import {
  getRestokItems,
  createRestokItem,
  updateRestokItem,
  deleteRestokItem,
} from "./routes/restok";
import {
  getJobWorks,
  createJobWork,
  updateJobWork,
  deleteJobWork,
} from "./routes/jobworks";
import { getMachineTypes, setMachineTypes } from "./routes/machine-types";
import {
  getPipelineOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  updateStepStatus,
} from "./routes/pipeline";

let dbInitialized = false;

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database once
  if (!dbInitialized) {
    initializeDatabase().catch((error) => {
      console.error("Failed to initialize database:", error);
    });
    dbInitialized = true;
  }

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // ReStok routes
  app.get("/api/restok/items", getRestokItems);
  app.post("/api/restok/items", createRestokItem);
  app.put("/api/restok/items/:id", updateRestokItem);
  app.delete("/api/restok/items/:id", deleteRestokItem);

  // JobWorks routes
  app.get("/api/jobworks", getJobWorks);
  app.post("/api/jobworks", createJobWork);
  app.put("/api/jobworks/:id", updateJobWork);
  app.delete("/api/jobworks/:id", deleteJobWork);

  // Machine Types routes
  app.get("/api/machine-types", getMachineTypes);
  app.post("/api/machine-types", setMachineTypes);

  // Pipeline routes
  app.get("/api/pipeline/orders", getPipelineOrders);
  app.post("/api/pipeline/orders", createWorkOrder);
  app.put("/api/pipeline/orders/:id", updateWorkOrder);
  app.delete("/api/pipeline/orders/:id", deleteWorkOrder);
  app.put("/api/pipeline/orders/:orderId/steps/:stepIndex", updateStepStatus);

  return app;
}
