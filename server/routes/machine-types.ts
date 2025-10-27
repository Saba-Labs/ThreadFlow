import { RequestHandler } from "express";
import { query } from "../db";

export interface MachineTypeConfig {
  name: string;
  letter: string;
}

export const getMachineTypes: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      "SELECT name, letter FROM machine_types ORDER BY created_at ASC",
    );
    res.json(result.rows.map((r: any) => ({ name: r.name, letter: r.letter })));
  } catch (error) {
    console.error("Error fetching machine types:", error);
    res.status(500).json({ error: "Failed to fetch machine types" });
  }
};

export const setMachineTypes: RequestHandler = async (req, res) => {
  try {
    const types: MachineTypeConfig[] = req.body;
    const now = Date.now();

    // Clear existing types
    await query("DELETE FROM machine_types");

    // Insert new types
    for (const type of types) {
      const id = `machine_${type.name.toLowerCase().replace(/\s+/g, "_")}`;
      await query(
        "INSERT INTO machine_types (id, name, letter, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
        [id, type.name, type.letter, now, now],
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error setting machine types:", error);
    res.status(500).json({ error: "Failed to set machine types" });
  }
};
