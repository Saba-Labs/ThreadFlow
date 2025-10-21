import { useMemo, useState } from "react";
import ModelList from "@/components/pipeline/ModelList";
import ModelForm from "@/components/pipeline/ModelForm";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Plus } from "lucide-react";

export default function ModelsAll() {
  const pipeline = useProductionPipeline();
  const [filter, setFilter] = useState<
    "all" | "hold" | "running" | "completed" | "job"
  >("all");

  const filtered = useMemo(() => {
    const statusOf = (
      o: (typeof pipeline.orders)[number],
    ): "hold" | "running" | "completed" => {
      if (o.currentStepIndex < 0 || o.currentStepIndex >= o.steps.length) {
        return "completed";
      }
      const s = o.steps[o.currentStepIndex]?.status || "hold";
      return s === "pending" ? "hold" : (s as "hold" | "running" | "completed");
    };
    if (filter === "all") return pipeline.orders;
    if (filter === "job") {
      return pipeline.orders.filter(
        (o) => ((o as any).jobWorkIds || []).length > 0,
      );
    }

    return pipeline.orders.filter((o) => statusOf(o) === (filter as any));
  }, [pipeline.orders, filter]);

  const [showDetails, setShowDetails] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">All Models</h1>
            <Button
              variant="ghost"
              size="icon"
              aria-label={showDetails ? "Hide details" : "Show details"}
              onClick={() => setShowDetails((s) => !s)}
              title={showDetails ? "Hide details" : "Show details"}
            >
              {showDetails ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-muted-foreground max-w-prose">
            A list of all work orders in the system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="hold">Hold</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="job">Job Work</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/models/new">New Model</Link>
          </Button>
        </div>
      </div>

      <div className="-mx-4 sm:-mx-6 px-0 sm:px-0">
        <ModelList
          orders={filtered}
          onDelete={pipeline.deleteOrder}
          onNext={(id) => pipeline.moveToNextStep(id)}
          onPrev={(id) => pipeline.moveToPrevStep(id)}
          onEditPath={pipeline.editPath}
          onSplit={pipeline.splitOrder}
          onSetStepStatus={(id, idx, status) =>
            pipeline.updateStepStatus(id, idx, { status })
          }
          onToggleParallelMachine={pipeline.toggleParallelMachine}
          setOrderJobWorks={pipeline.setOrderJobWorks}
          showDetails={showDetails}
        />
      </div>
    </div>
  );
}
