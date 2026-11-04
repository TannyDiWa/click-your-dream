"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type ComboOption = {
  value: string;
  label: string;
  /** Small text under the label, e.g. "81 หลักสูตร" or "ภาษาไทย ปกติ • วิทยาเขตหลัก" */
  meta?: string;
  /** Options with the same group are listed under one heading, in order */
  group?: string;
};

// Thai has no case; ignore spaces and dots so "ม.เกษตร" finds "มหาวิทยาลัยเกษตรศาสตร์" via "เกษตร".
const normalize = (s: string) => s.toLowerCase().replace(/[\s.]/g, "");

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-[#ffe1f0] px-0.5 text-[#c75d97]">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * Text field that filters a list and opens a styled listbox (WAI-ARIA combobox pattern):
 * type to search, ↑/↓ to move, Enter to choose, Esc to close.
 */
export function Combobox({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
  unit,
}: {
  label: ReactNode;
  placeholder: string;
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  /** Counted thing in the status line, e.g. "มหาวิทยาลัย" */
  unit: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value);
  const q = normalize(query);
  const shown = q ? options.filter((o) => normalize(`${o.label} ${o.meta ?? ""} ${o.group ?? ""}`).includes(q)) : options;
  const activeIndex = Math.min(active, Math.max(shown.length - 1, 0));

  // Keep the highlighted option in view while moving with the keyboard.
  useEffect(() => {
    if (!open) return;
    // Scroll only the list: scrollIntoView would also scroll the page's clipped containers.
    const list = listRef.current;
    const option = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!list || !option) return;
    const top = option.offsetTop - list.offsetTop;
    if (top < list.scrollTop + 32) list.scrollTop = Math.max(top - 32, 0);
    else if (top + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top + option.offsetHeight - list.clientHeight;
  }, [open, activeIndex]);

  function openList() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    // Start on the current choice so ↓ continues from it.
    setActive(Math.max(options.findIndex((o) => o.value === value), 0));
  }

  function choose(option: ComboOption | undefined) {
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return openList();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (Math.min(a, shown.length - 1) + step + shown.length) % Math.max(shown.length, 1));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();
      choose(shown[activeIndex]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      <div className="relative">
        <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 fill-none stroke-[#8a97c2] stroke-2">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M13 13l4 4" strokeLinecap="round" />
        </svg>
        {/* leading-8: an input clips text to its line box, and stacked Thai marks (ชื่อ) need the room. */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[activeIndex] ? `${id}-opt-${activeIndex}` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : (selected?.label ?? "")}
          placeholder={loading ? "กำลังโหลด…" : open && selected ? selected.label : placeholder}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            setQuery("");
          }}
          onKeyDown={onKeyDown}
          className={`w-full truncate rounded-[20px] border-[1.5px] bg-[#f4f7ff] py-2 pl-11 pr-11 text-[15px] leading-8 text-navy transition placeholder:text-[#8a97c2] hover:border-[#c4d0ee] hover:bg-white focus:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5397e9] disabled:cursor-not-allowed disabled:opacity-60 ${
            open ? "border-[#f6a0ce] bg-white" : "border-[#dbe3f5]"
          }`}
        />
        <svg
          aria-hidden
          viewBox="0 0 14 8"
          className={`pointer-events-none absolute right-[18px] top-1/2 h-2 w-3.5 -translate-y-1/2 fill-none stroke-violet stroke-2 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-[22px] border-[1.5px] border-[#e3e6f5] bg-paper shadow-[0_18px_40px_rgba(52,90,158,0.18)]">
          <p className="border-b border-[#ebedf7] px-4 py-2 text-xs text-muted" aria-live="polite">
            {q ? `พบ ${shown.length} จาก ${options.length} ${unit}` : `${options.length} ${unit} • พิมพ์เพื่อค้นหา`}
          </p>
          <ul ref={listRef} id={listId} role="listbox" aria-label={typeof label === "string" ? label : unit} className="max-h-[min(340px,55vh)] overflow-y-auto overscroll-contain py-1.5">
            {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">ไม่พบ “{query}” ลองพิมพ์คำอื่น หรือพิมพ์ให้สั้นลง</li>}
            {shown.map((o, i) => {
              const isActive = i === activeIndex;
              const isSelected = o.value === value;
              const newGroup = o.group && o.group !== shown[i - 1]?.group;
              return (
                <li key={o.value} role="presentation">
                  {newGroup && (
                    <p role="presentation" className="sticky top-0 z-10 bg-paper/95 px-4 pb-1 pt-2.5 text-xs font-bold text-violet backdrop-blur">
                      {o.group}
                    </p>
                  )}
                  <div
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    data-index={i}
                    // Keep focus in the input so blur does not close the list before the click lands.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(o)}
                    onMouseMove={() => !isActive && setActive(i)}
                    className={`mx-1.5 flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 ${isActive ? "bg-[#eef3ff]" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[15px] leading-snug ${isSelected ? "font-bold" : ""}`}>
                        <Highlight text={o.label} query={query} />
                      </span>
                      {o.meta && <span className="mt-0.5 block text-xs leading-snug text-muted">{o.meta}</span>}
                    </span>
                    {isSelected && (
                      <span aria-hidden className="mt-0.5 text-[15px] font-bold text-[#c75d97]">
                        ✓
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
