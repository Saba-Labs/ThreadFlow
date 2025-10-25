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
  const { roadmaps, createRoadmap, deleteRoadmap, renameRoadmap, removeModelFromRoadmap, addModelToRoadmap } = useRoadmaps();
  const pipeline = useProductionPipeline();
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState<string>("");
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const ordersById = useMemo(() => {
    const map: Record<string, (typeof pipeline.orders)[number]> = {};
    for (const o of pipeline.orders) map[o.id] = o;
    return map;
  }, [pipeline.orders]);

  const eligibleOrders = useMemo(() => {
    return pipeline.orders.filter((o) => {
      if (o.currentStepIndex < 0 || o.currentStepIndex >= o.steps.length) return false;
      const s = o.steps[o.currentStepIndex]?.status || "hold";
      return s === "hold" || s === "running";
    });
  }, [pipeline.orders]);

  const handleAddRoadmap = () => createRoadmap();

  const openAddModels = (roadmapId: string) => {
    setSelectedModels([]);
    setOpenFor(roadmapId);
  };

  const toggleModelSelection = (id: string) => {
    setSelectedModels((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
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
        <div className="text-sm text-muted-foreground">No roadmaps yet. Click "Add Roadmap" to create one.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roadmaps.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardHeader className="bg-blue-600 text-white">
              <div className="flex items-center justify-between">
                {editingTitleId === r.id ? (
                  <form
                    className="flex items-center gap-2 w-full"
                    onSubmit={(e) => {
                      e.preventDefault();
                      renameRoadmap(r.id, titleDraft || r.title);
                      setEditingTitleId(null);
                    }}
                  >
                    <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} className="bg-white text-black h-8" autoFocus />
                    <Button size="sm" type="submit" variant="secondary">
                      Save
                    </Button>
                  </form>
                ) : (
                  <>
                    <CardTitle className="text-white text-lg">{r.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => {
                          setEditingTitleId(r.id);
                          setTitleDraft(r.title);
                        }}
                        aria-label="Rename"
                        title="Rename"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => deleteRoadmap(r.id)} aria-label="Delete roadmap" title="Delete roadmap">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Models (only Running or Hold)</div>
                <Button size="sm" onClick={() => openAddModels(r.id)}>
                  Add models
                </Button>
              </div>

              {r.items.length === 0 ? (
                <div className="text-sm text-muted-foreground">No models added yet. Use "Add models" to pick from All Models (running or hold).</div>
              ) : (
                <div className="divide-y">
                  {r.items.map((it) => {
                    const o = ordersById[it.modelId];
                    return (
                      <div key={it.modelId} className="flex items-center justify-between py-3">
                        <div>
                          <div className="font-medium">{o ? o.modelName : "Model removed"}</div>
                          <div className="text-xs text-muted-foreground">{o ? `Qty: ${o.quantity}` : it.modelId}</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeModelFromRoadmap(r.id, it.modelId)} aria-label="Remove" title="Remove" className="text-red-600 hover:text-red-700">
                          Remove
                        </Button>
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
            <div className="text-sm text-muted-foreground">No running or hold models available.</div>
          ) : (
            eligibleOrders.map((o) => (
              <label key={o.id} className="flex items-center justify-between p-2 border-b">
                <div>
                  <div className="font-medium">{o.modelName}</div>
                  <div className="text-xs text-muted-foreground">Qty: {o.quantity}</div>
                </div>
                <div>
                  <Checkbox checked={selectedModels.includes(o.id)} onCheckedChange={() => toggleModelSelection(o.id)} />
                </div>
              </label>
            ))
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
