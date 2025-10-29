import { Button } from "@/components/ui/button";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Layers, Play, Pause, Briefcase, ChevronDown, ChevronUp, Map, Package } from "lucide-react";
import MachineBoard from "@/components/pipeline/MachineBoard";
import { useCallback, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRoadmaps } from "@/context/RoadmapContext";

export default function Index() {
  const pipeline = useProductionPipeline();
  const { roadmaps } = useRoadmaps();
  const [machineListExpanded, setMachineListExpanded] = useState(true);
  const [roadmapExpanded, setRoadmapExpanded] = useState(true);
  const [restokExpanded, setRestokExpanded] = useState(true);
  const [restokItems, setRestokItems] = useState<any[]>([]);

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

  // Fetch ReStok items
  const fetchRestokItems = useCallback(async () => {
    try {
      const response = await fetch("/api/restok/items");
      if (response.ok) {
        const data = await response.json();
        setRestokItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch restok items:", error);
    }
  }, []);

  useEffect(() => {
    fetchRestokItems();
  }, [fetchRestokItems]);

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
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Job Work</div>
            <div className="mt-1 flex items-baseline justify-between gap-4">
              <div className="text-2xl font-semibold text-green-700">
                {pipeline.orders.reduce(
                  (sum, o) => sum + (o.jobWorkIds || []).length,
                  0,
                )}
              </div>
              <div className="text-xs text-muted-foreground">Assigned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap board */}
      <section>
        <button
          onClick={() => setRoadmapExpanded(!roadmapExpanded)}
          className="w-full mb-6 group"
          title={roadmapExpanded ? "Collapse roadmaps" : "Expand roadmaps"}
        >
          <div className="flex items-center gap-4 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 transition-all duration-300 group-hover:shadow-lg group-hover:from-blue-100 group-hover:to-indigo-100">
            <Map className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-slate-900 flex-1 text-left">
              Roadmaps
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                {roadmaps.length}
              </Badge>
              <div className="p-2 rounded-lg bg-white/60 group-hover:bg-white transition-colors duration-300">
                {roadmapExpanded ? (
                  <ChevronUp className="h-5 w-5 text-blue-600 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-blue-600 transition-transform duration-300" />
                )}
              </div>
            </div>
          </div>
        </button>

        {roadmapExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {roadmaps.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground border rounded-lg bg-card">
                <p>No roadmaps yet</p>
              </div>
            ) : (
              roadmaps.map((r) => (
                <Card
                  key={r.id}
                  className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 border-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                          {r.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white text-base sm:text-lg font-semibold truncate">
                            {r.title}
                          </CardTitle>
                          <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                            {r.items.length} model{r.items.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6">
                    {r.items.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 sm:p-8 text-center bg-slate-50/50">
                        <div className="text-sm text-slate-600">
                          No models added yet
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {r.items.map((it, idx) => (
                          <div
                            key={`${r.id}-${it.modelId}-${idx}`}
                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition-all"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                                {it.modelName} ({it.quantity})
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </section>

      {/* ReStok board */}
      <section>
        <button
          onClick={() => setRestokExpanded(!restokExpanded)}
          className="w-full mb-6 group"
          title={restokExpanded ? "Collapse restok" : "Expand restok"}
        >
          <div className="flex items-center gap-4 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 transition-all duration-300 group-hover:shadow-lg group-hover:from-amber-100 group-hover:to-orange-100">
            <Package className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-slate-900 flex-1 text-left">
              ReStok
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                {restokItems.length}
              </Badge>
              <div className="p-2 rounded-lg bg-white/60 group-hover:bg-white transition-colors duration-300">
                {restokExpanded ? (
                  <ChevronUp className="h-5 w-5 text-amber-600 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-amber-600 transition-transform duration-300" />
                )}
              </div>
            </div>
          </div>
        </button>

        {restokExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restokItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card col-span-full">
                <p>No items yet</p>
              </div>
            ) : (
              restokItems.map((item) => {
                const getStockStatus = (quantity: number, lowStock: number) => {
                  if (quantity === 0) return "out-of-stock";
                  if (quantity < lowStock) return "low-stock";
                  return "normal";
                };

                const getItemStockStatus = (item: any): string => {
                  if (item.subItems && item.subItems.length > 0) {
                    if (item.subItems.some((sub: any) => sub.quantity === 0))
                      return "out-of-stock";
                    if (item.subItems.some((sub: any) => sub.quantity < sub.lowStock))
                      return "low-stock";
                    return "normal";
                  }
                  return getStockStatus(item.quantity, item.lowStock);
                };

                const getStatusColor = (status: string) => {
                  if (status === "out-of-stock") return "bg-red-100 border border-red-300";
                  if (status === "low-stock") return "bg-yellow-100 border border-yellow-300";
                  return "bg-green-100 border border-green-300";
                };

                const getStatusBadge = (status: string) => {
                  if (status === "out-of-stock")
                    return <span className="text-xs font-bold text-red-700">OUT OF STOCK</span>;
                  if (status === "low-stock")
                    return <span className="text-xs font-bold text-yellow-700">LOW STOCK</span>;
                  return <span className="text-xs font-bold text-green-700">NORMAL</span>;
                };

                const status = getItemStockStatus(item);
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg p-4 ${getStatusColor(status)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {item.name}
                        </h3>
                        {item.note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.note}
                          </p>
                        )}
                        {item.subItems && item.subItems.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.subItems.length} sub-item{item.subItems.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {item.subItems && item.subItems.length === 0 && (
                          <p className="font-bold text-sm mb-1">{item.quantity}</p>
                        )}
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* Machine board */}
      <section>
        <button
          onClick={() => setMachineListExpanded(!machineListExpanded)}
          className="w-full mb-6 group"
          title={machineListExpanded ? "Collapse machines list" : "Expand machines list"}
        >
          <div className="flex items-center gap-4 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:border-purple-300 transition-all duration-300 group-hover:shadow-lg group-hover:from-purple-100 group-hover:to-pink-100">
            <Layers className="h-6 w-6 text-purple-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-slate-900 flex-1 text-left">
              Machines
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                {Object.values(pipeline.board).flat().length}
              </Badge>
              <div className="p-2 rounded-lg bg-white/60 group-hover:bg-white transition-colors duration-300">
                {machineListExpanded ? (
                  <ChevronUp className="h-5 w-5 text-purple-600 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-purple-600 transition-transform duration-300" />
                )}
              </div>
            </div>
          </div>
        </button>

        {machineListExpanded && (
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
            onNext={(o) => handleMoveNext(o.id)}
          />
        )}
      </section>
    </div>
  );
}
