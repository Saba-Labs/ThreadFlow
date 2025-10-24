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
    new Date().toISOString().split("T")[0]
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleEditPickupDate = (assignment: JobWorkAssignment) => {
    setEditingId(assignment.jobWorkId);
    setEditDate(new Date(assignment.pickupDate).toISOString().split("T")[0]);
  };

  const handleSaveEditDate = () => {
    if (!editingId) return;

    const updated = assignments.map((a) =>
      a.jobWorkId === editingId
        ? {
            ...a,
            pickupDate: new Date(editDate).getTime(),
          }
        : a
    );
    onUpdateAssignments(updated);
    setEditingId(null);
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
  const completedAssignments = assignments.filter((a) => a.status === "completed");

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
                    Model Name
                  </th>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Qty
                  </th>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Pickup Date
                  </th>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Delivery Date
                  </th>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Status
                  </th>
                  <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
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
                      <td className="p-3 text-gray-900 dark:text-gray-100 font-medium">
                        {modelName}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {assignment.quantity}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {formatDate(assignment.pickupDate)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {assignment.completionDate
                          ? formatDate(assignment.completionDate)
                          : "—"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            assignment.status === "completed"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          }`}
                        >
                          {assignment.status === "completed"
                            ? "✓ Completed"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditPickupDate(assignment)}
                            title="Edit pickup date"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {assignment.status === "pending" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                handleOpenCompleteDialog(
                                  assignment.jobWorkId,
                                  assignment.pickupDate
                                )
                              }
                              title="Mark complete"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <span className="text-sm font-medium">✓</span>
                            </Button>
                          )}
                          {assignment.status === "completed" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                handleOpenCompleteDialog(
                                  assignment.jobWorkId,
                                  assignment.pickupDate
                                )
                              }
                              title="Edit delivery date"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SimpleModal>

      {/* Edit Pickup Date Modal */}
      <SimpleModal
        open={editingId !== null}
        onOpenChange={(v) => !v && setEditingId(null)}
        title="Edit Pickup Date"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditDate}>Save</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pickup Date
          </label>
          <Input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
        </div>
      </SimpleModal>

      {/* Complete Assignment Dialog */}
      <AlertDialog open={completingId !== null} onOpenChange={(v) => {
        if (!v) setCompletingId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {assignments.find((a) => a.jobWorkId === completingId)?.status === "completed"
                ? "Edit Delivery Date"
                : "Mark as Completed"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {assignments.find((a) => a.jobWorkId === completingId)?.status === "completed"
                ? "Update the delivery date for this completed assignment."
                : "Confirm the delivery date for this job work assignment."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Delivery Date
            </label>
            <Input
              type="date"
              value={completeDate}
              onChange={(e) => setCompleteDate(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteAssignment}>
              {assignments.find((a) => a.jobWorkId === completingId)?.status === "completed"
                ? "Update"
                : "Complete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
