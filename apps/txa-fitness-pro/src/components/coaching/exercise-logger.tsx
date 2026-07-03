"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { Plus, X, Info, Timer, Play, Pause, ChevronRight } from "lucide-react";
import { ExercisePreset, SetLog } from "@/types/domain";
import { ExerciseIllustration } from "@/components/coaching/exercise-illustration";
import { v4 as uuidv4 } from "uuid";
import { getExerciseDetails } from "@/lib/workouts/exercise-dictionary";
import Image from "next/image";

interface ExerciseLoggerProps {
  preset: ExercisePreset;
  sessionId: string;
  onLogSet: (exerciseId: string, setLog: SetLog) => void;
  existingLog?: { id: string; sets: SetLog[] };
}

const DIFFICULTY_BADGES: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  advanced: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ExerciseLogger({
  preset,
  onLogSet,
  existingLog,
}: ExerciseLoggerProps) {
  const [exerciseId] = useState(existingLog?.id ?? uuidv4());
  const [sets, setSets] = useState<SetLog[]>(existingLog?.sets ?? []);
  const [reps, setReps] = useState(preset.defaultReps);
  const [weight, setWeight] = useState(0);
  const [rpe, setRpe] = useState(7);

  // Timer State
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Details Modal State
  const [showDetails, setShowDetails] = useState(false);
  const details = getExerciseDetails(preset.name);

  // Timer Effect
  useEffect(() => {
    if (isResting && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isResting) {
      setIsResting(false);
      // Optional: Play a subtle beep sound here if we had an audio file
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isResting, timeLeft]);

  const startRestTimer = () => {
    setTimeLeft(preset.restSeconds || 60);
    setIsResting(true);
  };

  const stopRestTimer = () => {
    setIsResting(false);
    setTimeLeft(0);
  };

  const handleAddSet = () => {
    const setNumber = sets.length + 1;
    const newSet: SetLog = {
      id: uuidv4(),
      exerciseLogId: exerciseId,
      setNumber,
      reps,
      weight,
      rpe,
      duration: 0,
      completed: true,
    };
    const updatedSets = [...sets, newSet];
    setSets(updatedSets);
    onLogSet(exerciseId, newSet);
    
    // Auto-start rest timer
    startRestTimer();
  };

  const handleRemoveSet = (setNumber: number) => {
    setSets((prev) => prev.filter((s) => s.setNumber !== setNumber));
  };

  const volume = sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
  const badgeColor = DIFFICULTY_BADGES[preset.difficulty ?? ""] ?? "";

  return (
    <>
      <Card variant="bordered" className="p-4 sm:p-5 relative overflow-hidden transition-all">
        {/* Active Timer Overlay Background */}
        {isResting && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-brand-500 transition-all ease-linear duration-1000"
            style={{ width: `${(timeLeft / (preset.restSeconds || 60)) * 100}%` }}
          />
        )}

        <div className="flex items-start gap-3 sm:gap-4 mb-3">
          <button 
            onClick={() => setShowDetails(true)}
            className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden relative group cursor-pointer border border-surface-200 dark:border-surface-700 hover:border-brand-500 transition-colors"
          >
            {details?.imageUrl ? (
              <Image src={details.imageUrl} alt={preset.name} fill className="object-cover" sizes="80px" />
            ) : (
              <ExerciseIllustration exerciseName={preset.name} size={40} />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
          </button>
          
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-bold text-surface-900 dark:text-white text-base leading-tight flex items-center gap-2">
                  {preset.name}
                  <button onClick={() => setShowDetails(true)} className="text-surface-400 hover:text-brand-500">
                    <Info className="w-4 h-4" />
                  </button>
                </h3>
                {preset.difficulty && (
                  <span className={cn("inline-block mt-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold", badgeColor)}>
                    {preset.difficulty}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-surface-500 dark:text-surface-400 mt-1">
              <span className="capitalize text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 px-1.5 rounded">{preset.targetMuscle}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {preset.restSeconds}s</span>
              {preset.variation && (
                <>
                  <span>·</span>
                  <span className="text-brand-600 dark:text-brand-400 truncate max-w-[120px]">{preset.variation}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sets List */}
        {sets.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-5 gap-2 mb-2 text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-wider pb-2 border-b border-surface-100 dark:border-surface-800">
              <span className="text-center">Set</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Kg</span>
              <span className="text-center">RPE</span>
              <span></span>
            </div>
            <div className="space-y-2">
              {sets.map((set) => (
                <div key={set.id} className="grid grid-cols-5 gap-2 items-center text-sm font-medium bg-surface-50 dark:bg-surface-900/50 py-2 rounded-lg">
                  <span className="text-center text-surface-500 dark:text-surface-400">{set.setNumber}</span>
                  <span className="text-center text-surface-900 dark:text-surface-100">{set.reps}</span>
                  <span className="text-center text-surface-900 dark:text-surface-100">{set.weight}</span>
                  <span className="text-center text-brand-600 dark:text-brand-400">{set.rpe}</span>
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleRemoveSet(set.setNumber)}
                      className="text-surface-300 hover:text-red-500 dark:text-surface-600 dark:hover:text-red-400 transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input & Timer Area */}
        <div className="pt-3 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center gap-3">
          
          {isResting ? (
            <div className="flex-1 flex items-center justify-between bg-brand-50 dark:bg-brand-900/20 px-4 py-2.5 rounded-xl border border-brand-100 dark:border-brand-800/50">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-brand-500 animate-pulse" />
                <span className="font-bold text-brand-700 dark:text-brand-300">Descanso: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
              </div>
              <button 
                onClick={stopRestTimer}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 flex items-center gap-1 bg-white dark:bg-surface-800 px-2 py-1 rounded shadow-sm"
              >
                Omitir
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase bg-white dark:bg-surface-900 px-1 text-surface-400">Reps</label>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-700 focus:border-brand-500 focus:ring-0 text-center transition-colors"
                />
              </div>
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase bg-white dark:bg-surface-900 px-1 text-surface-400">Kg</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-700 focus:border-brand-500 focus:ring-0 text-center transition-colors"
                />
              </div>
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-2 text-[10px] font-bold uppercase bg-white dark:bg-surface-900 px-1 text-surface-400">RPE</label>
                <select
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                  className="w-full px-1 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-surface-900 border-2 border-surface-200 dark:border-surface-700 focus:border-brand-500 focus:ring-0 text-center transition-colors appearance-none text-brand-600 dark:text-brand-400"
                >
                  {[6, 7, 8, 9, 10].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleAddSet}
            disabled={isResting}
            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Registrar Set
          </button>
        </div>
      </Card>

      {/* Premium Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/80 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-surface-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-64 w-full bg-surface-100 dark:bg-surface-800 flex-shrink-0">
              {details?.imageUrl ? (
                <Image src={details.imageUrl} alt={preset.name} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ExerciseIllustration exerciseName={preset.name} size={100} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button 
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-black text-white leading-tight">{preset.name}</h2>
                <p className="text-white/80 text-sm font-medium capitalize mt-1">{preset.targetMuscle}</p>
              </div>
            </div>
            
            <div className="p-5 flex-1">
              {details ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-3 flex items-center gap-2">
                      <div className="w-6 h-[1px] bg-surface-200 dark:bg-surface-700"></div>
                      Técnica Correcta
                    </h4>
                    <ol className="space-y-3">
                      {details.instructions.map((inst, i) => (
                        <li key={i} className="flex gap-3 text-sm text-surface-600 dark:text-surface-300">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{inst}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  {details.commonMistakes.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-3 flex items-center gap-2">
                        Erros Comunes
                      </h4>
                      <ul className="space-y-2">
                        {details.commonMistakes.map((mistake, i) => (
                          <li key={i} className="flex gap-2 text-sm text-red-700 dark:text-red-300/80">
                            <span className="font-bold text-red-400 mt-0.5">•</span>
                            <span className="leading-relaxed">{mistake}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-surface-500">
                  <Info className="w-10 h-10 mx-auto mb-3 text-surface-300" />
                  <p>Instrucciones detalladas no disponibles para este ejercicio.</p>
                </div>
              )}
              
              <button 
                onClick={() => setShowDetails(false)}
                className="w-full mt-6 py-3 rounded-xl font-bold bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              >
                Entendido, volver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
