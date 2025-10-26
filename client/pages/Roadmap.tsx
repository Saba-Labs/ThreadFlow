import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { useRoadmaps } from "@/context/RoadmapContext";
import SimpleModal from "@/components/ui/SimpleModal";
import { Checkbox } from "@/components/ui/checkbox";

export default function RoadmapPage() {
  const {
    roadmaps,
    createRoadmap,
    deleteRoadmap,
    renameRoadmap,
    removeModelFromRoadmap,
    addModelToRoadmap,
    moveModelWithinRoadmap,
    moveModelToRoadmap,
  } = useRoadmaps();
  const pipeline = useProductionPipeline();
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [moveItem, setMoveItem] = useState<{
    fromRoadmapId: string;
    modelId: string;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoadmapTitle, setNewRoadmapTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const ordersById = useMemo(() => {
    const map: Record<string, (typeof pipeline.orders)[number]> = {};
    for (const o of pipeline.orders) map[o.id] = o;
    return map;
  }, [pipeline.orders]);

  const eligibleOrders = useMemo(() => {
    return pipeline.orders.filter((o) => {
      // Exclude completed orders (beyond last step)
      if (o.currentStepIndex >= o.steps.length) return false;

      // Exclude any orders linked to Job Work (either by ids or assignments)
      const hasJobWork =
        ((o as any).jobWorkIds || []).length > 0 ||
        (o.jobWorkAssignments || []).length > 0;
      if (hasJobWork) return false;

      // Include orders that are out of path (-1)
      if (o.currentStepIndex < 0) return true;

      // Otherwise include only if current step is hold or running
      const s = o.steps[o.currentStepIndex]?.status || "hold";
      return s === "hold" || s === "running";
    });
  }, [pipeline.orders]);

  const handleAddRoadmap = () => {
    setNewRoadmapTitle("");
    setShowCreateModal(true);
  };

  const openAddModels = (roadmapId: string) => {
    setSelectedModels([]);
    setOpenFor(roadmapId);
  };

  const toggleModelSelection = (id: string) => {
    setSelectedModels((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  };

  const handleAddSelectedToRoadmap = () => {
    if (!openFor) return;
    for (const id of selectedModels) addModelToRoadmap(openFor, id);
    setOpenFor(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Roadmap</h1>
        <Button onClick={handleAddRoadmap}>
          <Plus className="h-4 w-4 mr-2" /> Add Roadmap
        </Button>
      </div>

      {roadmaps.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No roadmaps yet. Click "Add Roadmap" to create one.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roadmaps.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <div className="w-full flex items-center justify-between gap-4">
              {editingTitleId === r.id ? (
                <form
                  className="flex items-center gap-2 w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    renameRoadmap(r.id, titleDraft || r.title);
                    setEditingTitleId(null);
                  }}
                >
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="bg-white text-black h-8"
                    autoFocus
                  />
                  <Button size="sm" type="submit" variant="secondary">
                    Save
                  </Button>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                      {r.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg leading-tight">
                        {r.title}
                      </CardTitle>
                      <div className="text-xs text-white/80">Created {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setEditingTitleId(r.id);
                        setTitleDraft(r.title);
                      }}
                      aria-label="Rename"
                      title="Rename"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => setDeleteConfirmId(r.id)}
                      aria-label="Delete roadmap"
                      title="Delete roadmap"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardHeader>

            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Models (only Running or Hold)
                </div>
                <Button size="sm" onClick={() => openAddModels(r.id)}>
                  Add models
                </Button>
              </div>

              {r.items.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No models added yet. Use "Add models" to pick from All Models
                  (running or hold).
                </div>
              ) : (
                <div className="divide-y">
                  {r.items.map((it) => {
                    const o = ordersById[it.modelId];
                    return (
                      <div
                        key={it.modelId}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <div className="font-medium">
                            {o ? o.modelName : "Model removed"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {o ? `Qty: ${o.quantity}` : it.modelId}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const idx = r.items.findIndex(
                                (x) => x.modelId === it.modelId,
                              );
                              if (idx > 0)
                                moveModelWithinRoadmap(
                                  r.id,
                                  it.modelId,
                                  idx - 1,
                                );
                            }}
                            title="Move up"
                            aria-label="Move up"
                          >
                            ▲
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const idx = r.items.findIndex(
                                (x) => x.modelId === it.modelId,
                              );
                              if (idx >= 0 && idx < r.items.length - 1)
                                moveModelWithinRoadmap(
                                  r.id,
                                  it.modelId,
                                  idx + 1,
                                );
                            }}
                            title="Move down"
                            aria-label="Move down"
                          >
                            ▼
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setMoveItem({
                                fromRoadmapId: r.id,
                                modelId: it.modelId,
                              })
                            }
                            title="Move to another roadmap"
                            aria-label="Move to another roadmap"
                          >
                            Move
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              removeModelFromRoadmap(r.id, it.modelId)
                            }
                            aria-label="Remove"
                            title="Remove"
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <SimpleModal
      open={openFor !== null}
      onOpenChange={(v) => !v && setOpenFor(null)}
      title="Add models from All Models"
      footer={
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpenFor(null)}>
            Cancel
          </Button>
          <Button onClick={handleAddSelectedToRoadmap}>Add selected</Button>
        </div>
      }
    >
      <div className="space-y-2 max-h-80 overflow-auto">
        {eligibleOrders.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No running or hold models available.
          </div>
        ) : (
          eligibleOrders.map((o) => (
            <label
              key={o.id}
              className="flex items-center justify-between p-2 border-b"
            >
              <div>
                <div className="font-medium">{o.modelName}</div>
                <div className="text-xs text-muted-foreground">
                  Qty: {o.quantity}
                </div>
              </div>
              <div>
                <Checkbox
                  checked={selectedModels.includes(o.id)}
                  onCheckedChange={() => toggleModelSelection(o.id)}
                />
              </div>
            </label>
          ))
        )}
      </div>
    </SimpleModal>

    {/* Create Roadmap Modal */}
    <SimpleModal
      open={showCreateModal}
      onOpenChange={(v) => !v && setShowCreateModal(false)}
      title="Create Roadmap"
      footer={
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              createRoadmap(newRoadmapTitle || undefined);
              setShowCreateModal(false);
            }}
          >
            Create
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Roadmap name</label>
          <Input
            value={newRoadmapTitle}
            onChange={(e) => setNewRoadmapTitle(e.target.value)}
            placeholder={`Roadmap ${roadmaps.length + 1}`}
            className="mt-2"
            autoFocus
          />
        </div>
      </div>
    </SimpleModal>

      <SimpleModal
        open={moveItem !== null}
        onOpenChange={(v) => !v && setMoveItem(null)}
        title="Move model to another roadmap"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" onClick={() => setMoveItem(null)}>
              Cancel
            </Button>
            <Button onClick={() => setMoveItem(null)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-2">
          {moveItem ? (
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Choose destination roadmap
              </div>
              <div className="space-y-2">
                {roadmaps.filter((rr) => rr.id !== moveItem.fromRoadmapId)
                  .length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No other roadmaps available.
                  </div>
                ) : (
                  roadmaps
                    .filter((rr) => rr.id !== moveItem.fromRoadmapId)
                    .map((rr) => (
                      <div
                        key={rr.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="font-medium">{rr.title}</div>
                        <div>
                          <Button
                            onClick={() => {
                              if (!moveItem) return;
                              moveModelToRoadmap(
                                moveItem.fromRoadmapId,
                                rr.id,
                                moveItem.modelId,
                              );
                              setMoveItem(null);
                            }}
                          >
                            Move here
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </SimpleModal>

      {/* Delete confirmation modal */}
      <SimpleModal
        open={deleteConfirmId !== null}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
        title="Delete Roadmap"
        footer={
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) deleteRoadmap(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this roadmap? This action cannot be undone.
          </p>
          <div className="text-sm">
            <strong>
              {deleteConfirmId ? roadmaps.find((r) => r.id === deleteConfirmId)?.title : ""}
            </strong>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
}
