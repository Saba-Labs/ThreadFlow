import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";
import {
  Scissors,
  SkipForward,
  SkipBack,
  Trash2,
  X,
  Pencil,
  CalendarDays,
  Plus,
} from "lucide-react";
import type { PathStep, WorkOrder } from "@/hooks/useProductionPipeline";
import { useMachineTypes, getMachineTypeConfig } from "@/lib/machineTypes";

interface ModelListProps {
  orders: WorkOrder[];
  onDelete: (id: string) => void;
  onNext: (id: string) => void;
  onPrev: (id: string) => void;
  onEditPath: (
    orderId: string,
    editor: (steps: PathStep[]) => PathStep[],
  ) => void;
  onSplit: (orderId: string, quantities: number[]) => void;
  onSetStepStatus: (
    orderId: string,
    stepIndex: number,
    status: "pending" | "running" | "hold" | "completed",
  ) => void;
  onToggleParallelMachine: (
    orderId: string,
    stepIndex: number,
    machineIndex: number,
  ) => void;
}

export default function ModelList(props: ModelListProps) {
  const machineTypes = useMachineTypes();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [splitForId, setSplitForId] = useState<string | null>(null);
  const [splitInputs, setSplitInputs] = useState<number[]>([0, 0]);

  const sorted = useMemo(
    () => props.orders.slice().sort((a, b) => b.createdAt - a.createdAt),
    [props.orders],
  );

  const editing = editingId
    ? sorted.find((o) => o.id === editingId) || null
    : null;
  const splitFor = splitForId
    ? sorted.find((o) => o.id === splitForId) || null
    : null;

  const handleSplit = () => {
    if (!splitForId) return;
    const validQuantities = splitInputs
      .map((q) => Math.max(0, Math.floor(q)))
      .filter((q) => q > 0);
    if (validQuantities.length === 0) return;
    props.onSplit(splitForId, validQuantities);
    setSplitForId(null);
    setSplitInputs([0, 0]);
  };

  const handleRemoveBatch = (index: number) => {
    setSplitInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
  const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  const getPathLetterPills = (
    o: WorkOrder,
    onPillClick?: (orderId: string, stepIndex: number) => void,
  ) => {
    const currentIdx = o.currentStepIndex;
    const currentStep = o.steps[currentIdx];
    const isCurrentRunning =
      currentIdx >= 0 && currentIdx < o.steps.length && currentStep?.status === "running";
    const currentGroup = (o.parallelGroups || []).find((g) => g.stepIndex === currentIdx);
    const selectedIndices = currentGroup?.machineIndices || [];

    return o.steps.map((step, idx) => {
      const machineType = step.kind === "machine" ? step.machineType : "Job Work";
      const config = getMachineTypeConfig(machineType || "");
      const letter = config?.letter || machineType?.charAt(0).toUpperCase() || "?";
      const isCurrent = idx === currentIdx;
      const isCompleted = step.status === "completed";

      const machineIndex = machineTypes.findIndex((m) => m.name === machineType);
      const isSelectedInCurrent = selectedIndices.includes(machineIndex);

      let variantClass = "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
      if (isCurrent) {
        if (step.status === "running") {
          variantClass = "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
        } else if (step.status === "hold") {
          variantClass = "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
        }
      } else if (isCompleted) {
        variantClass = "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 line-through";
      }

      if (isSelectedInCurrent) {
        variantClass += " ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
      }

      const isClickable = isCurrentRunning && machineIndex >= 0;

      return (
        <span
          key={step.id}
          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${variantClass} ${
            isClickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
          }`}
          title={`${machineType}${
            isClickable
              ? isSelectedInCurrent
                ? " (click to deselect)"
                : " (click to select for parallel)"
              : ""
          }`}
          onClick={() => {
            if (isClickable && onPillClick) onPillClick(o.id, idx);
          }}
        >
          {letter}
        </span>
      );
    });
  };

  const statusBgClass = (o: WorkOrder) => {
    const i = o.currentStepIndex;
    if (i < 0 || i >= o.steps.length) {
      // completed
      return "bg-green-50 dark:bg-green-900/20";
    }
    const st = o.steps[i];
    if (st.status === "hold") return "bg-red-50 dark:bg-red-900/20";
    if (st.status === "running") return "bg-green-50 dark:bg-green-900/20";
    return "";
  };

  const toggleCardStatus = (o: WorkOrder) => {
    const i = o.currentStepIndex;
    if (i < 0 || i >= o.steps.length) return;
    const st = o.steps[i];
    const newStatus = st.status === "running" ? "hold" : "running";
    props.onSetStepStatus(o.id, i, newStatus);
  };

  return (
    <div className="min-h-screen">
      <div className="px-0">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Production Orders
        </h1>

        <div className="space-y-3">
          {/* Desktop table */}
          <div className="hidden lg:block rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Date
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Model
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Qty
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Path
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Current
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Status
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((o) => {
                    const i = o.currentStepIndex;
                    const step = o.steps[i];
                    const bg = statusBgClass(o);
                    return (
                      <tr
                        key={o.id}
                        className={`${bg} border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
                      >
                        <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {formatDate(o.createdAt)}
                        </td>
                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                          <button
                            onClick={() => navigate(`/models/${o.id}/edit`)}
                            className="text-left w-full truncate"
                          >
                            {o.modelName}
                          </button>
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {o.quantity}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {getPathLetterPills(o, (orderId, stepIdx) => {
                              const stepAtIdx = o.steps[stepIdx];
                              if (stepAtIdx.kind === "machine" && stepAtIdx.machineType) {
                                const machineIndex = machineTypes.findIndex(
                                  (m) => m.name === stepAtIdx.machineType,
                                );
                                if (machineIndex >= 0) {
                                  props.onToggleParallelMachine(orderId, o.currentStepIndex, machineIndex);
                                }
                              }
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {i < 0
                            ? "Not started"
                            : i >= o.steps.length
                              ? "Completed"
                              : (() => {
                                  const primaryMachine =
                                    step.kind === "machine"
                                      ? step.machineType
                                      : "Job Work";
                                  const parallelGroup = (
                                    o.parallelGroups || []
                                  ).find((g) => g.stepIndex === i);
                                  const selectedIndices =
                                    parallelGroup?.machineIndices || [];

                                  if (selectedIndices.length === 0) {
                                    return primaryMachine;
                                  }

                                  const selectedMachines = selectedIndices
                                    .map((idx) => machineTypes[idx]?.name)
                                    .filter((name) => !!name && name !== primaryMachine);
                                  return (
                                    <div className="flex flex-col gap-0.5">
                                      <div className="font-medium">
                                        {primaryMachine}
                                      </div>
                                      {selectedMachines.map((machine, idx) => (
                                        <div
                                          key={idx}
                                          className="font-medium text-gray-900 dark:text-gray-100"
                                        >
                                          {machine}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                        </td>
                        <td className="p-3">
                          {i < 0 || i >= o.steps.length ? (
                            <Badge variant="secondary">—</Badge>
                          ) : (
                            (() => {
                              const displayStatus =
                                step.status === "pending"
                                  ? "hold"
                                  : step.status;
                              return (
                                <button onClick={() => toggleCardStatus(o)}>
                                  <Badge
                                    variant={
                                      displayStatus === "running"
                                        ? "success"
                                        : displayStatus === "hold"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    className="cursor-pointer"
                                    aria-label={`Set status for ${o.modelName}`}
                                  >
                                    {cap(displayStatus)}
                                  </Badge>
                                </button>
                              );
                            })()
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/models/${o.id}/edit`)}
                              title="Details"
                              aria-label="Details"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => props.onPrev(o.id)}
                              title="Previous step"
                              aria-label="Previous step"
                            >
                              <SkipBack className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              onClick={() => props.onNext(o.id)}
                              title="Next step"
                              aria-label="Next step"
                            >
                              <SkipForward className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSplitForId(o.id);
                                setSplitInputs([0, 0]);
                              }}
                              title="Split into batches"
                              aria-label="Split into batches"
                            >
                              <Scissors className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => props.onDelete(o.id)}
                              title="Delete"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No models yet. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {sorted.map((o) => {
              const i = o.currentStepIndex;
              const step = o.steps[i];
              const bg = statusBgClass(o);
              return (
                <div
                  key={o.id}
                  className={`${bg} rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3 shadow-sm w-full ${bg ? "" : "bg-white dark:bg-gray-900"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">
                        <button
                          onClick={() => navigate(`/models/${o.id}/edit`)}
                          className="text-left w-full truncate"
                        >
                          {o.modelName}
                        </button>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />{" "}
                          {formatDate(o.createdAt)}
                        </span>
                        <span>Qty: {o.quantity}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        {getPathLetterPills(o, (orderId, stepIdx) => {
                          const stepAtIdx = o.steps[stepIdx];
                          if (stepAtIdx.kind === "machine" && stepAtIdx.machineType) {
                            const machineIndex = machineTypes.findIndex(
                              (m) => m.name === stepAtIdx.machineType,
                            );
                            if (machineIndex >= 0) {
                              props.onToggleParallelMachine(orderId, o.currentStepIndex, machineIndex);
                            }
                          }
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {i >= 0 &&
                        i < o.steps.length &&
                        (() => {
                          const displayStatus =
                            step.status === "pending" ? "hold" : step.status;
                          return (
                            <>
                              <div className="text-sm text-right">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {i < 0
                                    ? "Not started"
                                    : i >= o.steps.length
                                      ? "Completed"
                                      : step.kind === "machine"
                                        ? step.machineType
                                        : "Job Work"}
                                </span>
                              </div>

                              {(() => {
                                const parallelGroup = (o.parallelGroups || []).find(
                                  (g) => g.stepIndex === i,
                                );
                                const selectedIndices = parallelGroup?.machineIndices || [];
                                const primaryMachine = step.kind === "machine" ? step.machineType : "Job Work";
                                const selectedMachines = selectedIndices
                                  .map((idx) => machineTypes[idx]?.name)
                                  .filter((name) => !!name && name !== primaryMachine);
                                if (selectedMachines.length === 0) return null;
                                return (
                                  <div className="text-sm text-right">
                                    {selectedMachines.map((m, idx) => (
                                      <div key={idx} className="font-medium text-gray-900 dark:text-gray-100">
                                        {m}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}

                              <button onClick={() => toggleCardStatus(o)}>
                                <Badge
                                  variant={
                                    displayStatus === "running"
                                      ? "success"
                                      : displayStatus === "hold"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className="shrink-0 cursor-pointer"
                                >
                                  {cap(displayStatus)}
                                </Badge>
                              </button>
                            </>
                          );
                        })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/models/${o.id}/edit`)}
                        title="Details"
                        aria-label="Details"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => props.onPrev(o.id)}
                        title="Previous step"
                        aria-label="Previous step"
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => props.onNext(o.id)}
                        title="Next step"
                        aria-label="Next step"
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSplitForId(o.id);
                          setSplitInputs([0, 0]);
                        }}
                        title="Split into batches"
                        aria-label="Split into batches"
                      >
                        <Scissors className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => props.onDelete(o.id)}
                        title="Delete"
                        aria-label="Delete"
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center bg-white dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">
                  No models yet. Create one to get started.
                </p>
              </div>
            )}
          </div>

          {/* Edit Path / Details Modal */}
          <SimpleModal
            open={!!editing}
            onOpenChange={(v) => !v && setEditingId(null)}
            title={`Model Details — ${editing?.modelName}`}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  Close
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              {editing && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Model
                        </div>
                        <div className="font-medium text-lg">
                          {editing.modelName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {editing.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Date: {formatDate(editing.createdAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Current status
                        </div>
                        <div className="mt-1">
                          {editing.currentStepIndex < 0 ||
                          editing.currentStepIndex >= editing.steps.length ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            (() => {
                              const ds =
                                editing.steps[editing.currentStepIndex]
                                  .status === "pending"
                                  ? "hold"
                                  : editing.steps[editing.currentStepIndex]
                                      .status;
                              return (
                                <Badge
                                  variant={
                                    ds === "running"
                                      ? "success"
                                      : ds === "hold"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {cap(ds)}
                                </Badge>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-sm text-muted-foreground mb-2">
                      Production Path
                    </div>
                    <div className="space-y-2">
                      {editing.steps.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {st.kind === "machine"
                                ? st.machineType
                                : "Job Work"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {st.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SimpleModal>

          {/* Split modal */}
          <SimpleModal
            open={!!splitFor}
            onOpenChange={(v) => !v && setSplitForId(null)}
            title={`Split into Batches — ${splitFor?.modelName}`}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSplitForId(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSplit}>
                  Split into {splitInputs.filter((q) => q > 0).length} Batches
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter quantities for each batch. Total available:{" "}
                {splitFor?.quantity || 0}
              </p>

              <div className="space-y-2">
                {splitInputs.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min={0}
                        placeholder={`Batch ${i + 1} quantity`}
                        value={q || ""}
                        onChange={(e) =>
                          setSplitInputs((arr) =>
                            arr.map((v, idx) =>
                              idx === i ? Number(e.target.value) || 0 : v,
                            ),
                          )
                        }
                        className="h-10"
                      />
                    </div>
                    {splitInputs.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveBatch(i)}
                        className="h-10 w-10 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setSplitInputs((arr) => [...arr, 0])}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Batch
              </Button>

              {splitInputs.filter((q) => q > 0).length > 0 && (
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-sm">
                  <div className="font-medium mb-1 text-gray-900 dark:text-gray-100">
                    Summary:
                  </div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    {splitInputs.map(
                      (q, i) =>
                        q > 0 && (
                          <div key={i}>
                            Batch {i + 1}: {q} units
                          </div>
                        ),
                    )}
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                      Total: {splitInputs.reduce((sum, q) => sum + q, 0)} units
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SimpleModal>
        </div>
      </div>
    </div>
  );
}
