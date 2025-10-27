import ModelForm from "@/components/pipeline/ModelForm";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";
import { useNavigate } from "react-router-dom";

export default function NewModel() {
  const pipeline = useProductionPipeline();
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create New Model</h1>
      <ModelForm
        inline
        onCreate={async (data) => {
          try {
            await pipeline.createWorkOrder({
              modelName: data.modelName,
              quantity: data.quantity,
              createdAt: data.createdAt,
              path: data.path as any,
            });
            navigate("/models/all");
          } catch (error) {
            console.error("Failed to create model:", error);
          }
        }}
        onCancel={() => navigate("/models/all")}
      />
    </div>
  );
}
