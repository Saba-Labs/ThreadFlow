import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initializeDatabase } from "./db";
import { subscribeToChanges } from "./events";
import {
  getRestokItems,
  createRestokItem,
  updateRestokItem,
  deleteRestokItem,
  reorderRestokItems,
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
  setJobWorkAssignments,
  updateJobWorkAssignmentStatus,
} from "./routes/pipeline";
import {
  getRoadmaps,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  addModelToRoadmap,
  removeModelFromRoadmap,
  reorderRoadmapItems,
  moveModelBetweenRoadmaps,
} from "./routes/roadmaps";

let dbInitialized = false;
let dbInitializationPromise: Promise<void> | null = null;

export function createServer() {
  const app = express();

  // Middleware - MUST be first
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.text({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Ensure body is parsed for serverless environments
  app.use((req: any, res, next) => {
    // If body is a string and looks like JSON, parse it
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        // Leave as string if not JSON
      }
    }
    next();
  });

  // Initialize database once - ensure it only runs once
  if (!dbInitialized && !dbInitializationPromise) {
    dbInitializationPromise = initializeDatabase()
      .then(() => {
        dbInitialized = true;
        console.log("✅ Database initialized successfully");
      })
      .catch((error) => {
        console.error("❌ Failed to initialize database:", error);
        // Don't set dbInitialized to true, allow retries
        dbInitializationPromise = null;
      });
  }

  // Middleware to ensure database is initialized before handling requests
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/") && !req.path.startsWith("/api/health")) {
      if (dbInitializationPromise) {
        dbInitializationPromise.then(
          () => {
            next();
          },
          () => {
            res.status(503).json({
              error: "Service unavailable: Database initialization in progress",
            });
          },
        );
      } else if (!dbInitialized) {
        res.status(503).json({
          error: "Service unavailable: Database not initialized",
        });
      } else {
        next();
      }
    } else {
      next();
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    const status = {
      status: dbInitialized ? "healthy" : "initializing",
      database: dbInitialized ? "connected" : "connecting",
      timestamp: new Date().toISOString(),
    };
    res.status(dbInitialized ? 200 : 503).json(status);
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Real-time sync endpoint
  app.get("/api/subscribe", (_req, res) => {
    subscribeToChanges(res);
  });

  // ReStok routes
  app.get("/api/restok/items", getRestokItems);
  app.post("/api/restok/items", createRestokItem);
  app.put("/api/restok/items/:id", updateRestokItem);
  app.delete("/api/restok/items/:id", deleteRestokItem);
  app.post("/api/restok/reorder", reorderRestokItems);

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
  app.put(
    "/api/pipeline/orders/:orderId/job-work-assignments",
    setJobWorkAssignments,
  );
  app.put(
    "/api/pipeline/orders/:orderId/job-works/:jobWorkId/status",
    updateJobWorkAssignmentStatus,
  );

  // Roadmap routes
  app.get("/api/roadmaps", getRoadmaps);
  app.post("/api/roadmaps", createRoadmap);
  app.put("/api/roadmaps/:id", updateRoadmap);
  app.delete("/api/roadmaps/:id", deleteRoadmap);
  app.post("/api/roadmaps/:roadmapId/models", addModelToRoadmap);
  app.delete(
    "/api/roadmaps/:roadmapId/models/:modelId",
    removeModelFromRoadmap,
  );
  app.put("/api/roadmaps/:roadmapId/reorder", reorderRoadmapItems);
  app.post("/api/roadmaps/move-model", moveModelBetweenRoadmaps);

  return app;
}
