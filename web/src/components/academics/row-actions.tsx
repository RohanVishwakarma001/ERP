"use client";

import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/button";

/** Edit / delete buttons for one table row. `name` makes each label unique for screen readers. */
export function RowActions({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <IconButton label={`Edit ${name}`} onClick={onEdit}>
        <Pencil className="w-4 h-4" aria-hidden />
      </IconButton>
      <IconButton label={`Delete ${name}`} onClick={onDelete} className="hover:text-red-700 hover:bg-red-50">
        <Trash2 className="w-4 h-4" aria-hidden />
      </IconButton>
    </div>
  );
}
