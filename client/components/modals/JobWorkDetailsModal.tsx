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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");
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
        <div className="space-y-6">
          {/* Pending Assignments */}
          {pendingAssignments.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Pending Assignments
              </div>
              <div className="space-y-2">
                {pendingAssignments.map((assignment) => (
                  <div
                    key={assignment.jobWorkId}
                    className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {getJobWorkName(assignment.jobWorkId)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Quantity: {assignment.quantity}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          Pickup: {formatDate(assignment.pickupDate)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditPickupDate(assignment)}
                          title="Edit date"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-yellow-200 dark:border-yellow-800">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleOpenCompleteDialog(
                            assignment.jobWorkId,
                            assignment.pickupDate
                          )
                        }
                        className="flex-1"
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
                ))}
              </div>
            </div>
          )}

          {/* Completed Assignments */}
          {completedAssignments.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Completed
              </div>
              <div className="space-y-2">
                {completedAssignments.map((assignment) => (
                  <div
                    key={assignment.jobWorkId}
                    className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {getJobWorkName(assignment.jobWorkId)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Quantity: {assignment.quantity}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          Pickup: {formatDate(assignment.pickupDate)}
                        </div>
                        {assignment.completionDate && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Completed:{" "}
                            {formatDate(assignment.completionDate)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                        ✓ Done
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assignments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No job work assignments yet.
            </div>
          )}
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
            <AlertDialogTitle>Mark as Completed</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm the completion date for this job work assignment.
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
              Complete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
