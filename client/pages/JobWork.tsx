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
import { Trash2, Save, Plus, Pencil, Calendar } from "lucide-react";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useSearch } from "@/context/SearchContext";

export default function JobWork() {
  const list = useJobWorks();
  const pipeline = useProductionPipeline();
  useSwipeNavigation({
    leftPage: "/models/all",
    rightPage: "/models/all",
  });

  const [local, setLocal] = useState<JobWork[]>(() => getJobWorks());

  useEffect(() => {
    setLocal(list);
  }, [list]);

  // Modal state for add / edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobWork | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  // Modal state for viewing history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedJobWorkId, setSelectedJobWorkId] = useState<string | null>(
    null,
  );

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

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      if (editing) {
        await updateJobWork(editing.id, {
          name: trimmed,
          description: desc.trim(),
        });
      } else {
        await addJobWork({ name: trimmed, description: desc.trim() });
      }
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to save job work:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJobWork(id);
    } catch (error) {
      console.error("Failed to delete job work:", error);
    }
  };

  const saveAll = async () => {
    const cleaned = local.map((j) => ({
      ...j,
      name: j.name.trim(),
      description: j.description.trim(),
    }));
    try {
      for (const j of cleaned) {
        await updateJobWork(j.id, { name: j.name, description: j.description });
      }
    } catch (error) {
      console.error("Failed to save all job works:", error);
    }
  };

  // helper: return assignments for this job work
  const getAssignmentsForJobWork = (jwId: string) => {
    const orders = pipeline.orders || [];
    const assignments: Array<{
      orderId: string;
      modelName: string;
      quantity: number;
      pickupDate: number;
      completionDate?: number;
      status: "pending" | "completed";
    }> = [];

    for (const o of orders) {
      const jwAssignments = o.jobWorkAssignments || [];
      for (const assignment of jwAssignments) {
        if (assignment.jobWorkId === jwId) {
          assignments.push({
            orderId: o.id,
            modelName: o.modelName,
            quantity: assignment.quantity,
            pickupDate: assignment.pickupDate,
            completionDate: assignment.completionDate,
            status: assignment.status,
          });
        }
      }
    }
    return assignments;
  };

  // helper: return unique model names that reference this job work id (backward compat)
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

  const { query } = useSearch();
  const displayed = ((): typeof local => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return local;
    return local.filter((j) => {
      if (j.name.toLowerCase().includes(q)) return true;
      const linked = linkedModelsFor(j.id);
      if (linked.some((m) => m.toLowerCase().includes(q))) return true;
      // search model names in pipeline orders linked to this job work
      return pipeline.orders.some(
        (o) =>
          (o.jobWorkIds || []).includes(j.id) &&
          o.modelName.toLowerCase().includes(q),
      );
    });
  })();

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
          {displayed.map((j) => {
            const assignments = getAssignmentsForJobWork(j.id);
            const pendingAssignments = assignments.filter(
              (a) => a.status === "pending",
            );
            const completedAssignments = assignments.filter(
              (a) => a.status === "completed",
            );

            return (
              <div
                key={j.id}
                className="p-4 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-800 hover:shadow-md transition cursor-pointer"
                onClick={() => {
                  setSelectedJobWorkId(j.id);
                  setHistoryOpen(true);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {j.name}
                    </div>
                    {j.description && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {j.description}
                      </p>
                    )}

                    {/* Current Running Models */}
                    {pendingAssignments.length > 0 && (
                      <div className="space-y-1">
                        {pendingAssignments.map((a) => (
                          <div
                            key={`${a.orderId}-pending`}
                            className="text-sm flex items-center justify-between"
                          >
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              {a.modelName}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({a.quantity})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {assignments.length === 0 && (
                      <div className="italic text-xs text-gray-400">
                        No models assigned
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit"
                      aria-label="Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(j);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(j.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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

      {/* History Modal */}
      <SimpleModal
        open={historyOpen && selectedJobWorkId !== null}
        onOpenChange={(v) => setHistoryOpen(v)}
        title={`Assignment History — ${list.find((j) => j.id === selectedJobWorkId)?.name || ""}`}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {selectedJobWorkId &&
            (() => {
              const assignments = getAssignmentsForJobWork(selectedJobWorkId);
              const sortedAssignments = [...assignments].sort(
                (a, b) => b.pickupDate - a.pickupDate,
              );

              const formatDate = (timestamp: number) => {
                return new Date(timestamp).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              };

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          Pickup
                        </th>
                        <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          Model Name
                        </th>
                        <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          Quantity
                        </th>
                        <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          Delivery
                        </th>
                        <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAssignments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-4 text-center text-muted-foreground"
                          >
                            No assignment history.
                          </td>
                        </tr>
                      ) : (
                        sortedAssignments.map((a) => (
                          <tr
                            key={`${a.orderId}-${a.status}`}
                            className={`border-t border-gray-200 dark:border-gray-700 ${
                              a.status === "completed"
                                ? "bg-green-50 dark:bg-green-900/10"
                                : "bg-yellow-50 dark:bg-yellow-900/10"
                            }`}
                          >
                            <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {formatDate(a.pickupDate)}
                            </td>
                            <td className="p-3 text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                              {a.modelName}
                            </td>
                            <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {a.quantity}
                            </td>

                            <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {a.completionDate
                                ? formatDate(a.completionDate)
                                : "—"}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span
                                className={`text-xs font-semibold px-2 py-1 rounded ${
                                  a.status === "completed"
                                    ? "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100"
                                    : "bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100"
                                }`}
                              >
                                {a.status === "completed"
                                  ? "Completed"
                                  : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()}
        </div>
      </SimpleModal>
    </div>
  );
}
