import serverless from "serverless-http";
import { createServer } from "../../server";

let handler: any = null;

export const handler = async (event: any, context: any) => {
  if (!handler) {
    const app = createServer();
    handler = serverless(app);
  }
  return handler(event, context);
};
