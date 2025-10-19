import ModelForm from "@/components/pipeline/ModelForm";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";

export default function NewModel() {
  const pipeline = useProductionPipeline();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create New Model</h1>
      <p className="text-muted-foreground">
        Use the form below to add a new work order.
      </p>
      <ModelForm
        onCreate={(data) => {
          pipeline.createWorkOrder({
            modelName: data.modelName,
            quantity: data.quantity,
            createdAt: data.createdAt,
            path: data.path as any,
          });
        }}
      />
    </div>
  );
}
