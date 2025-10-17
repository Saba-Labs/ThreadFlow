import ModelList from "@/components/pipeline/ModelList";
import ModelForm from "@/components/pipeline/ModelForm";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { Button } from "@/components/ui/button";

export default function ModelsAll() {
  const pipeline = useProductionPipeline();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Models</h1>
          <p className="text-muted-foreground max-w-prose">
            A list of all work orders in the system.
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

      <ModelList
        orders={pipeline.orders}
        onDelete={pipeline.deleteOrder}
        onNext={(id) => pipeline.moveToNextStep(id)}
        onEditPath={pipeline.editPath}
        onSplit={pipeline.splitOrder}
      />
    </div>
  );
}
