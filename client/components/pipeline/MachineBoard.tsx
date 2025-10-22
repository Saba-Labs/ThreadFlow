import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkOrder } from "@/hooks/useProductionPipeline";
import type { MachineType } from "@/hooks/useProductionPipeline";
import { useMachineTypes } from "@/lib/machineTypes";
import { useState } from "react";
import {
  PauseCircle,
  PlayCircle,
  SkipForward,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function MachineBoard(props: {
  data: Record<MachineType, WorkOrder[]>;
  onRun: (o: WorkOrder) => void;
  onHold: (o: WorkOrder) => void;
  onNext: (o: WorkOrder) => void;
}) {
  const machineTypes = useMachineTypes();
  const [expandedBelow, setExpandedBelow] = useState<Record<string, boolean>>({});
  const [expandedAbove, setExpandedAbove] = useState<Record<string, boolean>>({});

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {machineTypes.map((mtConfig) => {
        const orders = props.data[mtConfig.name] ?? [];

        // compute models that will come next to this machine (incoming)
        const allOrders = Object.values(props.data).flat();
        const incoming = allOrders.filter((o) => {
          const idx = o.currentStepIndex;
          if (idx < 0) return false;
          const nextIdx = idx + 1;
          if (nextIdx >= o.steps.length) return false;
          const next = o.steps[nextIdx];
          return next.kind === "machine" && next.machineType === mtConfig.name;
        });

        // models running or in hold on this machine
        const runningOrHold = orders.filter((o) => {
          const s = o.steps[o.currentStepIndex]?.status;
          return s === "running" || s === "hold";
        });

        return (
          <section key={mtConfig.name} className="rounded-lg border bg-card/50 shadow-sm overflow-hidden">
            {/* expanded above (incoming) */}
            {expandedAbove[mtConfig.name] && (
              <div className="p-3 border-b bg-muted/10">
                <div className="text-sm font-semibold mb-2">Incoming</div>
                {incoming.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No incoming models</div>
                ) : (
                  incoming.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-1">
                      <div className="truncate">{o.modelName}</div>
                      <div className="text-xs text-muted-foreground">{o.quantity}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{mtConfig.name}</h3>
                <div className="text-xs text-muted-foreground">{orders.length} queued</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label="Show incoming"
                  onClick={() => setExpandedAbove((prev) => ({ ...prev, [mtConfig.name]: !prev[mtConfig.name] }))}
                  className="inline-flex items-center justify-center p-1 rounded-md border"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  aria-label="Show running/hold"
                  onClick={() => setExpandedBelow((prev) => ({ ...prev, [mtConfig.name]: !prev[mtConfig.name] }))}
                  className="inline-flex items-center justify-center p-1 rounded-md border"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <Badge variant="secondary">{orders.length}</Badge>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {orders.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">No models on this machine</div>
              ) : (
                orders.map((o) => {
                  const total = Math.max(1, o.steps.length);
                  const idx = Math.max(0, Math.min(o.currentStepIndex, total - 1));
                  const percent = Math.round(((idx + 1) / total) * 100);
                  const status = o.steps[o.currentStepIndex]?.status || "—";
                  return (
                    <div key={o.id} className="flex items-center justify-between gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate font-medium text-sm text-gray-900">{o.modelName}</div>
                          <Badge variant="outline">{o.quantity}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] bg-muted rounded px-2 py-0.5">Step {o.currentStepIndex + 1}/{o.steps.length}</div>
                            <div className="capitalize">{status}</div>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-muted rounded overflow-hidden"><div className="h-2 bg-primary" style={{ width: `${percent}%` }} /></div>
                          </div>
                          <div className="text-xs text-muted-foreground">{percent}%</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => props.onRun(o)} title="Mark running"><PlayCircle className="h-5 w-5 text-green-600" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => props.onHold(o)} title="Put on hold"><PauseCircle className="h-5 w-5 text-amber-600" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => props.onNext(o)} title="Move to next step"><SkipForward className="h-5 w-5 text-primary" /></Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* expanded below (running and hold list) */}
            {expandedBelow[mtConfig.name] && (
              <div className="p-3 border-t bg-muted/10">
                <div className="text-sm font-semibold mb-2">Running / Hold</div>
                {runningOrHold.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No active models</div>
                ) : (
                  runningOrHold.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-1">
                      <div className="truncate">{o.modelName}</div>
                      <div className="text-xs text-muted-foreground">{o.quantity}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
