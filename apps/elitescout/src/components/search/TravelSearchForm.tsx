"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface TravelSearchData {
  origin: string;
  destination: string;
  mode: "plane" | "train" | "car";
  departDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  tripType: "roundtrip" | "oneway";
}

interface TravelSearchFormProps {
  onSearch: (data: TravelSearchData) => void;
  isLoading?: boolean;
}

/**
 * Complete travel search form with date pickers, passenger selectors,
 * transport mode, and trip type controls.
 */
export function TravelSearchForm({ onSearch, isLoading }: TravelSearchFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState<"plane" | "train" | "car">("plane");
  const [departDate, setDepartDate] = useState(today);
  const [returnDate, setReturnDate] = useState(nextWeek);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [tripType, setTripType] = useState<"roundtrip" | "oneway">("roundtrip");
  const [showPassengers, setShowPassengers] = useState(false);

  const totalPassengers = adults + children + infants;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    onSearch({ origin, destination, mode, departDate, returnDate, adults, children, infants, tripType });
  };

  const passengerLabel = `${adults} adulto${adults !== 1 ? "s" : ""}${children ? `, ${children} niño${children !== 1 ? "s" : ""}` : ""}${infants ? `, ${infants} bebé${infants !== 1 ? "s" : ""}` : ""}`;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-4xl mx-auto glass rounded-2xl p-6 travel-active"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Row 1: Trip type + Transport mode */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setTripType("roundtrip")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tripType === "roundtrip" ? "bg-gold/20 text-gold" : "text-text-muted hover:text-foreground"
            }`}
          >
            Ida y vuelta
          </button>
          <button
            type="button"
            onClick={() => setTripType("oneway")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tripType === "oneway" ? "bg-gold/20 text-gold" : "text-text-muted hover:text-foreground"
            }`}
          >
            Solo ida
          </button>
        </div>

        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
          {(["plane", "train", "car"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === m ? "bg-gold/20 text-gold" : "text-text-muted hover:text-foreground"
              }`}
            >
              {m === "plane" && "✈️ Avión"}
              {m === "train" && "🚆 Tren"}
              {m === "car" && "🚗 Coche"}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Origin + Destination */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-widest ml-1">Origen</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold">📍</span>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ej: Madrid, Zaragoza..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-9 py-3 text-sm focus:border-gold/30 outline-none transition-all"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-widest ml-1">Destino</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan">🚩</span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ej: Canarias, Roma, París..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-9 py-3 text-sm focus:border-cyan/30 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Dates + Passengers + Submit */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Depart Date */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[10px] text-text-muted uppercase tracking-widest ml-1">Fecha ida</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold text-sm">📅</span>
            <input
              type="date"
              value={departDate}
              min={today}
              onChange={(e) => {
                setDepartDate(e.target.value);
                if (e.target.value > returnDate) setReturnDate(e.target.value);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-9 py-3 text-sm focus:border-gold/30 outline-none transition-all [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Return Date */}
        <div className={`md:col-span-3 space-y-1.5 transition-opacity ${tripType === "oneway" ? "opacity-30 pointer-events-none" : ""}`}>
          <label className="text-[10px] text-text-muted uppercase tracking-widest ml-1">Fecha vuelta</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan text-sm">📅</span>
            <input
              type="date"
              value={returnDate}
              min={departDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-9 py-3 text-sm focus:border-cyan/30 outline-none transition-all [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Passengers Dropdown */}
        <div className="md:col-span-3 space-y-1.5 relative">
          <label className="text-[10px] text-text-muted uppercase tracking-widest ml-1">Pasajeros</label>
          <button
            type="button"
            onClick={() => setShowPassengers(!showPassengers)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-left focus:border-gold/30 outline-none transition-all flex items-center gap-2"
          >
            <span className="text-gold">👥</span>
            <span className="truncate">{passengerLabel}</span>
            <span className="ml-auto text-text-muted text-xs">{showPassengers ? "▲" : "▼"}</span>
          </button>

          {showPassengers && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl p-4 z-50 shadow-2xl space-y-3"
            >
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Adultos</p>
                  <p className="text-[10px] text-text-muted">12+ años</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-all">−</button>
                  <span className="w-5 text-center text-sm font-bold">{adults}</span>
                  <button type="button" onClick={() => setAdults(Math.min(9, adults + 1))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-all">+</button>
                </div>
              </div>
              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Niños</p>
                  <p className="text-[10px] text-text-muted">2–11 años</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-all">−</button>
                  <span className="w-5 text-center text-sm font-bold">{children}</span>
                  <button type="button" onClick={() => setChildren(Math.min(6, children + 1))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-all">+</button>
                </div>
              </div>
              {/* Infants */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Bebés</p>
                  <p className="text-[10px] text-text-muted">0–1 años</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setInfants(Math.max(0, infants - 1))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-all">−</button>
                  <span className="w-5 text-center text-sm font-bold">{infants}</span>
                  <button type="button" onClick={() => setInfants(Math.min(4, infants + 1))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-all">+</button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPassengers(false)}
                className="w-full text-center text-xs text-gold font-bold py-2 mt-1 hover:underline"
              >
                Listo ({totalPassengers} pasajero{totalPassengers !== 1 ? "s" : ""})
              </button>
            </motion.div>
          )}
        </div>

        {/* Submit */}
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={isLoading || !destination.trim()}
            className="w-full bg-gold text-luxury-black font-bold py-3 rounded-xl hover:bg-vivid-gold transition-all shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Buscando..." : `🔍 Buscar viaje`}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan" /> Pack Alojamiento Incluido
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" /> Mejores Ofertas IA
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Comparador de Precios
        </span>
      </div>
    </motion.form>
  );
}
