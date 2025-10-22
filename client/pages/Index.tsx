import MachineBoard from "@/components/pipeline/MachineBoard";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default function Index() {
  const pipeline = useProductionPipeline();

  const total = pipeline.orders.length;
  const running = pipeline.orders.filter((o) => {
    const idx = o.currentStepIndex;
    const s = o.steps[idx]?.status;
    return s === "running";
  }).length;
  const hold = pipeline.orders.filter((o) => {
    const idx = o.currentStepIndex;
    const s = o.steps[idx]?.status === "pending" ? "hold" : o.steps[idx]?.status;
    return s === "hold";
  }).length;
  const completed = pipeline.orders.filter(
    (o) => o.currentStepIndex < 0 || o.currentStepIndex >= o.steps.length,
  ).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Garments Production</h1>
          <p className="text-sm text-muted-foreground">
            Overview of models, machines and live production status.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-80">
            <Input placeholder="Search models or machines..." />
            <Button variant="ghost" size="icon" aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <Button asChild>
            <a href="/models/new" className="ml-2">
              New Model
            </a>
          </Button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-muted-foreground">Total Models</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-2xl font-semibold">{total}</div>
            <Badge variant="secondary">Live</Badge>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-muted-foreground">Running</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-2xl font-semibold text-green-600">{running}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-muted-foreground">On Hold</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-2xl font-semibold text-amber-600">{hold}</div>
            <div className="text-xs text-muted-foreground">Blocked</div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-2xl font-semibold text-green-700">{completed}</div>
            <div className="text-xs text-muted-foreground">Done</div>
          </div>
        </div>
      </section>

      {/* Machine board */}
      <section>
        <h2 className="text-lg font-medium mb-3">Machines</h2>
        <MachineBoard
          data={pipeline.board}
          onRun={(o) => {
            if (o.currentStepIndex < 0 || o.currentStepIndex >= o.steps.length)
              return;
            pipeline.updateStepStatus(o.id, o.currentStepIndex, {
              status: "running",
            });
          }}
          onHold={(o) => {
            if (o.currentStepIndex < 0 || o.currentStepIndex >= o.steps.length)
              return;
            pipeline.updateStepStatus(o.id, o.currentStepIndex, {
              status: "hold",
            });
          }}
          onNext={(o) => pipeline.moveToNextStep(o.id)}
        />
      </section>
    </div>
  );
}
