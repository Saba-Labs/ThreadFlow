import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkOrder } from "@/hooks/useProductionPipeline";
import type { MachineType } from "@/hooks/useProductionPipeline";
import { useMachineTypes } from "@/lib/machineTypes";
import {
  ChevronRight,
  PauseCircle,
  PlayCircle,
  SkipForward,
} from "lucide-react";

export default function MachineBoard(props: {
  data: Record<MachineType, WorkOrder[]>;
  onRun: (o: WorkOrder) => void;
  onHold: (o: WorkOrder) => void;
  onNext: (o: WorkOrder) => void;
}) {
  const machineTypes = useMachineTypes();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {machineTypes.map((mtConfig) => {
        const orders = props.data[mtConfig.name] ?? [];
        return (
          <section
            key={mtConfig.name}
            className="rounded-lg border bg-card/50 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {mtConfig.name}
                </h3>
                <div className="text-xs text-muted-foreground">
                  {orders.length} queued
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{orders.length}</Badge>
              </div>
            </div>

            <div className="p-3 space-y-2">
              {orders.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No models on this machine
                </div>
              ) : (
                orders.map((o) => {
                  const total = Math.max(1, o.steps.length);
                  const idx = Math.max(
                    0,
                    Math.min(o.currentStepIndex, total - 1),
                  );
                  const percent = Math.round(((idx + 1) / total) * 100);
                  const status = o.steps[o.currentStepIndex]?.status || "—";
                  return (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate font-medium text-sm text-gray-900">
                            {o.modelName}
                          </div>
                          <Badge variant="outline">{o.quantity}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] bg-muted rounded px-2 py-0.5">
                              Step {o.currentStepIndex + 1}/{o.steps.length}
                            </div>
                            <div className="capitalize">{status}</div>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-muted rounded overflow-hidden">
                              <div
                                className="h-2 bg-primary"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percent}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => props.onRun(o)}
                          title="Mark running"
                        >
                          <PlayCircle className="h-5 w-5 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => props.onHold(o)}
                          title="Put on hold"
                        >
                          <PauseCircle className="h-5 w-5 text-amber-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => props.onNext(o)}
                          title="Move to next step"
                        >
                          <SkipForward className="h-5 w-5 text-primary" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
