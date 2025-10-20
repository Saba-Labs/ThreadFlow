import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkOrder } from "@/hooks/useProductionPipeline";
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {machineTypes.map((mtConfig) => (
        <section
          key={mtConfig.name}
          className="rounded-lg border bg-gradient-to-br from-card/50 via-accent/5 to-background/50"
        >
          <header className="flex items-center justify-between border-b p-3 bg-gradient-to-r from-primary/5 to-accent/3">
            <h3 className="text-sm font-semibold text-primary">{mtConfig.name}</h3>
            <Badge variant="secondary">{props.data[mtConfig.name]?.length ?? 0}</Badge>
          </header>
          <div className="divide-y">
            {(props.data[mtConfig.name] ?? []).map((o, idx) => (
              <article
                key={o.id}
                className={`flex items-center gap-3 p-3 ${idx % 2 === 0 ? "bg-white/40" : "bg-muted/10"}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium">{o.modelName}</div>
                    <Badge variant="outline">Qty {o.quantity}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Step {o.currentStepIndex + 1}/{o.steps.length}
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="capitalize">
                      {o.steps[o.currentStepIndex]?.status}
                    </span>
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
              </article>
            ))}
            {(props.data[mt]?.length ?? 0) === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No models on this machine.
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
