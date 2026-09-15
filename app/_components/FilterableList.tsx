"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Row, type RowData } from "./Row";
import type { Lang } from "@/lib/i18n";

export type FilterableItem = RowData & {
  searchIndex: string;
};

const PLACEHOLDER = {
  ja: "名前・エリアで探す",
  en: "Search by name or area",
};

const EMPTY = {
  ja: "見つかりませんでした。別の言葉で探してください。",
  en: "No matches. Try a different word.",
};

const SEARCH_LABEL = {
  ja: "スポットを絞り込む",
  en: "Filter listings",
};

export function FilterableList({
  items,
  lang,
  showSearch = true,
  hideWhenEmpty = false,
}: {
  items: FilterableItem[];
  lang: Lang;
  showSearch?: boolean;
  hideWhenEmpty?: boolean;
}) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLUListElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter((it) => it.searchIndex.toLowerCase().includes(query));
  }, [items, query]);
  const showList = !hideWhenEmpty || query.length > 0;

  return (
    <div className="space-y-3">
      {showSearch && (
        <label className="pm-search" aria-label={SEARCH_LABEL[lang]}>
          <MagnifyingGlassIcon />
          <input
            type="search"
            placeholder={PLACEHOLDER[lang]}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      )}
      {showList &&
        (filtered.length === 0 ? (
          <p className="text-[15px] text-text-secondary">{EMPTY[lang]}</p>
        ) : (
          <ul
            ref={ref}
            className={"pm-list list-none p-0 m-0 " + (inView ? "in" : "")}
          >
            {filtered.map((it) => (
              <Row key={it.slug} data={it} lang={lang} />
            ))}
          </ul>
        ))}
    </div>
  );
}

function MagnifyingGlassIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className="text-text-secondary"
      aria-hidden
    >
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11 L 14 14" />
    </svg>
  );
}
