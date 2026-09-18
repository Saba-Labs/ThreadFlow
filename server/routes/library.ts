import type { RequestHandler } from "express";
import { query } from "../db";
import { broadcastChange } from "../events";

function uid() {
  return `library_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const getLibraryImages: RequestHandler = async (_req, res) => {
  try {
    const result = await query(
      "SELECT id, name, image_data, created_at FROM library_images ORDER BY created_at DESC",
    );
    res.json(
      result.rows.map((image: any) => ({
        id: image.id,
        name: image.name,
        imageData: image.image_data,
        createdAt: image.created_at,
      })),
    );
  } catch (error) {
    console.error("Error fetching library images:", error);
    res.status(500).json({ error: "Failed to fetch library images" });
  }
};

export const createLibraryImage: RequestHandler = async (req, res) => {
  try {
    const { name, imageData } = req.body;
    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({ error: "imageData is required" });
    }

    const id = uid();
    const now = Date.now();
    await query(
      "INSERT INTO library_images (id, name, image_data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
      [id, String(name || "Untitled image").trim(), imageData, now, now],
    );
    broadcastChange({ type: "library_updated" });
    res.json({ success: true, id });
  } catch (error) {
    console.error("Error creating library image:", error);
    res.status(500).json({ error: "Failed to save library image" });
  }
};

export const renameLibraryImage: RequestHandler = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "Name is required" });

    await query(
      "UPDATE library_images SET name = $1, updated_at = $2 WHERE id = $3",
      [name, Date.now(), req.params.id],
    );
    broadcastChange({ type: "library_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error renaming library image:", error);
    res.status(500).json({ error: "Failed to rename library image" });
  }
};

export const deleteLibraryImage: RequestHandler = async (req, res) => {
  try {
    await query("DELETE FROM library_images WHERE id = $1", [req.params.id]);
    broadcastChange({ type: "library_updated" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting library image:", error);
    res.status(500).json({ error: "Failed to delete library image" });
  }
};
