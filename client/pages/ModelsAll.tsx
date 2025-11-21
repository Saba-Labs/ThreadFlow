import ModelList from "@/components/pipeline/ModelList";
import ModelForm from "@/components/pipeline/ModelForm";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import PageSearchHeader from "@/components/ui/PageSearchHeader";

export default function ModelsAll() {
  const pipeline = useProductionPipeline();

  const handleMoveNext = useCallback(
    async (id: string) => {
      try {
        await pipeline.moveToNextStep(id);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to move to next step",
          variant: "destructive",
        });
      }
    },
    [pipeline],
  );

  const handleMovePrev = useCallback(
    async (id: string) => {
      try {
        await pipeline.moveToPrevStep(id);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to move to previous step",
          variant: "destructive",
        });
      }
    },
    [pipeline],
  );
  useSwipeNavigation({
    leftPage: "/",
    rightPage: "/job-work",
  });
  const [filter, setFilter] = useState<
    "all" | "hold" | "running" | "completed" | "job" | "onboard"
  >("all");
  const [localQuery, setLocalQuery] = useState("");

  const filtered = useMemo(() => {
    const hasPendingJobWork = (
      o: (typeof pipeline.orders)[number],
    ): boolean => {
      return (
        ((o as any).jobWorkIds || []).length > 0 ||
        (o.jobWorkAssignments || []).some((a) => a.status === "pending")
      );
    };

    const statusOf = (
      o: (typeof pipeline.orders)[number],
    ): "hold" | "running" | "completed" | "onboard" => {
      if (o.currentStepIndex < 0) {
        return "onboard";
      }
      if (o.currentStepIndex >= o.steps.length) {
        return "completed";
      }
      const s = o.steps[o.currentStepIndex]?.status || "hold";
      return s === "pending" ? "hold" : (s as "hold" | "running" | "completed");
    };
    if (filter === "all") {
      return pipeline.orders.filter((o) => statusOf(o) !== "completed");
    }
    if (filter === "job") {
      return pipeline.orders.filter((o) => hasPendingJobWork(o));
    }
    if (filter === "onboard") {
      return pipeline.orders.filter((o) => o.currentStepIndex < 0);
    }

    return pipeline.orders.filter(
      (o) => statusOf(o) === (filter as any) && !hasPendingJobWork(o),
    );
  }, [pipeline.orders, filter]);

  const visible = useMemo(() => {
    const q = localQuery.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (o) =>
        o.modelName.toLowerCase().includes(q) || String(o.quantity).includes(q),
    );
  }, [filtered, localQuery]);

  const [showDetails, setShowDetails] = useState(false);
  const isMobile = useIsMobile();

  // View mode for models list: 'cards' or 'list'. Default to 'cards' for new devices.
  const [viewMode, setViewMode] = useState<"cards" | "list">(() => {
    try {
      return (
        (localStorage.getItem("models.viewMode") as "cards" | "list") || "cards"
      );
    } catch {
      return "cards";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("models.viewMode", viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    const onStorage = () => {
      try {
        const v =
          (localStorage.getItem("models.viewMode") as "cards" | "list") ||
          "cards";
        setViewMode(v);
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    // also listen to a custom event in case settings updates in same window
    window.addEventListener("modelsViewChanged", onStorage as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "modelsViewChanged",
        onStorage as EventListener,
      );
    };
  }, []);

  // Persist showDetails across navigation using localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("modelsAll.showDetails");
      if (stored !== null) {
        setShowDetails(stored === "true");
      }
    } catch (e) {
      // ignore (e.g., SSR or privacy settings)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "modelsAll.showDetails",
        showDetails ? "true" : "false",
      );
    } catch (e) {
      // ignore
    }
  }, [showDetails]);

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center justify-between ${viewMode === "list" ? "pb-3 border-b border-gray-200 mb-3" : ""}`}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight whitespace-nowrap flex-shrink-0">
            All Models
          </h1>
          {/* Mobile-only toggle: keep for small screens */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={showDetails ? "Hide details" : "Show details"}
            onClick={() => setShowDetails((s) => !s)}
            title={showDetails ? "Hide details" : "Show details"}
            className="lg:hidden"
          >
            {showDetails ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="onboard">On Board</SelectItem>
              <SelectItem value="hold">Hold</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="job">Job Work</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <PageSearchHeader
          value={localQuery}
          onChange={setLocalQuery}
          placeholder="Search models..."
        />
      </div>

      <div className={viewMode === "list" ? "-mx-4 px-0" : "-mx-8 px-4"}>
        <ModelList
          orders={visible}
          onDelete={pipeline.deleteOrder}
          onNext={handleMoveNext}
          onPrev={handleMovePrev}
          onEditPath={pipeline.editPath}
          onSplit={pipeline.splitOrder}
          onSetStepStatus={(id, idx, status) =>
            pipeline.updateStepStatus(id, idx, { status })
          }
          onToggleParallelMachine={pipeline.toggleParallelMachine}
          onSaveProgress={pipeline.saveOrderProgress}
          setOrderJobWorks={pipeline.setOrderJobWorks}
          setJobWorkAssignments={pipeline.setJobWorkAssignments}
          updateJobWorkAssignmentStatus={pipeline.updateJobWorkAssignmentStatus}
          showDetails={isMobile ? showDetails : true}
          viewMode={viewMode}
        />
        <Button
          asChild
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
        >
          <Link to="/models/new" aria-label="New Model">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
