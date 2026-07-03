"use client";

import { cn } from "@/utils/cn";
import Image from "next/image";
import { getExerciseDetails } from "@/lib/workouts/exercise-dictionary";

interface IllustrationProps {
  className?: string;
  size?: number;
}

function PushUpIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 100" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 0.83} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="20" y1="85" x2="35" y2="65" />
        <line x1="35" y1="65" x2="50" y2="75" />
        <circle cx="50" cy="75" r="6" />
        <line x1="50" y1="81" x2="50" y2="95" />
        <line x1="50" y1="95" x2="35" y2="95" />
        <line x1="50" y1="95" x2="65" y2="95" />
        <line x1="15" y1="60" x2="35" y2="65" strokeOpacity="0.5" />
        <line x1="65" y1="65" x2="85" y2="60" strokeOpacity="0.5" />
        <line x1="35" y1="65" x2="20" y2="55" />
        <line x1="65" y1="65" x2="80" y2="55" />
        <line x1="20" y1="55" x2="20" y2="30" strokeOpacity="0.4" />
        <line x1="80" y1="55" x2="80" y2="30" strokeOpacity="0.4" />
        <path d="M20 30 Q50 22 80 30" strokeOpacity="0.4" strokeDasharray="3 2" />
      </g>
    </svg>
  );
}

function PullUpIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 130" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 1.08} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="15" y1="10" x2="105" y2="10" />
        <line x1="15" y1="10" x2="15" y2="45" />
        <line x1="105" y1="10" x2="105" y2="45" />
        <line x1="35" y1="45" x2="45" y2="35" />
        <line x1="85" y1="45" x2="75" y2="35" />
        <circle cx="60" cy="45" r="7" />
        <line x1="60" y1="52" x2="60" y2="80" />
        <line x1="60" y1="80" x2="45" y2="105" />
        <line x1="60" y1="80" x2="75" y2="105" />
        <line x1="45" y1="105" x2="40" y2="120" />
        <line x1="75" y1="105" x2="80" y2="120" />
      </g>
    </svg>
  );
}

function SquatIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 120" className={cn("text-brand-600 dark:text-brand-400", className)} width={size * 0.83} height={size} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="18" r="8" />
        <line x1="50" y1="26" x2="50" y2="55" />
        <line x1="50" y1="40" x2="30" y2="55" />
        <line x1="50" y1="40" x2="70" y2="55" />
        <line x1="30" y1="55" x2="38" y2="85" />
        <line x1="70" y1="55" x2="62" y2="85" />
        <line x1="38" y1="85" x2="25" y2="115" />
        <line x1="62" y1="85" x2="75" y2="115" />
        <path d="M28 90 Q50 95 72 90" strokeOpacity="0.3" strokeDasharray="3 2" />
        <path d="M25 110 Q50 118 75 110" strokeOpacity="0.3" />
      </g>
    </svg>
  );
}

function LungeIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 110" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 0.92} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="50" cy="15" r="7" />
        <line x1="50" y1="22" x2="50" y2="45" />
        <line x1="50" y1="33" x2="30" y2="48" />
        <line x1="50" y1="33" x2="70" y2="18" />
        <line x1="30" y1="48" x2="25" y2="78" />
        <line x1="70" y1="18" x2="70" y2="55" />
        <line x1="70" y1="55" x2="85" y2="85" />
        <circle cx="25" cy="80" r="4" />
        <circle cx="85" cy="85" r="4" />
        <line x1="50" y1="45" x2="50" y2="60" strokeOpacity="0.4" strokeDasharray="3 2" />
        <path d="M50 60 Q50 50 50 45" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}

function CoreIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 80" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 0.62} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="28" cy="30" r="6" />
        <line x1="28" y1="36" x2="28" y2="55" />
        <line x1="28" y1="55" x2="15" y2="75" />
        <line x1="28" y1="44" x2="45" y2="38" />
        <line x1="45" y1="38" x2="55" y2="44" />
        <line x1="55" y1="44" x2="65" y2="38" />
        <line x1="65" y1="38" x2="80" y2="44" />
        <line x1="80" y1="44" x2="90" y2="38" />
        <line x1="90" y1="38" x2="105" y2="44" />
        <line x1="105" y1="44" x2="105" y2="60" />
        <line x1="105" y1="60" x2="115" y2="75" />
        <line x1="15" y1="75" x2="115" y2="75" strokeOpacity="0.3" />
      </g>
    </svg>
  );
}

function DipIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 120" className={cn("text-brand-600 dark:text-brand-400", className)} width={size * 0.83} height={size} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="10" x2="90" y2="10" />
        <line x1="20" y1="10" x2="20" y2="50" />
        <line x1="80" y1="10" x2="80" y2="50" />
        <line x1="25" y1="50" x2="30" y2="35" />
        <line x1="75" y1="50" x2="70" y2="35" />
        <circle cx="50" cy="40" r="7" />
        <line x1="50" y1="47" x2="50" y2="70" />
        <line x1="50" y1="70" x2="35" y2="90" />
        <line x1="50" y1="70" x2="65" y2="90" />
        <line x1="35" y1="90" x2="30" y2="115" />
        <line x1="65" y1="90" x2="70" y2="115" />
        <path d="M20 50 Q50 58 80 50" strokeOpacity="0.3" strokeDasharray="3 2" />
      </g>
    </svg>
  );
}

function HandstandIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 80 130" className={cn("text-brand-600 dark:text-brand-400", className)} width={size * 0.62} height={size} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="25" y1="125" x2="25" y2="100" />
        <line x1="55" y1="125" x2="55" y2="100" />
        <line x1="25" y1="100" x2="35" y2="90" />
        <line x1="55" y1="100" x2="45" y2="90" />
        <circle cx="40" cy="82" r="7" />
        <line x1="40" y1="75" x2="40" y2="50" />
        <line x1="40" y1="60" x2="28" y2="48" />
        <line x1="40" y1="60" x2="52" y2="48" />
        <line x1="28" y1="48" x2="25" y2="35" />
        <line x1="52" y1="48" x2="55" y2="35" />
        <path d="M40 15 Q40 25 40 35" strokeOpacity="0.4" strokeDasharray="3 2" />
        <path d="M38 15 L42 15 M38 18 L42 18" strokeWidth="2" strokeOpacity="0.4" />
      </g>
    </svg>
  );
}

function BridgeIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 90" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 0.64} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="15" y1="80" x2="25" y2="65" />
        <circle cx="25" cy="62" r="5" />
        <line x1="28" y1="58" x2="40" y2="42" />
        <line x1="40" y1="42" x2="55" y2="30" />
        <line x1="55" y1="30" x2="70" y2="28" />
        <circle cx="70" cy="28" r="5" />
        <line x1="75" y1="28" x2="90" y2="35" />
        <line x1="90" y1="35" x2="105" y2="45" />
        <line x1="105" y1="45" x2="115" y2="60" />
        <circle cx="115" cy="62" r="5" />
        <line x1="117" y1="65" x2="125" y2="80" />
        <line x1="25" y1="55" x2="25" y2="40" strokeOpacity="0.4" strokeDasharray="3 2" />
        <line x1="25" y1="40" x2="30" y2="35" strokeOpacity="0.4" strokeDasharray="2 2" />
      </g>
    </svg>
  );
}

function RowIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 90" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 0.64} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="10" x2="10" y2="80" />
        <line x1="130" y1="10" x2="130" y2="80" />
        <line x1="10" y1="30" x2="130" y2="30" />
        <line x1="10" y1="70" x2="130" y2="70" />
        <circle cx="95" cy="40" r="6" />
        <line x1="95" y1="46" x2="95" y2="65" />
        <line x1="95" y1="65" x2="85" y2="80" />
        <line x1="95" y1="65" x2="105" y2="80" />
        <line x1="95" y1="50" x2="75" y2="35" />
        <line x1="75" y1="35" x2="45" y2="30" />
        <line x1="45" y1="30" x2="45" y2="70" />
        <line x1="45" y1="50" x2="75" y2="50" strokeOpacity="0.3" />
        <path d="M45 60 Q55 52 75 60" strokeOpacity="0.3" strokeDasharray="2 2" />
      </g>
    </svg>
  );
}

function PlankIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 70" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 0.5} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="25" cy="35" r="6" />
        <line x1="25" y1="41" x2="25" y2="60" />
        <line x1="25" y1="60" x2="15" y2="65" />
        <line x1="25" y1="49" x2="45" y2="44" />
        <line x1="45" y1="44" x2="60" y2="44" />
        <line x1="60" y1="44" x2="80" y2="49" />
        <line x1="80" y1="49" x2="95" y2="49" />
        <line x1="95" y1="49" x2="115" y2="44" />
        <line x1="115" y1="44" x2="115" y2="60" />
        <line x1="115" y1="60" x2="125" y2="65" />
        <line x1="15" y1="65" x2="125" y2="65" strokeOpacity="0.3" />
      </g>
    </svg>
  );
}

function PistolIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 90 130" className={cn("text-brand-600 dark:text-brand-400", className)} width={size * 0.7} height={size} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="45" cy="18" r="7" />
        <line x1="45" y1="25" x2="45" y2="55" />
        <line x1="45" y1="40" x2="28" y2="52" />
        <line x1="45" y1="40" x2="65" y2="30" />
        <line x1="28" y1="52" x2="35" y2="90" />
        <line x1="65" y1="30" x2="65" y2="50" />
        <line x1="65" y1="50" x2="70" y2="85" />
        <circle cx="35" cy="92" r="4" />
        <circle cx="70" cy="87" r="4" />
        <line x1="65" y1="30" x2="78" y2="110" strokeOpacity="0.3" strokeDasharray="3 3" />
        <path d="M30 95 Q45 105 68 90" strokeOpacity="0.3" />
      </g>
    </svg>
  );
}

function BurpeeIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 100" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 0.72} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="35" cy="15" r="6" />
        <line x1="35" y1="21" x2="35" y2="40" />
        <line x1="35" y1="30" x2="20" y2="42" />
        <line x1="35" y1="30" x2="50" y2="42" />
        <line x1="20" y1="42" x2="20" y2="65" />
        <line x1="50" y1="42" x2="50" y2="65" />
        <path d="M20 65 Q50 50 80 65" strokeOpacity="0.3" strokeDasharray="3 2" />
        <path d="M50 42 Q60 30 75 30" strokeOpacity="0.4" />
        <circle cx="80" cy="60" r="6" strokeOpacity="0.5" />
        <line x1="80" y1="66" x2="80" y2="85" strokeOpacity="0.5" />
        <line x1="80" y1="85" x2="70" y2="95" strokeOpacity="0.5" />
        <line x1="80" y1="85" x2="90" y2="95" strokeOpacity="0.5" />
        <path d="M50 42 Q55 48 60 42 Q65 48 70 42 Q75 48 80 42" strokeOpacity="0.2" strokeDasharray="2 2" />
      </g>
    </svg>
  );
}

function LsitIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 100 110" className={cn("text-brand-600 dark:text-brand-400", className)} width={size * 0.9} height={size} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="20" y1="105" x2="20" y2="80" />
        <line x1="80" y1="105" x2="80" y2="80" />
        <line x1="20" y1="80" x2="30" y2="70" />
        <line x1="80" y1="80" x2="70" y2="70" />
        <circle cx="50" cy="62" r="7" />
        <line x1="50" y1="55" x2="50" y2="35" />
        <line x1="50" y1="42" x2="30" y2="55" />
        <line x1="50" y1="42" x2="70" y2="55" />
        <line x1="30" y1="55" x2="28" y2="75" />
        <line x1="70" y1="55" x2="72" y2="75" />
        <line x1="30" y1="75" x2="20" y2="80" strokeOpacity="0.4" />
        <line x1="70" y1="75" x2="80" y2="80" strokeOpacity="0.4" />
      </g>
    </svg>
  );
}

function HollowBodyIllus({ className, size = 120 }: IllustrationProps) {
  return (
    <svg viewBox="0 0 130 60" className={cn("text-brand-600 dark:text-brand-400", className)} width={size} height={size * 0.46} fill="none">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="30" cy="18" r="6" />
        <line x1="30" y1="24" x2="30" y2="42" />
        <line x1="30" y1="42" x2="20" y2="55" />
        <line x1="30" y1="32" x2="50" y2="28" />
        <line x1="50" y1="28" x2="65" y2="28" />
        <line x1="65" y1="28" x2="80" y2="32" />
        <line x1="80" y1="32" x2="95" y2="32" />
        <line x1="95" y1="32" x2="110" y2="38" />
        <line x1="110" y1="38" x2="110" y2="52" />
        <line x1="110" y1="52" x2="115" y2="55" />
        <line x1="20" y1="55" x2="115" y2="55" strokeOpacity="0.3" />
        <path d="M30 10 Q30 4 30 4" strokeOpacity="0.3" strokeDasharray="2 2" />
      </g>
    </svg>
  );
}

type ExerciseKey =
  | "push" | "pull" | "squat" | "lunge" | "core" | "dip"
  | "handstand" | "bridge" | "row" | "plank" | "pistol"
  | "burpee" | "lsit" | "hollow";

const EXERCISE_MAP: Record<string, ExerciseKey> = {
  flexiones: "push",
  "flexiones inclinadas": "push",
  "flexiones completas": "push",
  "flexiones declinadas": "push",
  "flexiones rodilla": "push",
  "flexiones diamante": "push",
  "flexiones lastradas": "push",
  dominadas: "pull",
  "dominadas asistidas": "pull",
  "dominadas supinas": "pull",
  "dominadas lastradas": "pull",
  "remo invertido": "row",
  "remo en barra": "row",
  "remo con mancuerna": "row",
  "encogimientos en barra": "pull",
  "archer pull-ups": "pull",
  "muscle-up progression": "pull",
  "muscle-ups": "pull",
  "fondos en silla": "dip",
  "fondos en paralelas": "dip",
  "fondos lastrados": "dip",
  sentadillas: "squat",
  "sentadillas profundas": "squat",
  "sentadillas búlgaras": "squat",
  "sentadillas lastradas": "squat",
  "pistol squat progression": "pistol",
  "pistol squats": "pistol",
  "jump squats": "squat",
  zancadas: "lunge",
  "zancadas estáticas": "lunge",
  "zancadas caminando": "lunge",
  "pike push-ups": "handstand",
  "handstand push-ups": "handstand",
  "handstand hold": "handstand",
  plancha: "plank",
  "plancha con toque": "plank",
  "planche progression": "push",
  "puente de glúteo": "bridge",
  "puente a una pierna": "bridge",
  "nordic curl progression": "bridge",
  "elevación de piernas": "core",
  "perro pájaro": "core",
  escaladores: "core",
  "elevación de talones": "core",
  "l-sit": "lsit",
  "v-sit progression": "lsit",
  "dragon flag progression": "core",
  "front lever progression": "pull",
  "back lever progression": "pull",
  superman: "hollow",
  burpees: "burpee",
  "burpees lastrados": "burpee",
};

const ILLUSTRATIONS: Record<ExerciseKey, React.FC<IllustrationProps>> = {
  push: PushUpIllus,
  pull: PullUpIllus,
  squat: SquatIllus,
  lunge: LungeIllus,
  core: CoreIllus,
  dip: DipIllus,
  handstand: HandstandIllus,
  bridge: BridgeIllus,
  row: RowIllus,
  plank: PlankIllus,
  pistol: PistolIllus,
  burpee: BurpeeIllus,
  lsit: LsitIllus,
  hollow: HollowBodyIllus,
};

const FALLBACK_ILLUSTRATIONS: ExerciseKey[] = ["push", "pull", "squat", "core", "plank"];

interface ExerciseIllustrationProps {
  exerciseName: string;
  className?: string;
  size?: number;
  type?: ExerciseKey;
}

export function ExerciseIllustration({
  exerciseName,
  className,
  size,
  type,
}: ExerciseIllustrationProps) {
  const details = getExerciseDetails(exerciseName);
  
  if (details?.imageUrl) {
    return (
      <div 
        className={cn("relative overflow-hidden flex-shrink-0", className)} 
        style={{ width: size || 120, height: size || 120, borderRadius: 'inherit' }}
      >
        <Image 
          src={details.imageUrl} 
          alt={exerciseName} 
          fill 
          className="object-cover" 
          sizes={`${size || 120}px`} 
        />
      </div>
    );
  }

  const key = type ?? findExerciseKey(exerciseName);
  const Component = ILLUSTRATIONS[key];
  if (!Component) return null;
  return <Component className={className} size={size} />;
}

function findExerciseKey(name: string): ExerciseKey {
  const lower = name.toLowerCase().trim();
  if (EXERCISE_MAP[lower]) return EXERCISE_MAP[lower]!;
  for (const [pattern, key] of Object.entries(EXERCISE_MAP)) {
    if (lower.includes(pattern)) return key;
  }
  const idx = Math.floor(Math.random() * FALLBACK_ILLUSTRATIONS.length);
  return FALLBACK_ILLUSTRATIONS[idx] ?? "push";
}
