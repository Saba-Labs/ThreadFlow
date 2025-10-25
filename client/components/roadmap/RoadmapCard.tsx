import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { WorkOrder } from "@/hooks/useProductionPipeline";

interface RoadmapCardProps {
  card: {
    id: string;
    title: string;
    modelIds: string[];
  };
  models: (WorkOrder | undefined)[];
  onUpdateTitle: (cardId: string, newTitle: string) => void;
  onAddModels: (cardId: string) => void;
  onRemoveModel: (cardId: string, modelId: string) => void;
  onMoveModel: (cardId: string, modelIndex: number, direction: "up" | "down") => void;
  onDeleteCard: (cardId: string) => void;
}

export default function RoadmapCard({
  card,
  models,
  onUpdateTitle,
  onAddModels,
  onRemoveModel,
  onDeleteCard,
}: RoadmapCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(card.title);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(card.id, tempTitle);
    } else {
      setTempTitle(card.title);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setTempTitle(card.title);
      setIsEditingTitle(false);
    }
  };

  const validModels = models.filter(Boolean) as WorkOrder[];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {isEditingTitle ? (
            <Input
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="text-lg font-semibold"
              placeholder="Phase title"
            />
          ) : (
            <CardTitle
              onClick={() => setIsEditingTitle(true)}
              className="cursor-pointer hover:text-blue-600 transition-colors"
            >
              {card.title}
            </CardTitle>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteCard(card.id)}
            className="h-6 w-6"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Models in this phase</h3>
          <div className="space-y-2">
            {validModels.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No models added yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {validModels.map((model) => (
                  <Badge
                    key={model.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span>{model.modelName}</span>
                    <button
                      onClick={() => onRemoveModel(card.id, model.id)}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={() => onAddModels(card.id)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Models
        </Button>
      </CardContent>
    </Card>
  );
}
