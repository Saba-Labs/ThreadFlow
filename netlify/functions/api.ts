import serverless from "serverless-http";
import { createServer } from "../../server";

let handler: ReturnType<typeof serverless> | null = null;

export async function apiHandler(event: any, context: any) {
  if (!handler) {
    handler = serverless(createServer());
  }
  return handler(event, context);
}

// Export as the default handler
exports.handler = apiHandler;
