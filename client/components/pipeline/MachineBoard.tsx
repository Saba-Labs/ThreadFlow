import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MACHINE_TYPES, MachineType, WorkOrder } from "@/hooks/useProductionPipeline";
import { ChevronRight, PauseCircle, PlayCircle, SkipForward } from "lucide-react";

export default function MachineBoard(props: {
  data: Record<MachineType, WorkOrder[]>;
  onRun: (o: WorkOrder) => void;
  onHold: (o: WorkOrder) => void;
  onNext: (o: WorkOrder) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {MACHINE_TYPES.map((mt) => (
        <section key={mt} className="rounded-lg border bg-card/50">
          <header className="flex items-center justify-between border-b p-3">
            <h3 className="text-sm font-semibold">{mt}</h3>
            <Badge variant="secondary">{props.data[mt]?.length ?? 0}</Badge>
          </header>
          <div className="divide-y">
            {(props.data[mt] ?? []).map((o) => (
              <article key={o.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium">{o.modelName}</div>
                    <Badge variant="outline">Qty {o.quantity}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Step {o.currentStepIndex + 1}/{o.steps.length}</span>
                    <ChevronRight className="h-3 w-3"/>
                    <span className="capitalize">{o.steps[o.currentStepIndex]?.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => props.onRun(o)} title="Mark running">
                    <PlayCircle className="h-5 w-5 text-green-600"/>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => props.onHold(o)} title="Put on hold">
                    <PauseCircle className="h-5 w-5 text-amber-600"/>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => props.onNext(o)} title="Move to next step">
                    <SkipForward className="h-5 w-5 text-primary"/>
                  </Button>
                </div>
              </article>
            ))}
            {(props.data[mt]?.length ?? 0) === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No models on this machine.</div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
