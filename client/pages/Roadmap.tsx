import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import RoadmapCard from "@/components/roadmap/RoadmapCard";
import ModelSelectionModal from "@/components/roadmap/ModelSelectionModal";
import { useProductionPipeline } from "@/hooks/useProductionPipeline";

export interface RoadmapItem {
  title: string;
  modelIds: string[];
}

export interface RoadmapCard {
  id: string;
  title: string;
  modelIds: string[];
}

const STORAGE_KEY = "roadmap_cards";

export default function Roadmap() {
  const [cards, setCards] = useState<RoadmapCard[]>([]);
  const [showModelModal, setShowModelModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const pipeline = useProductionPipeline();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCards(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to load roadmap cards from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.warn("Failed to save roadmap cards to localStorage:", error);
    }
  }, [cards]);

  const handleAddCard = () => {
    const newCard: RoadmapCard = {
      id: `card_${Date.now()}`,
      title: "New Phase",
      modelIds: [],
    };
    setCards([...cards, newCard]);
  };

  const handleUpdateCardTitle = (cardId: string, newTitle: string) => {
    setCards(
      cards.map((card) =>
        card.id === cardId ? { ...card, title: newTitle } : card,
      ),
    );
  };

  const handleAddModels = (cardId: string) => {
    setSelectedCardId(cardId);
    setShowModelModal(true);
  };

  const handleSelectModels = (selectedModelIds: string[]) => {
    if (selectedCardId) {
      setCards(
        cards.map((card) => {
          if (card.id === selectedCardId) {
            const newModelIds = Array.from(
              new Set([...card.modelIds, ...selectedModelIds]),
            );
            return { ...card, modelIds: newModelIds };
          }
          return card;
        }),
      );
    }
    setShowModelModal(false);
    setSelectedCardId(null);
  };

  const handleRemoveModel = (cardId: string, modelId: string) => {
    setCards(
      cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              modelIds: card.modelIds.filter((id) => id !== modelId),
            }
          : card,
      ),
    );
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter((card) => card.id !== cardId));
  };

  const getModelsByIds = (modelIds: string[]) => {
    return modelIds
      .map((id) => pipeline.orders.find((order) => order.id === id))
      .filter(Boolean);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Roadmap</h1>
        <Button onClick={handleAddCard}>
          <Plus className="h-4 w-4 mr-2" />
          Add Phase
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No phases yet</p>
          <Button onClick={handleAddCard}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Phase
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <RoadmapCard
              key={card.id}
              card={card}
              models={getModelsByIds(card.modelIds)}
              onUpdateTitle={handleUpdateCardTitle}
              onAddModels={handleAddModels}
              onRemoveModel={handleRemoveModel}
              onDeleteCard={handleDeleteCard}
            />
          ))}
        </div>
      )}

      <ModelSelectionModal
        open={showModelModal && selectedCardId !== null}
        onSelect={handleSelectModels}
        onClose={() => {
          setShowModelModal(false);
          setSelectedCardId(null);
        }}
        allModels={pipeline.orders}
        excludeModelIds={
          cards.find((c) => c.id === selectedCardId)?.modelIds || []
        }
      />
    </div>
  );
}
