import { RequestHandler } from "express";
import { query } from "../db";
import { broadcastChange } from "../events";

function uid(prefix = "rdm") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export const getRoadmaps: RequestHandler = async (req, res) => {
  try {
    const roadmapsResult = await query(
      "SELECT id, title, created_at FROM roadmaps ORDER BY created_at DESC",
    );

    const roadmaps = await Promise.all(
      roadmapsResult.rows.map(async (roadmap: any) => {
        const itemsResult = await query(
          "SELECT id, model_id, model_name, quantity, added_at FROM roadmap_items WHERE roadmap_id = $1 ORDER BY item_index ASC",
          [roadmap.id],
        );
        return {
          id: roadmap.id,
          title: roadmap.title,
          createdAt: roadmap.created_at,
          items: itemsResult.rows.map((item: any) => ({
            modelId: item.model_id,
            modelName: item.model_name,
            quantity: item.quantity,
            addedAt: item.added_at,
          })),
        };
      }),
    );

    res.json(roadmaps);
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    res.status(500).json({ error: "Failed to fetch roadmaps" });
  }
};

export const createRoadmap: RequestHandler = async (req, res) => {
  try {
    const { id, title } = req.body;

    if (!title || !String(title).trim()) {
      return res
        .status(400)
        .json({ error: "Title is required and cannot be empty" });
    }

    const roadmapId = id || uid("roadmap");
    const now = Date.now();

    await query(
      "INSERT INTO roadmaps (id, title, created_at, updated_at) VALUES ($1, $2, $3, $4)",
      [roadmapId, String(title).trim(), now, now],
    );

    broadcastChange({ type: "roadmaps_updated" });
    res.json({ success: true, id: roadmapId });
  } catch (error) {
    console.error("Error creating roadmap:", error);
    res.status(500).json({ error: "Failed to create roadmap" });
  }
};

export const updateRoadmap: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !String(title).trim()) {
      return res
        .status(400)
        .json({ error: "Title is required and cannot be empty" });
    }

    const now = Date.now();

    await query(
      "UPDATE roadmaps SET title = $1, updated_at = $2 WHERE id = $3",
      [String(title).trim(), now, id],
    );

    broadcastChange({ type: "roadmaps_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating roadmap:", error);
    res.status(500).json({ error: "Failed to update roadmap" });
  }
};

export const deleteRoadmap: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await query("DELETE FROM roadmap_items WHERE roadmap_id = $1", [id]);
    await query("DELETE FROM roadmaps WHERE id = $1", [id]);

    broadcastChange({ type: "roadmaps_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    res.status(500).json({ error: "Failed to delete roadmap" });
  }
};

export const addModelToRoadmap: RequestHandler = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const { modelId, modelName, quantity } = req.body;

    console.log("[addModelToRoadmap] Called with:", {
      roadmapId,
      modelId,
      modelName,
      quantity,
    });

    if (!roadmapId) {
      console.error("[addModelToRoadmap] Missing roadmapId");
      return res.status(400).json({ error: "Missing roadmapId" });
    }

    if (!modelId || !modelName || quantity === undefined || quantity === null) {
      console.error("[addModelToRoadmap] Missing required fields:", {
        modelId,
        modelName,
        quantity,
      });
      return res.status(400).json({
        error: "Missing required fields: modelId, modelName, quantity",
      });
    }

    // Check if model already exists
    const existsResult = await query(
      "SELECT id FROM roadmap_items WHERE roadmap_id = $1 AND model_id = $2",
      [roadmapId, modelId],
    );

    if (existsResult.rows.length > 0) {
      console.error(
        "[addModelToRoadmap] Model already exists in roadmap:",
        roadmapId,
        modelId,
      );
      return res.status(400).json({ error: "Model already in roadmap" });
    }

    // Get next index
    const indexResult = await query(
      "SELECT MAX(item_index) as max_index FROM roadmap_items WHERE roadmap_id = $1",
      [roadmapId],
    );
    const nextIndex = (indexResult.rows[0]?.max_index ?? -1) + 1;

    const itemId = uid("rit");
    const now = Date.now();

    console.log("[addModelToRoadmap] Inserting item:", {
      itemId,
      roadmapId,
      modelId,
      nextIndex,
    });

    await query(
      "INSERT INTO roadmap_items (id, roadmap_id, model_id, model_name, quantity, added_at, item_index, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [
        itemId,
        roadmapId,
        modelId,
        modelName,
        quantity,
        now,
        nextIndex,
        now,
        now,
      ],
    );

    console.log("[addModelToRoadmap] Item inserted successfully");
    broadcastChange({ type: "roadmaps_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("[addModelToRoadmap] Error occurred:", error);
    res
      .status(500)
      .json({ error: "Failed to add model to roadmap", details: String(error) });
  }
};

export const removeModelFromRoadmap: RequestHandler = async (req, res) => {
  try {
    const { roadmapId, modelId } = req.params;

    await query(
      "DELETE FROM roadmap_items WHERE roadmap_id = $1 AND model_id = $2",
      [roadmapId, modelId],
    );

    broadcastChange({ type: "roadmaps_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing model from roadmap:", error);
    res.status(500).json({ error: "Failed to remove model from roadmap" });
  }
};

export const reorderRoadmapItems: RequestHandler = async (req, res) => {
  try {
    const { roadmapId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items must be an array" });
    }

    const now = Date.now();

    for (let i = 0; i < items.length; i++) {
      await query(
        "UPDATE roadmap_items SET item_index = $1, updated_at = $2 WHERE roadmap_id = $3 AND model_id = $4",
        [i, now, roadmapId, items[i]],
      );
    }

    broadcastChange({ type: "roadmaps_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error reordering roadmap items:", error);
    res.status(500).json({ error: "Failed to reorder roadmap items" });
  }
};

export const moveModelBetweenRoadmaps: RequestHandler = async (req, res) => {
  try {
    const { fromRoadmapId, toRoadmapId, modelId } = req.body;

    if (!fromRoadmapId || !toRoadmapId || !modelId) {
      return res.status(400).json({
        error: "Missing required fields: fromRoadmapId, toRoadmapId, modelId",
      });
    }

    // Get the item to move
    const itemResult = await query(
      "SELECT model_name, quantity FROM roadmap_items WHERE roadmap_id = $1 AND model_id = $2",
      [fromRoadmapId, modelId],
    );

    if (itemResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Model not found in source roadmap" });
    }

    const { model_name, quantity } = itemResult.rows[0];

    // Check if already exists in destination
    const existsResult = await query(
      "SELECT id FROM roadmap_items WHERE roadmap_id = $1 AND model_id = $2",
      [toRoadmapId, modelId],
    );

    if (existsResult.rows.length > 0) {
      // Just delete from source if already in destination
      await query(
        "DELETE FROM roadmap_items WHERE roadmap_id = $1 AND model_id = $2",
        [fromRoadmapId, modelId],
      );
    } else {
      // Get next index in destination
      const indexResult = await query(
        "SELECT MAX(item_index) as max_index FROM roadmap_items WHERE roadmap_id = $1",
        [toRoadmapId],
      );
      const nextIndex = (indexResult.rows[0]?.max_index ?? -1) + 1;

      const now = Date.now();
      const itemId = uid("rit");

      // Move the item
      await query(
        "DELETE FROM roadmap_items WHERE roadmap_id = $1 AND model_id = $2",
        [fromRoadmapId, modelId],
      );

      await query(
        "INSERT INTO roadmap_items (id, roadmap_id, model_id, model_name, quantity, added_at, item_index, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [
          itemId,
          toRoadmapId,
          modelId,
          model_name,
          quantity,
          now,
          nextIndex,
          now,
          now,
        ],
      );
    }

    broadcastChange({ type: "roadmaps_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error moving model between roadmaps:", error);
    res.status(500).json({ error: "Failed to move model between roadmaps" });
  }
};
