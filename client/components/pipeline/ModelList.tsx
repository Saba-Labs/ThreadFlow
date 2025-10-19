import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";
import {
  ArrowDown,
  ArrowUp,
  Scissors,
  SkipForward,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import type { PathStep, WorkOrder } from "@/hooks/useProductionPipeline";

interface ModelListProps {
  orders: WorkOrder[];
  onDelete: (id: string) => void;
  onNext: (id: string) => void;
  onEditPath: (
    orderId: string,
    editor: (steps: PathStep[]) => PathStep[],
  ) => void;
  onSplit: (orderId: string, quantities: number[]) => void;
}

export default function ModelList(props: ModelListProps) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Production Orders
        </h1>

        <div className="space-y-3">
          <div className="hidden lg:block rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Model
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Qty
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Current
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Status
                    </th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">
                      Path
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
                    return (
                      <tr
                        key={o.id}
                        className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                          {o.modelName}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {o.quantity}
                        </td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {i < 0
                            ? "Not started"
                            : i >= o.steps.length
                              ? "Completed"
                              : step.kind === "machine"
                                ? step.machineType
                                : "Job Work"}
                        </td>
                        <td className="p-3">
                          {i < 0 || i >= o.steps.length ? (
                            <Badge variant="secondary">—</Badge>
                          ) : (
                            <Badge
                              variant={
                                step.status === "running"
                                  ? "default"
                                  : step.status === "hold"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {step.status}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 max-w-[320px]">
                          <div className="flex flex-wrap gap-1">
                            {o.steps.map((s, idx) => (
                              <span
                                key={s.id}
                                className={`rounded-full px-2 py-0.5 text-xs border ${
                                  idx < i
                                    ? "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : idx === i
                                      ? "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700"
                                }`}
                              >
                                {s.kind === "machine"
                                  ? s.machineType
                                  : "Job Work"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(o.id)}
                            >
                              Edit Path
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => props.onNext(o.id)}
                            >
                              <SkipForward className="h-4 w-4 mr-1" /> Next
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSplitForId(o.id);
                                setSplitInputs([0, 0]);
                              }}
                              title="Split into batches"
                            >
                              <Scissors className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => props.onDelete(o.id)}
                              title="Delete"
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

          <div className="lg:hidden space-y-3">
            {sorted.map((o) => {
              const i = o.currentStepIndex;
              const step = o.steps[i];
              return (
                <div
                  key={o.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">
                        {o.modelName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Quantity: {o.quantity}
                      </p>
                    </div>
                    {i >= 0 && i < o.steps.length && (
                      <Badge
                        variant={
                          step.status === "running"
                            ? "default"
                            : step.status === "hold"
                              ? "destructive"
                              : "secondary"
                        }
                        className="shrink-0"
                      >
                        {step.status}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Current:{" "}
                      </span>
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

                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                        Production Path:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {o.steps.map((s, idx) => (
                          <span
                            key={s.id}
                            className={`rounded-full px-2.5 py-1 text-xs border font-medium ${
                              idx < i
                                ? "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : idx === i
                                  ? "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700"
                            }`}
                          >
                            {s.kind === "machine" ? s.machineType : "Job Work"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(o.id)}
                      className="flex-1"
                    >
                      Edit Path
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => props.onNext(o.id)}
                      className="flex-1"
                    >
                      <SkipForward className="h-4 w-4 mr-1" /> Next
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSplitForId(o.id);
                        setSplitInputs([0, 0]);
                      }}
                      className="flex-1"
                    >
                      <Scissors className="h-4 w-4 mr-1.5" /> Split Batches
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => props.onDelete(o.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No models yet. Create one to get started.
                </p>
              </div>
            )}
          </div>

          <SimpleModal
            open={!!editing}
            onOpenChange={(v) => !v && setEditingId(null)}
            title={`Edit Path — ${editing?.modelName}`}
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
                  {editing.steps.map((st, idx) => (
                    <div
                      key={st.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="min-w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-gray-900 dark:text-gray-100">
                          {st.kind === "machine" ? st.machineType : "Job Work"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={idx === 0}
                          onClick={() =>
                            props.onEditPath(editing.id, (steps) => {
                              const j = idx - 1;
                              if (j < 0) return steps;
                              const arr = steps.slice();
                              const tmp = arr[idx];
                              arr[idx] = arr[j];
                              arr[j] = tmp;
                              return arr;
                            })
                          }
                          className="h-8 w-8"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={idx === editing.steps.length - 1}
                          onClick={() =>
                            props.onEditPath(editing.id, (steps) => {
                              const j = idx + 1;
                              if (j >= steps.length) return steps;
                              const arr = steps.slice();
                              const tmp = arr[idx];
                              arr[idx] = arr[j];
                              arr[j] = tmp;
                              return arr;
                            })
                          }
                          className="h-8 w-8"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SimpleModal>

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
