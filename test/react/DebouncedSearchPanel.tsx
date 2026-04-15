import React, { useEffect, useMemo, useRef, useState } from "react";

type Item = {
  id: number;
  label: string;
  tags: string[];
};

type Props = {
  items: Item[];
  onSelect?: (item: Item | null) => void;
};

export default function DebouncedSearchPanel({ items, onSelect }: Props) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setQuery(input.trim().toLowerCase());
    }, 250);

    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [input]);

  const filtered = useMemo(() => {
    if (!query) return items;

    return items.filter((item) => {
      const haystack = [item.label, ...item.tags].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [items, query]);

  useEffect(() => {
    const exists = filtered.some((item) => item.id === selectedId);
    if (!exists) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    const selected = filtered.find((item) => item.id === selectedId) ?? null;
    onSelect?.(selected);
  }, [filtered, selectedId, onSelect]);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
      <label style={{ display: "grid", gap: 4 }}>
        <span>Search</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type label or tag"
        />
      </label>

      <div style={{ fontSize: 12, color: "#666" }}>
        Showing {filtered.length} of {items.length}
      </div>

      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
        {filtered.map((item) => {
          const selected = item.id === selectedId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: 12,
                  borderRadius: 8,
                  border: selected ? "2px solid black" : "1px solid #ccc",
                  background: selected ? "#f5f5f5" : "white",
                }}
              >
                <div>{item.label}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{item.tags.join(", ")}</div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
