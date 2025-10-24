import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";
import { useJobWorks } from "@/lib/jobWorks";
import type { JobWorkAssignment } from "@/hooks/useProductionPipeline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Trash2, Edit2 } from "lucide-react";

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
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completeDate, setCompleteDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

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
        return {
          ...a,
          completionDate: new Date(editValue).getTime(),
          status: a.status === "pending" ? "completed" : a.status,
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

  const handleOpenCompleteDialog = (jwId: string, pickupDate: number) => {
    setCompletingId(jwId);
    setCompleteDate(new Date().toISOString().split("T")[0]);
  };

  const handleCompleteAssignment = () => {
    if (!completingId) return;
    onComplete(completingId, new Date(completeDate).getTime());
    setCompletingId(null);
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Pickup Date
                  </th>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Model Name
                  </th>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Delivery Date
                  </th>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No job work assignments yet.
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => (
                    <tr
                      key={assignment.jobWorkId}
                      className={`border-t border-gray-200 dark:border-gray-700 ${
                        assignment.status === "completed"
                          ? "bg-green-50 dark:bg-green-900/10"
                          : "bg-yellow-50 dark:bg-yellow-900/10"
                      }`}
                    >
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {editingField?.jobWorkId === assignment.jobWorkId &&
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
                            className="h-7 text-xs"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              handleEditField(assignment, "pickup")
                            }
                            className="hover:underline text-left"
                          >
                            {formatDate(assignment.pickupDate)}
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-gray-900 dark:text-gray-100 font-medium">
                        <span>{modelName}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {" "}
                          ({assignment.quantity})
                        </span>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {editingField?.jobWorkId === assignment.jobWorkId &&
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
                            className="h-7 text-xs"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              handleEditField(assignment, "delivery")
                            }
                            className="hover:underline text-left"
                          >
                            {assignment.completionDate
                              ? formatDate(assignment.completionDate)
                              : "—"}
                          </button>
                        )}
                      </td>
                      <td className="p-3">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SimpleModal>
    </>
  );
}
