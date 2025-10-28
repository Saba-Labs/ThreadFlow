import { Response } from "express";

export type DataChangeEvent = 
  | { type: "pipeline_updated" }
  | { type: "jobworks_updated" }
  | { type: "machine_types_updated" };

interface Client {
  res: Response;
  id: string;
}

const clients = new Set<Client>();

export function subscribeToChanges(res: Response): string {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const client: Client = { res, id: clientId };
  clients.add(client);
  
  res.write("data: {\"type\":\"connected\"}\n\n");
  
  res.on("close", () => {
    clients.delete(client);
  });
  
  res.on("error", () => {
    clients.delete(client);
  });
  
  return clientId;
}

export function broadcastChange(event: DataChangeEvent): void {
  const message = JSON.stringify(event);
  const data = `data: ${message}\n\n`;
  
  for (const client of Array.from(clients)) {
    try {
      client.res.write(data);
    } catch (error) {
      clients.delete(client);
    }
  }
}
