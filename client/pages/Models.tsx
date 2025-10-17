import { useMemo } from "react";
import { useParams } from "react-router-dom";
import ModelList from "@/components/pipeline/ModelList";
import MachineBoard from "@/components/pipeline/MachineBoard";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";

export default function Models() {
  const { view } = useParams();
  const pipeline = useProductionPipeline();

  const filter = view ?? "all";

  const filteredOrders = useMemo(() => {
    if (filter === "running") {
      return pipeline.orders.filter((o) => {
        const idx = o.currentStepIndex;
        if (idx < 0 || idx >= o.steps.length) return false;
        return o.steps[idx].status === "running";
      });
    }
    if (filter === "hold") {
      return pipeline.orders.filter((o) => {
        const idx = o.currentStepIndex;
        if (idx < 0 || idx >= o.steps.length) return false;
        return o.steps[idx].status === "hold";
      });
    }
    return pipeline.orders;
  }, [pipeline.orders, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {filter === "all"
            ? "All Models"
            : filter === "running"
              ? "Running Models"
              : "On-hold Models"}
        </h1>
        <p className="text-sm text-muted-foreground">View: {filter}</p>
      </div>

      <section>
        <MachineBoard
          data={pipeline.board}
          onRun={(o) =>
            pipeline.updateStepStatus(o.id, o.currentStepIndex, {
              status: "running",
            })
          }
          onHold={(o) =>
            pipeline.updateStepStatus(o.id, o.currentStepIndex, {
              status: "hold",
            })
          }
          onNext={(o) => pipeline.moveToNextStep(o.id)}
        />
      </section>

      <section>
        <ModelList
          orders={filteredOrders}
          onDelete={pipeline.deleteOrder}
          onNext={(id) => pipeline.moveToNextStep(id)}
          onEditPath={pipeline.editPath}
          onSplit={pipeline.splitOrder}
        />
      </section>
    </div>
  );
}
