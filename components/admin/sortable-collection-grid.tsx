"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  GripVertical,
  FolderTree,
  MoreHorizontal,
  Edit,
  Trash2,
  Image as ImageIcon,
  Star,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  draft: { label: "Draft", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  active: { label: "Active", className: "bg-green-100 text-green-800 border-green-200" },
  archived: { label: "Archived", className: "bg-stone-100 text-stone-600 border-stone-200" },
} as const;

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  status: string | null;
  featured: boolean | null;
  productCount: number;
}

interface Props {
  collections: Collection[];
}

function SortableCollectionCard({
  collection,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  collection: Collection;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collection.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="aspect-video bg-stone-100 relative">
        {collection.image ? (
          <img
            src={collection.image}
            alt={collection.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <FolderTree className="h-10 w-10 text-stone-300" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={statusConfig[collection.status as keyof typeof statusConfig]?.className || statusConfig.active.className}
          >
            {statusConfig[collection.status as keyof typeof statusConfig]?.label || "Active"}
          </Badge>
          {collection.featured && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="h-8 w-8 bg-white/90 hover:bg-white rounded-md flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-stone-500" />
          </button>

          {/* Keyboard controls */}
          <div className="flex flex-col">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="h-4 w-8 bg-white/90 hover:bg-white rounded-t-md flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <ChevronUp className="h-3 w-3 text-stone-500" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="h-4 w-8 bg-white/90 hover:bg-white rounded-b-md flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <ChevronDown className="h-3 w-3 text-stone-500" />
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/collections/${collection.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/collections/${collection.slug}`} target="_blank">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  View on site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <Link
        href={`/admin/collections/${collection.id}`}
        className="block p-4"
      >
        <h3 className="font-medium text-stone-900">{collection.name}</h3>
        <p className="text-sm text-stone-500 mt-1">
          {collection.productCount} product
          {collection.productCount !== 1 ? "s" : ""}
        </p>
        {collection.description && (
          <p className="text-sm text-stone-600 mt-2 line-clamp-2">
            {collection.description}
          </p>
        )}
      </Link>
    </div>
  );
}

function CollectionCardOverlay({ collection }: { collection: Collection }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden shadow-xl rotate-2 scale-105">
      <div className="aspect-video bg-stone-100 relative">
        {collection.image ? (
          <img
            src={collection.image}
            alt={collection.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <FolderTree className="h-10 w-10 text-stone-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-stone-900">{collection.name}</h3>
      </div>
    </div>
  );
}

export function SortableCollectionGrid({ collections: initialCollections }: Props) {
  const router = useRouter();
  const [collections, setCollections] = useState(initialCollections);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const activeCollection = activeId
    ? collections.find((c) => c.id === activeId)
    : null;

  const saveOrder = async (newOrder: Collection[]) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/collections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: newOrder.map((c) => c.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save order");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to save order:", error);
      // Revert to original order on error
      setCollections(initialCollections);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = collections.findIndex((c) => c.id === active.id);
    const newIndex = collections.findIndex((c) => c.id === over.id);

    const newOrder = arrayMove(collections, oldIndex, newIndex);
    setCollections(newOrder);
    saveOrder(newOrder);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = arrayMove(collections, index, index - 1);
    setCollections(newOrder);
    saveOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === collections.length - 1) return;
    const newOrder = arrayMove(collections, index, index + 1);
    setCollections(newOrder);
    saveOrder(newOrder);
  };

  return (
    <div className="relative">
      {isSaving && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
          <div className="text-sm text-stone-600">Saving order...</div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={collections.map((c) => c.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection, index) => (
              <SortableCollectionCard
                key={collection.id}
                collection={collection}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                isFirst={index === 0}
                isLast={index === collections.length - 1}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCollection ? (
            <CollectionCardOverlay collection={activeCollection} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
