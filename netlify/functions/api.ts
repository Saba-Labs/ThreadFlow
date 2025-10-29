import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import {
  getPipelineOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  updateStepStatus,
  setJobWorkAssignments,
  updateJobWorkAssignmentStatus,
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
import {
  getRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  addModelToRoadmap,
  removeModelFromRoadmap,
  reorderRoadmapItems,
  moveModelBetweenRoadmaps,
} from "../../server/routes/roadmaps";
import { handleDemo } from "../../server/routes/demo";
import { initializeDatabase } from "../../server/db";

let cachedHandler: any = null;
let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

function initializeHandler() {
  const app = express();

  // Setup body parsing FIRST, before any routes
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(cors());

  // Middleware to handle Buffers from serverless-http
  app.use((req, res, next) => {
    // Convert Buffer to string if needed
    if (Buffer.isBuffer(req.body)) {
      try {
        const bodyString = req.body.toString("utf-8");
        req.body = JSON.parse(bodyString);
        console.log("Converted Buffer to JSON");
      } catch (e) {
        console.error("Failed to convert Buffer:", e);
        req.body = {};
      }
    } else if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        console.error("Failed to parse body string:", e);
        req.body = {};
      }
    }

    // If there's no body, initialize it as empty object
    if (!req.body) {
      req.body = {};
    }

    // Debug logging
    if (req.method === "POST" || req.method === "PUT") {
      console.log(`[${req.method}] ${req.path}:`, {
        contentType: req.get("content-type"),
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body),
        hasId: !!req.body.id,
        hasModelName: !!req.body.modelName,
      });
    }
    next();
  });

  // Initialize database once
  if (!dbInitialized) {
    dbInitPromise = initializeDatabase();
    dbInitPromise.catch((error) => {
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
  app.get("/api/restok/items", getRestokItems);
  app.post("/api/restok/items", createRestokItem);
  app.put("/api/restok/items/:id", updateRestokItem);
  app.delete("/api/restok/items/:id", deleteRestokItem);

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
  app.put(
    "/api/pipeline/orders/:orderId/job-work-assignments",
    setJobWorkAssignments,
  );
  app.put(
    "/api/pipeline/orders/:orderId/job-works/:jobWorkId/status",
    updateJobWorkAssignmentStatus,
  );

  return serverless(app);
}

export const handler = async (event: any, context: any) => {
  // Ensure database is initialized
  if (dbInitPromise) {
    try {
      await dbInitPromise;
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  }

  if (!cachedHandler) {
    cachedHandler = initializeHandler();
  }

  return cachedHandler(event, context);
};
