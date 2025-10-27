import { RequestHandler } from "express";
import { query } from "../db";

export type StepStatus = "pending" | "running" | "hold" | "completed";

export interface PathStep {
  id: string;
  kind: "machine" | "job";
  machineType?: string;
  externalUnitName?: string;
  status: StepStatus;
  activeMachines: number;
  quantityDone: number;
}

export interface JobWorkAssignment {
  jobWorkId: string;
  quantity: number;
  pickupDate: number;
  completionDate?: number;
  status: "pending" | "completed";
}

export interface WorkOrder {
  id: string;
  modelName: string;
  quantity: number;
  createdAt: number;
  steps: PathStep[];
  currentStepIndex: number;
  parentId?: string;
  parallelGroups: any[];
  jobWorkIds?: string[];
  jobWorkAssignments?: JobWorkAssignment[];
}

export const getPipelineOrders: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM work_orders ORDER BY created_at DESC",
    );

    const orders: WorkOrder[] = [];
    for (const row of result.rows) {
      // Fetch steps
      const stepsResult = await query(
        "SELECT * FROM path_steps WHERE order_id = $1 ORDER BY step_index ASC",
        [row.id],
      );

      const steps = stepsResult.rows.map((s: any) => ({
        id: s.id,
        kind: s.kind,
        machineType: s.machine_type,
        externalUnitName: s.external_unit_name,
        status: s.status,
        activeMachines: s.active_machines,
        quantityDone: s.quantity_done,
      }));

      // Fetch job work assignments
      const assignmentsResult = await query(
        "SELECT job_work_id as jobWorkId, quantity, pickup_date as pickupDate, completion_date as completionDate, status FROM job_work_assignments WHERE order_id = $1",
        [row.id],
      );

      const jobWorkAssignments = assignmentsResult.rows.map((a: any) => ({
        jobWorkId: a.jobWorkId,
        quantity: a.quantity,
        pickupDate: a.pickupDate,
        completionDate: a.completionDate,
        status: a.status,
      }));

      orders.push({
        id: row.id,
        modelName: row.model_name,
        quantity: row.quantity,
        createdAt: row.created_at,
        steps,
        currentStepIndex: row.current_step_index,
        parentId: row.parent_id,
        parallelGroups: [],
        jobWorkAssignments,
      });
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching pipeline orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const createWorkOrder: RequestHandler = async (req, res) => {
  try {
    const { id, modelName, quantity, createdAt, steps } = req.body;

    if (!id || !modelName || quantity === undefined || quantity === null) {
      return res.status(400).json({ error: "Missing required fields: id, modelName, and quantity" });
    }

    const now = Date.now();

    await query(
      "INSERT INTO work_orders (id, model_name, quantity, created_at, updated_at, current_step_index) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, modelName, quantity, createdAt || now, now, -1],
    );

    // Insert steps
    if (steps && Array.isArray(steps)) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await query(
          `INSERT INTO path_steps
           (id, order_id, kind, machine_type, external_unit_name, status, active_machines, quantity_done, step_index, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            step.id,
            id,
            step.kind,
            step.machineType || null,
            step.externalUnitName || null,
            step.status,
            step.activeMachines,
            step.quantityDone,
            i,
            now,
            now,
          ],
        );
      }
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error("Error creating work order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const updateWorkOrder: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { modelName, quantity, currentStepIndex, steps } = req.body;
    const now = Date.now();

    await query(
      "UPDATE work_orders SET model_name = COALESCE($1, model_name), quantity = COALESCE($2, quantity), current_step_index = COALESCE($3, current_step_index), updated_at = $4 WHERE id = $5",
      [modelName || null, quantity || null, currentStepIndex !== undefined ? currentStepIndex : null, now, id],
    );

    // Update steps only if provided
    if (steps && steps.length > 0) {
      await query("DELETE FROM path_steps WHERE order_id = $1", [id]);
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await query(
          `INSERT INTO path_steps
           (id, order_id, kind, machine_type, external_unit_name, status, active_machines, quantity_done, step_index, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            step.id,
            id,
            step.kind,
            step.machineType || null,
            step.externalUnitName || null,
            step.status,
            step.activeMachines,
            step.quantityDone,
            i,
            now,
            now,
          ],
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating work order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
};

export const deleteWorkOrder: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await query("DELETE FROM job_work_assignments WHERE order_id = $1", [id]);
    await query("DELETE FROM path_steps WHERE order_id = $1", [id]);
    await query("DELETE FROM work_orders WHERE id = $1", [id]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting work order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
};

export const updateStepStatus: RequestHandler = async (req, res) => {
  try {
    const { orderId, stepIndex } = req.params;
    const { status, activeMachines, quantityDone } = req.body;
    const now = Date.now();

    await query(
      `UPDATE path_steps 
       SET status = COALESCE($1, status), active_machines = COALESCE($2, active_machines), quantity_done = COALESCE($3, quantity_done), updated_at = $4
       WHERE order_id = $5 AND step_index = $6`,
      [
        status || null,
        activeMachines !== undefined ? activeMachines : null,
        quantityDone !== undefined ? quantityDone : null,
        now,
        orderId,
        parseInt(stepIndex),
      ],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating step status:", error);
    res.status(500).json({ error: "Failed to update step" });
  }
};
