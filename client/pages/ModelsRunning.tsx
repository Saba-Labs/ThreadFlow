import ModelList from "@/components/pipeline/ModelList";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { useMemo } from "react";

export default function ModelsRunning() {
  const pipeline = useProductionPipeline();
  const orders = useMemo(() => {
    return pipeline.orders.filter((o) => {
      const idx = o.currentStepIndex;
      if (idx < 0 || idx >= o.steps.length) return false;
      return o.steps[idx].status === "running";
    });
  }, [pipeline.orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Running Models</h1>
      </div>

      <ModelList
        orders={orders}
        onDelete={pipeline.deleteOrder}
        onNext={(id) => pipeline.moveToNextStep(id)}
        onPrev={(id) => pipeline.moveToPrevStep(id)}
        onEditPath={pipeline.editPath}
        onSplit={pipeline.splitOrder}
        onSetStepStatus={(id, idx, status) => pipeline.updateStepStatus(id, idx, { status })}
        onToggleParallelMachine={pipeline.toggleParallelMachine}
      />
    </div>
  );
}
