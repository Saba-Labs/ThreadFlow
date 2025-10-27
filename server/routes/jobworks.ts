import { RequestHandler } from "express";
import { query } from "../db";

export const getJobWorks: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, description FROM job_works ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching job works:", error);
    res.status(500).json({ error: "Failed to fetch job works" });
  }
};

export const createJobWork: RequestHandler = async (req, res) => {
  try {
    const { id, name, description } = req.body;

    if (!id || !name) {
      return res
        .status(400)
        .json({ error: "Missing required fields: id and name" });
    }

    const now = Date.now();

    await query(
      "INSERT INTO job_works (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
      [id, name.trim(), description?.trim() || "", now, now],
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error("Error creating job work:", error);
    res.status(500).json({ error: "Failed to create job work" });
  }
};

export const updateJobWork: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !String(name).trim()) {
      return res
        .status(400)
        .json({ error: "Name is required and cannot be empty" });
    }

    const now = Date.now();

    await query(
      "UPDATE job_works SET name = $1, description = $2, updated_at = $3 WHERE id = $4",
      [String(name).trim(), description || "", now, id],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating job work:", error);
    res.status(500).json({ error: "Failed to update job work" });
  }
};

export const deleteJobWork: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await query("DELETE FROM job_work_assignments WHERE job_work_id = $1", [
      id,
    ]);
    await query("DELETE FROM job_works WHERE id = $1", [id]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting job work:", error);
    res.status(500).json({ error: "Failed to delete job work" });
  }
};
