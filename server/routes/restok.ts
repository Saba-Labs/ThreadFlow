import { RequestHandler } from "express";
import { query } from "../db";
import { broadcastChange } from "../events";

interface SubItem {
  id: string;
  name: string;
  quantity: number;
  lowStock: number;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  lowStock: number;
  note?: string;
  subItems: SubItem[];
}

export const getRestokItems: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM restok_items ORDER BY created_at DESC",
    );

    const items: Item[] = [];
    for (const row of result.rows) {
      const subItemsResult = await query(
        "SELECT id, name, quantity, low_stock as lowStock FROM restok_sub_items WHERE item_id = $1 ORDER BY created_at ASC",
        [row.id],
      );

      items.push({
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        lowStock: row.low_stock,
        note: row.note,
        subItems: subItemsResult.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          quantity: r.quantity,
          lowStock: r.lowStock,
        })),
      });
    }

    res.json(items);
  } catch (error) {
    console.error("Error fetching restok items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

export const createRestokItem: RequestHandler = async (req, res) => {
  try {
    const { id, name, quantity, lowStock, note, subItems } = req.body;
    const now = Date.now();

    // Validate required fields
    if (!id || id.trim() === "") {
      return res.status(400).json({ error: "Item ID is required" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Item name is required" });
    }

    if (
      quantity === undefined ||
      quantity === null ||
      isNaN(Number(quantity))
    ) {
      return res
        .status(400)
        .json({ error: "Item quantity must be a valid number" });
    }

    if (
      lowStock === undefined ||
      lowStock === null ||
      isNaN(Number(lowStock))
    ) {
      return res
        .status(400)
        .json({ error: "Low stock threshold must be a valid number" });
    }

    await query(
      "INSERT INTO restok_items (id, name, quantity, low_stock, note, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        id.trim(),
        name.trim(),
        Number(quantity),
        Number(lowStock),
        note || null,
        now,
        now,
      ],
    );

    if (subItems && Array.isArray(subItems)) {
      for (const sub of subItems) {
        await query(
          "INSERT INTO restok_sub_items (id, item_id, name, quantity, low_stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [sub.id, id, sub.name, sub.quantity, sub.lowStock, now, now],
        );
      }
    }

    broadcastChange({ type: "restok_updated" });
    res.json({ success: true, id });
  } catch (error) {
    console.error("Error creating restok item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
};

export const updateRestokItem: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, lowStock, note, subItems } = req.body;
    const now = Date.now();

    // Validate required fields
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Item name is required" });
    }

    if (
      quantity === undefined ||
      quantity === null ||
      isNaN(Number(quantity))
    ) {
      return res
        .status(400)
        .json({ error: "Item quantity must be a valid number" });
    }

    if (
      lowStock === undefined ||
      lowStock === null ||
      isNaN(Number(lowStock))
    ) {
      return res
        .status(400)
        .json({ error: "Low stock threshold must be a valid number" });
    }

    await query(
      "UPDATE restok_items SET name = $1, quantity = $2, low_stock = $3, note = $4, updated_at = $5 WHERE id = $6",
      [name.trim(), Number(quantity), Number(lowStock), note || null, now, id],
    );

    // Delete existing sub-items and insert new ones
    await query("DELETE FROM restok_sub_items WHERE item_id = $1", [id]);

    if (subItems && Array.isArray(subItems)) {
      for (const sub of subItems) {
        if (!sub.id || !sub.name || sub.quantity === undefined || sub.lowStock === undefined) {
          return res.status(400).json({
            error: `Invalid sub-item: missing required fields. Got: ${JSON.stringify(sub)}`
          });
        }
        try {
          await query(
            "INSERT INTO restok_sub_items (id, item_id, name, quantity, low_stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [sub.id, id, sub.name, Number(sub.quantity), Number(sub.lowStock), now, now],
          );
        } catch (subError) {
          console.error("Error inserting sub-item:", subError, "Sub-item data:", sub);
          return res.status(400).json({
            error: `Failed to insert sub-item: ${subError instanceof Error ? subError.message : "Unknown error"}`
          });
        }
      }
    }

    broadcastChange({ type: "restok_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating restok item:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update item";
    res.status(500).json({ error: errorMessage });
  }
};

export const deleteRestokItem: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await query("DELETE FROM restok_sub_items WHERE item_id = $1", [id]);
    await query("DELETE FROM restok_items WHERE id = $1", [id]);

    broadcastChange({ type: "restok_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting restok item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};
