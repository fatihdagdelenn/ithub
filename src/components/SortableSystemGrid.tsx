"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { SystemCard } from "@/components/SystemCard";
import type { SystemDTO } from "@/lib/types";

type CardProps = Omit<React.ComponentProps<typeof SystemCard>, "system" | "dragHandle">;

function SortableSystemCard({ system, cardProps }: { system: SystemDTO; cardProps: CardProps }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: system.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
    >
      <SystemCard
        system={system}
        {...cardProps}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none rounded-md p-1.5 text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
            title="Sürükleyerek sırala"
            aria-label="Sürükleyerek sırala"
          >
            <GripVertical size={16} />
          </button>
        }
      />
    </div>
  );
}

export function SortableSystemGrid({
  items,
  onReorder,
  cardProps,
}: {
  items: SystemDTO[];
  onReorder: (orderedIds: string[]) => void;
  cardProps: CardProps;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex).map((s) => s.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((s) => s.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((s) => (
            <SortableSystemCard key={s.id} system={s} cardProps={cardProps} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
