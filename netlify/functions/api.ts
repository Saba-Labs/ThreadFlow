import serverless from "serverless-http";
import express from "express";
import { createServer } from "../../server";

const app = createServer();

// Ensure body is parsed before serverless-http processes it
const bodyParsingMiddleware = express.json({ limit: "10mb" });
const urlEncodedMiddleware = express.urlencoded({ extended: true, limit: "10mb" });

app.use(bodyParsingMiddleware);
app.use(urlEncodedMiddleware);

export const handler = serverless(app);
