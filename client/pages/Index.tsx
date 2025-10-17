import { Button } from "@/components/ui/button";
import ModelForm from "@/components/pipeline/ModelForm";
import MachineBoard from "@/components/pipeline/MachineBoard";
import ModelList from "@/components/pipeline/ModelList";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";

export default function Index() {
  const pipeline = useProductionPipeline();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Garments Production Dashboard
          </h1>
          <p className="text-muted-foreground max-w-prose">
            Track models across machines (Singer, Folding, Roll, Fleet, Overlock
            3T, Elastic, 5 Thread Joint, Kaja, Button, Ring Button) and
            finishing (Trimming, Ironing, Packing). Set custom paths, mark
            running/hold, and move to next steps.
          </p>
        </div>
        <ModelForm
          onCreate={(data) => {
            pipeline.createWorkOrder({
              modelName: data.modelName,
              quantity: data.quantity,
              path: data.path as any,
            });
          }}
          trigger={<Button>New Model</Button>}
        />
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

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Models</h2>
        </div>
        <ModelList
          orders={pipeline.orders}
          onDelete={pipeline.deleteOrder}
          onNext={(id) => pipeline.moveToNextStep(id)}
          onEditPath={pipeline.editPath}
          onSplit={pipeline.splitOrder}
        />
      </section>
    </div>
  );
}
