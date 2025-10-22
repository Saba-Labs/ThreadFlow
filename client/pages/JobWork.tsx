import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";
import {
  useJobWorks,
  getJobWorks,
  addJobWork,
  updateJobWork,
  deleteJobWork,
  type JobWork,
} from "@/lib/jobWorks";
import { Trash2, Save, Plus, Pencil } from "lucide-react";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";

export default function JobWork() {
  const list = useJobWorks();
  const pipeline = useProductionPipeline();

  const [local, setLocal] = useState<JobWork[]>(() => getJobWorks());

  useEffect(() => {
    setLocal(list);
  }, [list]);

  // Modal state for add / edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobWork | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (!modalOpen) {
      setEditing(null);
      setName("");
      setDesc("");
    }
  }, [modalOpen]);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setDesc("");
    setModalOpen(true);
  };

  const openEdit = (j: JobWork) => {
    setEditing(j);
    setName(j.name);
    setDesc(j.description);
    setModalOpen(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      updateJobWork(editing.id, { name: trimmed, description: desc.trim() });
    } else {
      addJobWork({ name: trimmed, description: desc.trim() });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    // simple delete
    deleteJobWork(id);
  };

  const saveAll = () => {
    const cleaned = local.map((j) => ({
      ...j,
      name: j.name.trim(),
      description: j.description.trim(),
    }));
    // reuse setJobWorks through update functions by replacing store
    // jobWorks lib exposes setJobWorks only internally here; to persist we update each
    cleaned.forEach((j) =>
      updateJobWork(j.id, { name: j.name, description: j.description }),
    );
  };

  // helper: return unique model names that reference this job work id
  const linkedModelsFor = (jwId: string) => {
    const orders = pipeline.orders || [];
    const set = new Set<string>();
    for (const o of orders) {
      if (
        (o as any).jobWorkIds &&
        ((o as any).jobWorkIds as string[]).includes(jwId)
      ) {
        set.add(o.modelName);
      }
    }
    return Array.from(set);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job Work</h1>
        <p className="text-muted-foreground max-w-prose">
          Create, edit, and delete Job Work items.
        </p>
      </div>

      {/* All Job Works list (card-style) */}
      <div className="">
        <div className="space-y-3">
          {local.map((j) => {
            const linked = linkedModelsFor(j.id);
            return (
              <div
                key={j.id}
                className="p-4 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {j.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {linked.length > 0 ? (
                      // Show detailed linked orders with status and actions
                      pipeline.orders
                        .filter((o) => (o.jobWorkIds || []).includes(j.id))
                        .map((o) => {
                          const jobStepIndex = o.steps.findIndex(
                            (st) => st.kind === "job",
                          );
                          const jobStep =
                            jobStepIndex >= 0 ? o.steps[jobStepIndex] : null;
                          const completed = jobStep?.status === "completed";
                          return (
                            <div
                              key={o.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <div
                                className={`font-medium ${completed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                              >
                                {o.modelName}{" "}
                                <span className="text-muted-foreground">
                                  ({o.quantity})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {!completed && jobStepIndex >= 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      pipeline.updateStepStatus(
                                        o.id,
                                        jobStepIndex,
                                        { status: "completed" },
                                      );
                                      pipeline.moveToNextStep(o.id);
                                    }}
                                  >
                                    Mark complete
                                  </Button>
                                )}
                                {completed && (
                                  <div className="text-sm text-muted-foreground">
                                    Completed
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="italic text-xs text-gray-400">
                        No models linked
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Edit"
                    aria-label="Edit"
                    onClick={() => openEdit(j)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(j.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {local.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">
              No job works yet.
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        aria-label="Add Job Work"
        onClick={openAdd}
        className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 shadow-lg hover:bg-primary/90 focus:outline-none"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Job Work</span>
      </button>

      {/* Modal for add/edit */}
      <SimpleModal
        open={modalOpen}
        onOpenChange={(v) => setModalOpen(v)}
        title={editing ? "Edit Job Work" : "Add Job Work"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>{editing ? "Save" : "Add"}</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
      </SimpleModal>
    </div>
  );
}
