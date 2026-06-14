"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get("search") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Push the (debounced) search term into the URL so the server component
  // re-renders with the new ?search= param. Mirrors the previous GET form:
  // a search resets to /products?search=… (clearing category/page).
  useEffect(() => {
    timer.current = setTimeout(() => {
      const next = value.trim()
        ? `/products?search=${encodeURIComponent(value.trim())}`
        : "/products";
      router.replace(next, { scroll: false });
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, router]);

  return (
    <div className="w-full sm:w-72">
      <Input
        type="search"
        name="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        className="h-9"
      />
    </div>
  );
}
