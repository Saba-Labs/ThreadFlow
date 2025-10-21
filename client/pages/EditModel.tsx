import { useNavigate, useParams } from "react-router-dom";
import ModelForm from "@/components/pipeline/ModelForm";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";

export default function EditModel() {
  const { id } = useParams();
  const pipeline = useProductionPipeline();
  const navigate = useNavigate();

  const order = pipeline.orders.find((o) => o.id === id);
  if (!order) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Model not found</h1>
        <p className="text-sm text-muted-foreground">The requested model was not found.</p>
      </div>
    );
  }

  const initialData = {
    modelName: order.modelName,
    quantity: order.quantity,
    createdAt: order.createdAt,
    path: order.steps.map((st) =>
      st.kind === "machine"
        ? { kind: "machine", machineType: st.machineType! }
        : { kind: "job", externalUnitName: st.externalUnitName || "Job Work Unit" },
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Model</h1>
        <p className="text-muted-foreground">Update the work order details below.</p>
      </div>
      <ModelForm
        inline
        initialData={initialData}
        onCreate={(data) => {
          pipeline.updateOrder(order.id, {
            modelName: data.modelName,
            quantity: data.quantity,
            createdAt: data.createdAt,
            path: data.path as any,
          });
          navigate("/models/all");
        }}
      />
    </div>
  );
}
