import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";
import { useJobWorks } from "@/lib/jobWorks";
import type { JobWorkAssignment } from "@/hooks/useProductionPipeline";
import { Trash2, Edit2, Check } from "lucide-react";

interface JobWorkDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelName: string;
  modelQuantity: number;
  assignments: JobWorkAssignment[];
  onUpdateAssignments: (assignments: JobWorkAssignment[]) => void;
  onComplete: (jobWorkId: string, completionDate: number) => void;
}

export default function JobWorkDetailsModal({
  open,
  onOpenChange,
  modelName,
  modelQuantity,
  assignments,
  onUpdateAssignments,
  onComplete,
}: JobWorkDetailsModalProps) {
  const jobWorks = useJobWorks();
  const [editingField, setEditingField] = useState<{
    jobWorkId: string;
    field: "pickup" | "delivery" | "quantity";
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditField = (
    assignment: JobWorkAssignment,
    field: "pickup" | "delivery" | "quantity",
  ) => {
    setEditingField({ jobWorkId: assignment.jobWorkId, field });
    if (field === "pickup") {
      setEditValue(new Date(assignment.pickupDate).toISOString().split("T")[0]);
    } else if (field === "delivery") {
      setEditValue(
        assignment.completionDate
          ? new Date(assignment.completionDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      );
    } else {
      setEditValue(String(assignment.quantity));
    }
  };

  const handleSaveEditField = () => {
    if (!editingField) return;

    const updated = assignments.map((a) => {
      if (a.jobWorkId !== editingField.jobWorkId) return a;

      if (editingField.field === "pickup") {
        return {
          ...a,
          pickupDate: new Date(editValue).getTime(),
        };
      } else if (editingField.field === "delivery") {
        // If delivery date is empty, revert to pending status
        if (!editValue) {
          return {
            ...a,
            completionDate: undefined,
            status: "pending",
          };
        }
        return {
          ...a,
          completionDate: new Date(editValue).getTime(),
          status: "completed",
        };
      } else {
        return {
          ...a,
          quantity: Math.max(0, Math.floor(Number(editValue) || 0)),
        };
      }
    });

    onUpdateAssignments(updated);
    setEditingField(null);
  };

  const handleCompleteAssignment = (jwId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onComplete(jwId, today.getTime());
  };

  const handleRemoveAssignment = (jwId: string) => {
    const filtered = assignments.filter((a) => a.jobWorkId !== jwId);
    onUpdateAssignments(filtered);
  };

  const getJobWorkName = (jwId: string) => {
    return jobWorks.find((j) => j.id === jwId)?.name || "Unknown";
  };

  const pendingAssignments = assignments.filter((a) => a.status === "pending");
  const completedAssignments = assignments.filter(
    (a) => a.status === "completed",
  );

  return (
    <>
      <SimpleModal
        open={open}
        onOpenChange={onOpenChange}
        title={`Job Work Assignments — ${modelName}`}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No job work assignments yet.
            </div>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.jobWorkId}
                className={`rounded-lg border p-4 ${
                  assignment.status === "completed"
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                    : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Job Work
                      </div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {getJobWorkName(assignment.jobWorkId)}
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          ({assignment.quantity})
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (editingCardId === assignment.jobWorkId) {
                          // Save and exit edit mode
                          if (editingField) {
                            handleSaveEditField();
                          }
                          setEditingCardId(null);
                        } else {
                          // Enter edit mode
                          setEditingCardId(assignment.jobWorkId);
                        }
                      }}
                      title={editingCardId === assignment.jobWorkId ? "Save" : "Edit"}
                    >
                      {editingCardId === assignment.jobWorkId ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Edit2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                        Pickup Date
                      </label>
                      {editingCardId === assignment.jobWorkId &&
                      editingField?.jobWorkId === assignment.jobWorkId &&
                      editingField.field === "pickup" ? (
                        <Input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEditField}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditField();
                            if (e.key === "Escape") setEditingField(null);
                          }}
                          autoFocus
                          className="h-8 text-sm"
                        />
                      ) : editingCardId === assignment.jobWorkId ? (
                        <button
                          onClick={() =>
                            handleEditField(assignment, "pickup")
                          }
                          className="w-full text-left px-2 py-1 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                        >
                          {formatDate(assignment.pickupDate)}
                        </button>
                      ) : (
                        <div className="px-2 py-1 text-gray-900 dark:text-gray-100">
                          {formatDate(assignment.pickupDate)}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                        Delivery Date
                      </label>
                      {editingCardId === assignment.jobWorkId &&
                      editingField?.jobWorkId === assignment.jobWorkId &&
                      editingField.field === "delivery" ? (
                        <Input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEditField}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditField();
                            if (e.key === "Escape") setEditingField(null);
                          }}
                          autoFocus
                          className="h-8 text-sm"
                        />
                      ) : editingCardId === assignment.jobWorkId ? (
                        <button
                          onClick={() =>
                            handleEditField(assignment, "delivery")
                          }
                          className="w-full text-left px-2 py-1 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                        >
                          {assignment.completionDate
                            ? formatDate(assignment.completionDate)
                            : "—"}
                        </button>
                      ) : (
                        <div className="px-2 py-1 text-gray-900 dark:text-gray-100">
                          {assignment.completionDate
                            ? formatDate(assignment.completionDate)
                            : "—"}
                        </div>
                      )}
                    </div>
                  </div>

                  {editingCardId === assignment.jobWorkId && (
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                        Quantity
                      </label>
                      {editingField?.jobWorkId === assignment.jobWorkId &&
                      editingField.field === "quantity" ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEditField}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditField();
                            if (e.key === "Escape") setEditingField(null);
                          }}
                          autoFocus
                          className="h-8 text-sm"
                        />
                      ) : (
                        <button
                          onClick={() =>
                            handleEditField(assignment, "quantity")
                          }
                          className="w-full text-left px-2 py-1 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                        >
                          {assignment.quantity}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        handleCompleteAssignment(assignment.jobWorkId)
                      }
                      disabled={assignment.status === "completed"}
                    >
                      Complete
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        handleRemoveAssignment(assignment.jobWorkId)
                      }
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SimpleModal>
    </>
  );
}
