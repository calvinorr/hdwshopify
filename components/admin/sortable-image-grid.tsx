"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageItem {
  id?: number;
  url: string;
  alt?: string | null;
  position?: number | null;
}

interface SortableImageProps {
  image: ImageItem;
  index: number;
  onRemove: () => void;
}

function SortableImage({ image, index, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.url }); // Use URL as unique ID since new images don't have IDs

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden bg-stone-100 group",
        isDragging && "opacity-50 z-10"
      )}
    >
      <img
        src={image.url}
        alt={image.alt || "Product image"}
        className="h-full w-full object-cover"
      />

      {/* Position badge */}
      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded font-medium">
        {index + 1}
      </div>

      {/* Drag handle */}
      <button
        type="button"
        className="absolute top-2 left-2 p-1.5 bg-white/90 hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shadow-sm"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5 text-stone-600" />
      </button>

      {/* Remove button */}
      <button
        type="button"
        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function ImageOverlay({ image }: { image: ImageItem }) {
  return (
    <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 shadow-xl rotate-2 scale-105">
      <img
        src={image.url}
        alt={image.alt || "Product image"}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

interface SortableImageGridProps {
  images: ImageItem[];
  onReorder: (images: ImageItem[]) => void;
  onRemove: (index: number) => void;
  renderUploader: () => React.ReactNode;
}

export function SortableImageGrid({
  images,
  onReorder,
  onRemove,
  renderUploader,
}: SortableImageGridProps) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeImage = activeUrl
    ? images.find((img) => img.url === activeUrl)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveUrl(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveUrl(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.url === active.id);
    const newIndex = images.findIndex((img) => img.url === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(images, oldIndex, newIndex);
      // Update positions
      const withPositions = newOrder.map((img, idx) => ({
        ...img,
        position: idx,
      }));
      onReorder(withPositions);
    }
  };

  if (images.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {renderUploader()}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={images.map((img) => img.url)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <SortableImage
              key={image.url}
              image={image}
              index={index}
              onRemove={() => onRemove(index)}
            />
          ))}
          {renderUploader()}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeImage ? <ImageOverlay image={activeImage} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
