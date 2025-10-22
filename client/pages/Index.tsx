import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Layers, Play, Pause, CheckCircle } from "lucide-react";
import MachineBoard from "@/components/pipeline/MachineBoard";

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
    const s =
      o.steps[idx]?.status === "pending" ? "hold" : o.steps[idx]?.status;
    return s === "hold";
  }).length;
  const completed = pipeline.orders.filter(
    (o) => o.currentStepIndex < 0 || o.currentStepIndex >= o.steps.length,
  ).length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-lg bg-gradient-to-r from-white/60 to-muted/40 p-6 shadow-sm border">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Garments Production
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Live overview of models, machines and production flow. Use the
              search and quick actions to manage the pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center w-full md:w-96 bg-surface rounded-md px-3 py-2 shadow-sm">
              <div className="text-sm text-muted-foreground">Overview</div>
            </div>

            <Button variant="ghost" size="icon" className="ml-1">
              <Layers className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-md border">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Total Models</div>
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <div className="text-2xl font-semibold">{total}</div>
              <Badge variant="secondary">Live</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-md border">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-green-50 text-green-600">
            <Play className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Running</div>
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <div className="text-2xl font-semibold text-green-600">
                {running}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-md border">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-amber-50 text-amber-600">
            <Pause className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">On Hold</div>
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <div className="text-2xl font-semibold text-amber-600">
                {hold}
              </div>
              <div className="text-xs text-muted-foreground">Blocked</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-md border">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-green-50 text-green-700">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <div className="text-2xl font-semibold text-green-700">
                {completed}
              </div>
              <div className="text-xs text-muted-foreground">Done</div>
            </div>
          </div>
        </div>
      </section>

      {/* Machine board */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Machines</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Refresh
            </Button>
            <Button variant="ghost" size="sm">
              Filters
            </Button>
          </div>
        </div>

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
