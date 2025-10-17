import MachineBoard from "@/components/pipeline/MachineBoard";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";

export default function Index() {
  const pipeline = useProductionPipeline();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Garments Production Dashboard</h1>
          <p className="text-muted-foreground max-w-prose">Track models across machines and finishing. Set custom paths, mark running/hold, and move to next steps.</p>
        </div>
      </div>

      <MachineBoard
        data={pipeline.board}
        onRun={(o) => {
          if (o.currentStepIndex < 0 || o.currentStepIndex >= o.steps.length) return;
          pipeline.updateStepStatus(o.id, o.currentStepIndex, { status: "running" });
        }}
        onHold={(o) => {
          if (o.currentStepIndex < 0 || o.currentStepIndex >= o.steps.length) return;
          pipeline.updateStepStatus(o.id, o.currentStepIndex, { status: "hold" });
        }}
        onNext={(o) => pipeline.moveToNextStep(o.id)}
      />
    </div>
  );
}
