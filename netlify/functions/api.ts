import serverless from "serverless-http";
import { createServer } from "../../server";

let handler: any = null;

function createHandler() {
  const app = createServer();
  return serverless(app);
}

export async function apiHandler(event: any, context: any) {
  if (!handler) {
    handler = createHandler();
  }
  return handler(event, context);
}

exports.handler = apiHandler;
