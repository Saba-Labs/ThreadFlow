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
        <Button asChild>
          <Link to="/models/new">New Model</Link>
        </Button>
      </div>

      <div className="-mx-4 sm:-mx-6 px-0 sm:px-0">
        <ModelList
          orders={pipeline.orders}
          onDelete={pipeline.deleteOrder}
          onNext={(id) => pipeline.moveToNextStep(id)}
          onPrev={(id) => pipeline.moveToPrevStep(id)}
          onEditPath={pipeline.editPath}
          onSplit={pipeline.splitOrder}
          onSetStepStatus={(id, idx, status) =>
            pipeline.updateStepStatus(id, idx, { status })
          }
          onToggleParallelMachine={pipeline.toggleParallelMachine}
        />
      </div>
    </div>
  );
}
