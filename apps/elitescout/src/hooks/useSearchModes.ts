import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useSearchModes() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"product" | "travel">("product");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Safe hydration of local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("elitescout_recent");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse recent searches", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("elitescout_recent", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save recent searches", e);
    }
  };

  const handleProductSearch = (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery.trim()) return;
    
    saveRecentSearch(finalQuery.trim());
    
    const params = new URLSearchParams({
      q: finalQuery.trim(),
    });
    if (searchMode === "travel") {
      params.append("type", "travel");
    }
    
    router.push(`/results?${params.toString()}`);
  };

  const handleTravelSearch = (data: any) => {
    const travelQuery = `Viaje de ${data.origin} a ${data.destination} en ${data.mode}`;
    saveRecentSearch(travelQuery);
    
    const params = new URLSearchParams({
      q: travelQuery,
      type: "travel",
      origin: data.origin,
      dest: data.destination,
      mode: data.mode,
      depart: data.departDate,
      return: data.returnDate || "",
      adults: String(data.adults),
      children: String(data.children),
      infants: String(data.infants),
      tripType: data.tripType,
    });
    
    router.push(`/results?${params.toString()}`);
  };

  const setMode = (mode: "product" | "travel") => {
    setSearchMode(mode);
    setQuery(""); // Clear query on mode switch to avoid confusion
  };

  return {
    query,
    setQuery,
    searchMode,
    setSearchMode: setMode,
    recentSearches,
    isLoaded,
    handleProductSearch,
    handleTravelSearch
  };
}
