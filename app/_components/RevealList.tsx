"use client";

import { useReveal } from "./useReveal";

export function RevealList({ children }: { children: React.ReactNode }) {
  const { ref, className } = useReveal<HTMLUListElement>();
  return (
    <ul ref={ref} className={"pm-list list-none p-0 m-0 " + className}>
      {children}
    </ul>
  );
}
