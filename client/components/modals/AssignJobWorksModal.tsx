import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import SimpleModal from "@/components/ui/SimpleModal";
import { useJobWorks } from "@/lib/jobWorks";
import type { JobWorkAssignment } from "@/hooks/useProductionPipeline";
import { Calendar } from "lucide-react";

interface AssignJobWorksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  modelName: string;
  totalQuantity: number;
  onAssign: (assignments: JobWorkAssignment[]) => void;
}

export default function AssignJobWorksModal({
  open,
  onOpenChange,
  orderId,
  modelName,
  totalQuantity,
  onAssign,
}: AssignJobWorksModalProps) {
  const jobWorks = useJobWorks();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickupDate, setPickupDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Auto-calculate equal split when job works are selected
  const quantitiesAfterSplit = useMemo(() => {
    if (selectedIds.length === 0) return quantities;

    const perJobWork = Math.floor(totalQuantity / selectedIds.length);
    const remainder = totalQuantity % selectedIds.length;

    const result: Record<string, number> = { ...quantities };
    selectedIds.forEach((id, idx) => {
      result[id] = perJobWork + (idx < remainder ? 1 : 0);
    });
    return result;
  }, [selectedIds, totalQuantity, quantities]);

  const handleSelectJobWork = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleQuantityChange = (id: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.floor(value)),
    }));
  };

  const totalAssignedQty = Object.values(quantitiesAfterSplit).reduce(
    (a, b) => a + b,
    0
  );

  const handleAssign = () => {
    const assignments: JobWorkAssignment[] = selectedIds.map((jwId) => ({
      jobWorkId: jwId,
      quantity: quantitiesAfterSplit[jwId] || 0,
      pickupDate: new Date(pickupDate).getTime(),
      status: "pending",
    }));

    onAssign(assignments);
    handleClose();
  };

  const handleClose = () => {
    setSelectedIds([]);
    setQuantities({});
    setPickupDate(new Date().toISOString().split("T")[0]);
    onOpenChange(false);
  };

  return (
    <SimpleModal
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      title={`Assign "${modelName}" to Job Works`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedIds.length === 0 || totalAssignedQty === 0}
          >
            Assign
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Pickup Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pickup Date
          </label>
          <Input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
        </div>

        {/* Job Works Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Assign to Job Works</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {jobWorks.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 rounded bg-muted/20">
                No job works yet. Create them in Job Work section.
              </div>
            ) : (
              jobWorks.map((jw) => (
                <div
                  key={jw.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-muted/30 transition"
                >
                  <Checkbox
                    id={`assign-jw-${jw.id}`}
                    checked={selectedIds.includes(jw.id)}
                    onCheckedChange={(checked) =>
                      handleSelectJobWork(jw.id, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`assign-jw-${jw.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {jw.name}
                    </label>
                    {jw.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {jw.description}
                      </p>
                    )}
                    {selectedIds.includes(jw.id) && (
                      <div className="mt-2">
                        <label className="text-xs text-muted-foreground">
                          Quantity for this job work
                        </label>
                        <Input
                          type="number"
                          min={0}
                          value={quantitiesAfterSplit[jw.id] || 0}
                          onChange={(e) =>
                            handleQuantityChange(jw.id, Number(e.target.value))
                          }
                          className="h-8 mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary */}
        {selectedIds.length > 0 && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 space-y-1">
            <div className="text-sm font-medium">Summary</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Selected: {selectedIds.length} job work(s)
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total quantity: {totalAssignedQty} / {totalQuantity}
            </div>
            {totalAssignedQty !== totalQuantity && (
              <div className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Total assigned ({totalAssignedQty}) doesn't match available
                quantity ({totalQuantity})
              </div>
            )}
          </div>
        )}
      </div>
    </SimpleModal>
  );
}
