"use client";

import { useMemo, useRef, useState } from "react";
import { X, Plus, Tag as TagIcon, ChevronDown } from "lucide-react";
import { useClickOutside } from "@/lib/useClickOutside";

export function TagPicker({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false));

  const availableSuggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    return suggestions
      .filter((t) => !value.includes(t))
      .filter((t) => !q || t.toLowerCase().includes(q))
      .slice(0, 8);
  }, [suggestions, value, inputValue]);

  const canCreate =
    inputValue.trim().length > 0 &&
    !value.some((t) => t.toLowerCase() === inputValue.trim().toLowerCase()) &&
    !suggestions.some((t) => t.toLowerCase() === inputValue.trim().toLowerCase());

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || value.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
      e.currentTarget.blur();
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="input flex min-h-[42px] flex-wrap items-center gap-1.5 py-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/20"
              aria-label={`${tag} etiketini kaldır`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          className="min-w-[100px] flex-1 border-none bg-transparent p-0.5 text-sm outline-none placeholder:text-slate-400"
          placeholder={value.length === 0 ? "Etiket ara veya yeni ekle..." : ""}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label={open ? "Etiket listesini kapat" : "Etiket listesini aç"}
        >
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (availableSuggestions.length > 0 || canCreate) && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {availableSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-brand-50 dark:hover:bg-slate-700"
            >
              <TagIcon size={13} className="text-slate-400" /> {tag}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-1.5 text-left text-sm text-brand-700 hover:bg-brand-50 dark:border-slate-700 dark:text-brand-400 dark:hover:bg-slate-700"
            >
              <Plus size={13} /> "{inputValue.trim()}" olarak ekle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
