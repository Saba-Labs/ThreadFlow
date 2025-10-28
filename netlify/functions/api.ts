import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import {
  getPipelineOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  updateStepStatus,
} from "../../server/routes/pipeline";
import {
  getMachineTypes,
  setMachineTypes,
} from "../../server/routes/machine-types";
import {
  getJobWorks,
  createJobWork,
  updateJobWork,
  deleteJobWork,
} from "../../server/routes/jobworks";
import {
  getRestokItems,
  createRestokItem,
  updateRestokItem,
  deleteRestokItem,
} from "../../server/routes/restok";
import { handleDemo } from "../../server/routes/demo";
import { initializeDatabase } from "../../server/db";

let cachedHandler: any = null;
let dbInitialized = false;

function initializeHandler() {
  const app = express();

  // Setup body parsing FIRST, before any routes
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(cors());

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

  // Restok routes
  app.get("/api/restok", getRestokItems);
  app.post("/api/restok", createRestokItem);
  app.put("/api/restok/:id", updateRestokItem);
  app.delete("/api/restok/:id", deleteRestokItem);

  // Job works routes
  app.get("/api/jobworks", getJobWorks);
  app.post("/api/jobworks", createJobWork);
  app.put("/api/jobworks/:id", updateJobWork);
  app.delete("/api/jobworks/:id", deleteJobWork);

  // Machine types routes
  app.get("/api/machine-types", getMachineTypes);
  app.post("/api/machine-types", setMachineTypes);

  // Pipeline routes
  app.get("/api/pipeline/orders", getPipelineOrders);
  app.post("/api/pipeline/orders", createWorkOrder);
  app.put("/api/pipeline/orders/:id", updateWorkOrder);
  app.delete("/api/pipeline/orders/:id", deleteWorkOrder);
  app.put("/api/pipeline/orders/:orderId/steps/:stepIndex", updateStepStatus);

  return serverless(app);
}

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    cachedHandler = initializeHandler();
  }
  return cachedHandler(event, context);
};
