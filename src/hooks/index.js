import { useState, useEffect, useCallback, useRef } from "react";

// ─── DEBOUNCE ──────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── LOCAL SEARCH / FILTER ────────────────────────────────
export function useSearch(items = [], fields = ["title", "description"]) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);

  const results = debouncedQuery
    ? items.filter(item =>
        fields.some(field =>
          String(item[field] || "").toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      )
    : items;

  return { query, setQuery, results };
}

// ─── PAGINATION ───────────────────────────────────────────
export function usePagination(items = [], pageSize = 12) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / pageSize);
  const paginated = items.slice((page - 1) * pageSize, page * pageSize);

  const nextPage = () => setPage(p => Math.min(p + 1, totalPages));
  const prevPage = () => setPage(p => Math.max(p - 1, 1));
  const goToPage = (n) => setPage(Math.max(1, Math.min(n, totalPages)));

  // Reset to first page when items change
  useEffect(() => { setPage(1); }, [items.length]);

  return { page, totalPages, paginated, nextPage, prevPage, goToPage };
}

// ─── FIRESTORE COLLECTION ────────────────────────────────
export function useCollection(fetcher, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e.message);
      console.error(e);
    }
    setLoading(false);
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

// ─── WINDOW SIZE ──────────────────────────────────────────
export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}

// ─── CLICK OUTSIDE ───────────────────────────────────────
export function useClickOutside(callback) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) callback(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [callback]);
  return ref;
}

// ─── LOCAL STORAGE ────────────────────────────────────────
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch { return initial; }
  });

  const set = useCallback((newVal) => {
    setValue(newVal);
    try { localStorage.setItem(key, JSON.stringify(newVal)); } catch { }
  }, [key]);

  return [value, set];
}
