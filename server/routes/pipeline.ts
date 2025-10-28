import { RequestHandler } from "express";
import { query } from "../db";
import { broadcastChange } from "../events";

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
  jobWorkName?: string;
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
      "SELECT * FROM work_orders ORDER BY created_at DESC, id ASC",
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

      const normalizedSteps = steps.map((s) => ({
        ...s,
        activeMachines:
          typeof s.activeMachines === "number"
            ? s.activeMachines
            : parseInt(s.activeMachines || "0"),
        quantityDone:
          typeof s.quantityDone === "number"
            ? s.quantityDone
            : parseInt(s.quantityDone || "0"),
      }));

      orders.push({
        id: row.id,
        modelName: row.model_name,
        quantity: row.quantity,
        createdAt:
          typeof row.created_at === "number"
            ? row.created_at
            : parseInt(row.created_at || "0"),
        steps: normalizedSteps,
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
      return res.status(400).json({
        error: "Missing required fields: id, modelName, and quantity",
      });
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

    broadcastChange({ type: "pipeline_updated" });
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
      [
        modelName || null,
        quantity || null,
        currentStepIndex !== undefined ? currentStepIndex : null,
        now,
        id,
      ],
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

    broadcastChange({ type: "pipeline_updated" });
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

    broadcastChange({ type: "pipeline_updated" });
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

    broadcastChange({ type: "pipeline_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating step status:", error);
    res.status(500).json({ error: "Failed to update step" });
  }
};

export const setJobWorkAssignments: RequestHandler = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { assignments } = req.body;

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: "Assignments must be an array" });
    }

    const now = Date.now();

    await query("DELETE FROM job_work_assignments WHERE order_id = $1", [
      orderId,
    ]);

    for (const assignment of assignments) {
      const id = `jwa_${Math.random().toString(36).slice(2, 9)}`;
      await query(
        "INSERT INTO job_work_assignments (id, order_id, job_work_id, quantity, pickup_date, completion_date, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [
          id,
          orderId,
          assignment.jobWorkId,
          assignment.quantity || 1,
          assignment.pickupDate || now,
          assignment.completionDate || null,
          assignment.status || "pending",
          now,
          now,
        ],
      );
    }

    broadcastChange({ type: "pipeline_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error setting job work assignments:", error);
    res.status(500).json({ error: "Failed to set job work assignments" });
  }
};

export const updateJobWorkAssignmentStatus: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { orderId, jobWorkId } = req.params;
    const { status, completionDate } = req.body;
    const now = Date.now();

    if (!orderId || !jobWorkId) {
      return res.status(400).json({
        error: "Missing required parameters: orderId and jobWorkId",
      });
    }

    if (!status || !["pending", "completed"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be 'pending' or 'completed'",
      });
    }

    const result = await query(
      "SELECT id FROM job_work_assignments WHERE order_id = $1 AND job_work_id = $2",
      [orderId, jobWorkId],
    );

    if (result.rows.length === 0) {
      console.warn(
        `Assignment not found for orderId: ${orderId}, jobWorkId: ${jobWorkId}`,
      );
      return res.status(404).json({
        error: `Assignment not found for jobWorkId: ${jobWorkId}`,
      });
    }

    const updateResult = await query(
      "UPDATE job_work_assignments SET status = $1, completion_date = $2, updated_at = $3 WHERE order_id = $4 AND job_work_id = $5",
      [
        status,
        status === "completed" ? completionDate || now : null,
        now,
        orderId,
        jobWorkId,
      ],
    );

    if (!updateResult) {
      return res.status(500).json({
        error: "Failed to update assignment status",
      });
    }

    broadcastChange({ type: "pipeline_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating job work assignment status:", error);
    res.status(500).json({
      error: `Failed to update job work assignment status: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
};
