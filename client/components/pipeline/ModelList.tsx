import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SimpleModal from "@/components/ui/SimpleModal";
import { Input } from "@/components/ui/input";
import {
  MACHINE_TYPES,
  PathStep,
  WorkOrder,
} from "@/hooks/useProductionPipeline";
import {
  ArrowDown,
  ArrowUp,
  Scissors,
  SkipForward,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function ModelList(props: {
  orders: WorkOrder[];
  onDelete: (id: string) => void;
  onNext: (id: string) => void;
  onEditPath: (
    orderId: string,
    editor: (steps: PathStep[]) => PathStep[],
  ) => void;
  onSplit: (orderId: string, quantities: number[]) => void;
}) {
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [splitFor, setSplitFor] = useState<WorkOrder | null>(null);
  const [splitInputs, setSplitInputs] = useState<number[]>([0, 0]);

  const sorted = useMemo(
    () => props.orders.slice().sort((a, b) => b.createdAt - a.createdAt),
    [props.orders],
  );

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-3 text-left font-medium">Model</th>
            <th className="p-3 text-left font-medium">Qty</th>
            <th className="p-3 text-left font-medium">Current</th>
            <th className="p-3 text-left font-medium">Status</th>
            <th className="p-3 text-left font-medium">Path</th>
            <th className="p-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => {
            const i = o.currentStepIndex;
            const step = o.steps[i];
            return (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-medium">{o.modelName}</td>
                <td className="p-3">{o.quantity}</td>
                <td className="p-3">
                  {i < 0
                    ? "Not started"
                    : i >= o.steps.length
                      ? "Completed"
                      : step.kind === "machine"
                        ? step.machineType
                        : `Job Work`}
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
                        className={`rounded-full px-2 py-0.5 text-xs border ${idx < i ? "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300" : idx === i ? "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "text-muted-foreground"}`}
                      >
                        {s.kind === "machine" ? s.machineType : "Job Work"}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing(o)}
                    >
                      Edit Path
                    </Button>
                    <Button size="sm" onClick={() => props.onNext(o.id)}>
                      <SkipForward className="h-4 w-4 mr-1" /> Next
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSplitFor(o)}
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
              <td colSpan={6} className="p-6 text-center text-muted-foreground">
                No models yet. Create one to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <SimpleModal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title={`Edit Path — ${editing?.modelName}`}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setEditing(null)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-2">
          {editing && (
            <div className="rounded-md border divide-y">
              {editing.steps.map((st, idx) => (
                <div key={st.id} className="flex items-center gap-3 p-2">
                  <div className="min-w-8 text-xs text-muted-foreground text-center">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {st.kind === "machine" ? st.machineType : "Job Work"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
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
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
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
        onOpenChange={(v) => !v && setSplitFor(null)}
        title={`Split into Batches — ${splitFor?.modelName}`}
        footer={
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (!splitFor) return;
                props.onSplit(splitFor.id, splitInputs);
                setSplitFor(null);
              }}
            >
              Split
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {splitInputs.map((q, i) => (
            <Input
              key={i}
              type="number"
              value={q}
              onChange={(e) =>
                setSplitInputs((arr) =>
                  arr.map((v, idx) => (idx === i ? Number(e.target.value) : v)),
                )
              }
            />
          ))}
          <Button
            variant="secondary"
            onClick={() => setSplitInputs((arr) => [...arr, 0])}
          >
            Add batch
          </Button>
        </div>
      </SimpleModal>
    </div>
  );
}
