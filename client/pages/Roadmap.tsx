import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Pencil, ChevronUp, ChevronDown, ArrowRight, X, Check, Map } from "lucide-react";
import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { useRoadmaps } from "@/context/RoadmapContext";

// Simple Modal Component
function SimpleModal({ open, onOpenChange, title, children, footer }: any) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
        {footer && (
          <div className="border-t p-4 sm:p-6 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

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

  const eligibleOrders = useMemo(() => {
    return pipeline.orders.filter((o) => {
      if (o.currentStepIndex >= o.steps.length) return false;

      // Check if model has pending job work (exclude these)
      const hasPendingJobWork =
        ((o as any).jobWorkIds || []).length > 0 ||
        (o.jobWorkAssignments || []).some((a) => a.status === "pending");
      if (hasPendingJobWork) return false;

      if (o.currentStepIndex < 0) return true;
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
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  };

  const handleAddSelectedToRoadmap = () => {
    if (!openFor) return;
    for (const id of selectedModels) addModelToRoadmap(openFor, id);
    setOpenFor(null);
    setSelectedModels([]);
  };

  const handleSaveTitle = (id: string) => {
    renameRoadmap(id, titleDraft || roadmaps.find(r => r.id === id)?.title || "");
    setEditingTitleId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Map className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  Roadmaps
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {roadmaps.length} active roadmap{roadmaps.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleAddRoadmap}
              className="h-10 sm:h-11 px-3 sm:px-6 bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Roadmap</span>
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {roadmaps.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 sm:p-16 text-center shadow-sm">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 shadow-sm">
                <Map className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                No roadmaps yet
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Create your first roadmap to organize production models
              </p>
              <Button onClick={handleAddRoadmap} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Roadmap
              </Button>
            </div>
          </div>
        )}

        {/* Roadmaps Grid */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {roadmaps.map((r) => (
            <Card key={r.id} className="overflow-hidden shadow-lg border-slate-200 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6">
                {editingTitleId === r.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      className="bg-white text-black h-10 flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveTitle(r.id);
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveTitle(r.id)}
                      variant="secondary"
                      className="h-10"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTitleId(null)}
                      className="h-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                        {r.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white text-base sm:text-lg font-semibold truncate">
                          {r.title}
                        </CardTitle>
                        <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                          {r.items.length} model{r.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openAddModels(r.id)}
                        className="h-9 text-xs sm:text-sm"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Add Models</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditingTitleId(r.id);
                          setTitleDraft(r.title);
                        }}
                        className="h-9 w-9 bg-white hover:bg-white/90 text-slate-900"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => setDeleteConfirmId(r.id)}
                        className="h-9 w-9 bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {r.items.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 sm:p-8 text-center bg-slate-50/50">
                    <div className="text-sm text-slate-600 mb-3">
                      No models added yet
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => openAddModels(r.id)}
                      className="h-9 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Add Models
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {r.items.map((it, idx) => (
                      <div
                        key={it.id || `${r.id}-${it.modelId}-${idx}`}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                            {it.modelName} ({it.quantity})
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => moveModelWithinRoadmap(r.id, it.modelId, idx - 1)}
                            disabled={idx === 0}
                            className="h-8 w-8 hover:bg-slate-100"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => moveModelWithinRoadmap(r.id, it.modelId, idx + 1)}
                            disabled={idx === r.items.length - 1}
                            className="h-8 w-8 hover:bg-slate-100"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setMoveItem({ fromRoadmapId: r.id, modelId: it.modelId })}
                            className="h-8 w-8 hover:bg-blue-50 text-blue-600"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeModelFromRoadmap(r.id, it.modelId)}
                            className="h-8 w-8 hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add Models Modal */}
      <SimpleModal
        open={openFor !== null}
        onOpenChange={(v: boolean) => !v && setOpenFor(null)}
        title="Add Models"
        footer={
          <div className="flex items-center gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpenFor(null)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleAddSelectedToRoadmap} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700">
              Add Selected ({selectedModels.length})
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {eligibleOrders.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-600">
              No models available to add
            </div>
          ) : (
            eligibleOrders.map((o) => (
              <label
                key={o.id}
                className="flex items-center gap-3 p-3 sm:p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Checkbox
                  checked={selectedModels.includes(o.id)}
                  onCheckedChange={() => toggleModelSelection(o.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm sm:text-base text-slate-900 truncate">
                    {o.modelName}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Qty: {o.quantity}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </SimpleModal>

      {/* Create Roadmap Modal */}
      <SimpleModal
        open={showCreateModal}
        onOpenChange={(v: boolean) => !v && setShowCreateModal(false)}
        title="Create New Roadmap"
        footer={
          <div className="flex items-center gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              onClick={() => {
                createRoadmap(newRoadmapTitle || undefined);
                setShowCreateModal(false);
              }}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            >
              Create Roadmap
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-900 mb-2 block">
              Roadmap Name
            </label>
            <Input
              value={newRoadmapTitle}
              onChange={(e) => setNewRoadmapTitle(e.target.value)}
              placeholder={`Roadmap ${roadmaps.length + 1}`}
              className="h-11"
              autoFocus
            />
          </div>
        </div>
      </SimpleModal>

      {/* Move Model Modal */}
      <SimpleModal
        open={moveItem !== null}
        onOpenChange={(v: boolean) => !v && setMoveItem(null)}
        title="Move Model"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setMoveItem(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {moveItem && (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Choose destination roadmap
              </p>
              <div className="space-y-2">
                {roadmaps.filter((rr) => rr.id !== moveItem.fromRoadmapId).length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-600">
                    No other roadmaps available
                  </div>
                ) : (
                  roadmaps
                    .filter((rr) => rr.id !== moveItem.fromRoadmapId)
                    .map((rr) => (
                      <div
                        key={rr.id}
                        className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="font-medium text-sm sm:text-base text-slate-900 truncate flex-1">
                          {rr.title}
                        </div>
                        <Button
                          onClick={() => {
                            moveModelToRoadmap(moveItem.fromRoadmapId, rr.id, moveItem.modelId);
                            setMoveItem(null);
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                        >
                          Move Here
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </div>
      </SimpleModal>

      {/* Delete Confirmation Modal */}
      <SimpleModal
        open={deleteConfirmId !== null}
        onOpenChange={(v: boolean) => !v && setDeleteConfirmId(null)}
        title="Delete Roadmap"
        footer={
          <div className="flex items-center gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) deleteRoadmap(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this roadmap? This action cannot be undone.
          </p>
          {deleteConfirmId && (
            <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-900">
                {roadmaps.find((r) => r.id === deleteConfirmId)?.title}
              </p>
            </div>
          )}
        </div>
      </SimpleModal>
    </div>
  );
}
