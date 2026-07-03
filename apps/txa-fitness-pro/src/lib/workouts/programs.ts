import { WorkoutProgram } from "@/types/domain";

export const DEFAULT_PROGRAMS: WorkoutProgram[] = [
  {
    id: "calisthenics-beginner",
    name: "Calistenia Principiante",
    description: "3 días/sem. Progresiones básicas para construir fuerza y control corporal.",
    days: [
      {
        id: "cali-beg-a",
        programId: "calisthenics-beginner",
        dayName: "Empuje + Core",
        exercises: [
          {
            name: "Flexiones Inclinadas",
            targetMuscle: "pectorales",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "beginner", variation: "Inclinación 45° en banco",
          },
          {
            name: "Fondos en Silla",
            targetMuscle: "triceps",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "beginner", variation: "Silla estable",
          },
          {
            name: "Plancha",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 20, restSeconds: 45,
            difficulty: "beginner", variation: "Antebrazos en suelo",
          },
          {
            name: "Elevación de Piernas Acostado",
            targetMuscle: "abdominales",
            defaultSets: 3, defaultReps: 10, restSeconds: 45,
            difficulty: "beginner", variation: "Rodillas dobladas",
          },
        ],
      },
      {
        id: "cali-beg-b",
        programId: "calisthenics-beginner",
        dayName: "Tracción + Sen",
        exercises: [
          {
            name: "Dominadas Asistidas",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 5, restSeconds: 90,
            difficulty: "beginner", variation: "Con banda elástica",
          },
          {
            name: "Remo Invertido",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "beginner", variation: "Barra baja, pies en suelo",
          },
          {
            name: "Puente de Glúteo",
            targetMuscle: "gluteos",
            defaultSets: 3, defaultReps: 12, restSeconds: 60,
            difficulty: "beginner", variation: "Dos piernas",
          },
          {
            name: "Perro Pájaro",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 8, restSeconds: 45,
            difficulty: "beginner", variation: "Lento y controlado",
          },
        ],
      },
      {
        id: "cali-beg-c",
        programId: "calisthenics-beginner",
        dayName: "Piernas + Full Body",
        exercises: [
          {
            name: "Sentadillas",
            targetMuscle: "quadriceps",
            defaultSets: 3, defaultReps: 12, restSeconds: 60,
            difficulty: "beginner", variation: "Peso corporal",
          },
          {
            name: "Zancadas Estáticas",
            targetMuscle: "gluteos",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "beginner", variation: "Sin desplazamiento",
          },
          {
            name: "Flexiones Rodilla",
            targetMuscle: "pectorales",
            defaultSets: 3, defaultReps: 10, restSeconds: 60,
            difficulty: "beginner", variation: "Rodillas en suelo",
          },
          {
            name: "Superman",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 10, restSeconds: 45,
            difficulty: "beginner", variation: "Retención 2s arriba",
          },
        ],
      },
    ],
  },
  {
    id: "calisthenics-standard",
    name: "Calistenia Standard",
    description: "4 días/sem. Split superior/inferior con variaciones completas.",
    days: [
      {
        id: "cali-std-push",
        programId: "calisthenics-standard",
        dayName: "Empuje",
        exercises: [
          {
            name: "Flexiones Completas",
            targetMuscle: "pectorales",
            defaultSets: 4, defaultReps: 10, restSeconds: 60,
            difficulty: "intermediate", variation: "Cuerpo recto, apertura media",
          },
          {
            name: "Fondos en Paralelas",
            targetMuscle: "triceps",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "intermediate", variation: "Paraletas o sillas",
          },
          {
            name: "Flexiones Declinadas",
            targetMuscle: "pectorales",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "intermediate", variation: "Pies elevados 30cm",
          },
          {
            name: "Pike Push-ups",
            targetMuscle: "hombros",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "intermediate", variation: "Cadera arriba, cabeza al suelo",
          },
        ],
      },
      {
        id: "cali-std-pull",
        programId: "calisthenics-standard",
        dayName: "Tracción",
        exercises: [
          {
            name: "Dominadas",
            targetMuscle: "espalda",
            defaultSets: 4, defaultReps: 6, restSeconds: 90,
            difficulty: "intermediate", variation: "Pronas, agarre completo",
          },
          {
            name: "Remo en Barra",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 10, restSeconds: 60,
            difficulty: "intermediate", variation: "Cuerpo recto, tocar barra",
          },
          {
            name: "Dominadas Supinas",
            targetMuscle: "bíceps",
            defaultSets: 3, defaultReps: 6, restSeconds: 90,
            difficulty: "intermediate", variation: "Palmas hacia ti",
          },
          {
            name: "Encogimientos en Barra",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "intermediate", variation: "Hombros a barra, cuerpo recto",
          },
        ],
      },
      {
        id: "cali-std-legs",
        programId: "calisthenics-standard",
        dayName: "Piernas",
        exercises: [
          {
            name: "Sentadillas Profundas",
            targetMuscle: "quadriceps",
            defaultSets: 4, defaultReps: 15, restSeconds: 60,
            difficulty: "intermediate", variation: "Cadera abajo de rodilla",
          },
          {
            name: "Zancadas Caminando",
            targetMuscle: "gluteos",
            defaultSets: 3, defaultReps: 10, restSeconds: 60,
            difficulty: "intermediate", variation: "Con desplazamiento",
          },
          {
            name: "Sentadilla Búlgara",
            targetMuscle: "quadriceps",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "intermediate", variation: "Pie trasero elevado",
          },
          {
            name: "Puente a Una Pierna",
            targetMuscle: "gluteos",
            defaultSets: 3, defaultReps: 8, restSeconds: 45,
            difficulty: "intermediate", variation: "Pierna extendida",
          },
        ],
      },
      {
        id: "cali-std-core",
        programId: "calisthenics-standard",
        dayName: "Core + Full Body",
        exercises: [
          {
            name: "Plancha con Toque",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 12, restSeconds: 45,
            difficulty: "intermediate", variation: "Toque de hombro alternado",
          },
          {
            name: "Escaladores",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 16, restSeconds: 45,
            difficulty: "intermediate", variation: "Rodilla al pecho alternado",
          },
          {
            name: "Flexiones Diamante",
            targetMuscle: "triceps",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "intermediate", variation: "Manos juntas en diamante",
          },
          {
            name: "Burpees",
            targetMuscle: "full_body",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "intermediate", variation: "Con flexión completa",
          },
        ],
      },
    ],
  },
  {
    id: "calisthenics-expert",
    name: "Calistenia Experto",
    description: "5 días/sem. Progresiones avanzadas: estáticos, weighted y skills.",
    days: [
      {
        id: "cali-exp-push",
        programId: "calisthenics-expert",
        dayName: "Push Pesado",
        exercises: [
          {
            name: "Flexiones Lastradas",
            targetMuscle: "pectorales",
            defaultSets: 4, defaultReps: 8, restSeconds: 90,
            difficulty: "expert", variation: "Chaleco lastrado o mochila",
          },
          {
            name: "Fondos Lastrados",
            targetMuscle: "triceps",
            defaultSets: 4, defaultReps: 8, restSeconds: 90,
            difficulty: "expert", variation: "Peso adicional en cadena",
          },
          {
            name: "Planche Progression",
            targetMuscle: "hombros",
            defaultSets: 4, defaultReps: 10, restSeconds: 90,
            difficulty: "expert", variation: "Tuck planche hold 5-10s",
          },
          {
            name: "Handstand Push-ups",
            targetMuscle: "hombros",
            defaultSets: 3, defaultReps: 5, restSeconds: 120,
            difficulty: "expert", variation: "Contra pared o libre",
          },
        ],
      },
      {
        id: "cali-exp-pull",
        programId: "calisthenics-expert",
        dayName: "Pull Pesado",
        exercises: [
          {
            name: "Dominadas Lastradas",
            targetMuscle: "espalda",
            defaultSets: 4, defaultReps: 6, restSeconds: 120,
            difficulty: "expert", variation: "+10kg lastre",
          },
          {
            name: "Front Lever Progression",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 8, restSeconds: 90,
            difficulty: "expert", variation: "Advanced tuck hold 10s",
          },
          {
            name: "Muscle-up Progression",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 5, restSeconds: 120,
            difficulty: "expert", variation: "Transiciones explosivas",
          },
          {
            name: "Archer Pull-ups",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 4, restSeconds: 120,
            difficulty: "expert", variation: "Alternando brazos",
          },
        ],
      },
      {
        id: "cali-exp-legs",
        programId: "calisthenics-expert",
        dayName: "Piernas + Explosivo",
        exercises: [
          {
            name: "Pistol Squat Progression",
            targetMuscle: "quadriceps",
            defaultSets: 3, defaultReps: 5, restSeconds: 90,
            difficulty: "expert", variation: "Pierna extendida, asistido mínimo",
          },
          {
            name: "Sentadillas Lastradas",
            targetMuscle: "quadriceps",
            defaultSets: 4, defaultReps: 10, restSeconds: 90,
            difficulty: "expert", variation: "Mochila lastrada",
          },
          {
            name: "Jump Squats",
            targetMuscle: "quadriceps",
            defaultSets: 3, defaultReps: 10, restSeconds: 60,
            difficulty: "expert", variation: "Máxima altura explosiva",
          },
          {
            name: "Nordic Curl Progression",
            targetMuscle: "isquiotibiales",
            defaultSets: 3, defaultReps: 6, restSeconds: 90,
            difficulty: "expert", variation: "Control excéntrico total",
          },
        ],
      },
      {
        id: "cali-exp-static",
        programId: "calisthenics-expert",
        dayName: "Estáticos + Skills",
        exercises: [
          {
            name: "L-sit",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 10, restSeconds: 60,
            difficulty: "expert", variation: "Piernas extendidas, 10s hold",
          },
          {
            name: "V-sit Progression",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 8, restSeconds: 60,
            difficulty: "expert", variation: "Piernas a 45°+, 8s hold",
          },
          {
            name: "Handstand Hold",
            targetMuscle: "hombros",
            defaultSets: 3, defaultReps: 20, restSeconds: 60,
            difficulty: "expert", variation: "Contra pared, 20s hold",
          },
          {
            name: "Back Lever Progression",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 8, restSeconds: 90,
            difficulty: "expert", variation: "Tuck back lever 8s",
          },
        ],
      },
      {
        id: "cali-exp-conditioning",
        programId: "calisthenics-expert",
        dayName: "Acondicionamiento",
        exercises: [
          {
            name: "Burpees Lastrados",
            targetMuscle: "full_body",
            defaultSets: 3, defaultReps: 10, restSeconds: 45,
            difficulty: "expert", variation: "Chaleco lastrado",
          },
          {
            name: "Muscle-ups",
            targetMuscle: "espalda",
            defaultSets: 3, defaultReps: 5, restSeconds: 120,
            difficulty: "expert", variation: "Estrictos, sin kipping",
          },
          {
            name: "Pistol Squats",
            targetMuscle: "quadriceps",
            defaultSets: 3, defaultReps: 5, restSeconds: 90,
            difficulty: "expert", variation: "Completos, ambas piernas",
          },
          {
            name: "Dragon Flag Progression",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 6, restSeconds: 60,
            difficulty: "expert", variation: "Tuck dragon flag 6 reps",
          },
        ],
      },
    ],
  },
  {
    id: "mobility-recovery",
    name: "Movilidad y Recuperación",
    description: "2 días/sem. Ideal para días de descanso activo. Mejora la postura y previene lesiones.",
    days: [
      {
        id: "mob-a",
        programId: "mobility-recovery",
        dayName: "Movilidad de Columna y Hombros",
        exercises: [
          {
            name: "Gato-Camello",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 10, restSeconds: 45,
            difficulty: "beginner", variation: "Respiración profunda",
          },
          {
            name: "Dislocaciones de Hombro",
            targetMuscle: "hombros",
            defaultSets: 3, defaultReps: 15, restSeconds: 45,
            difficulty: "beginner", variation: "Agarre amplio",
          },
          {
            name: "Puente de Glúteo",
            targetMuscle: "gluteos",
            defaultSets: 3, defaultReps: 15, restSeconds: 45,
            difficulty: "beginner", variation: "Retención 3s arriba",
          },
          {
            name: "Plancha",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 30, restSeconds: 45,
            difficulty: "beginner", variation: "Activación suave",
          },
        ]
      },
      {
        id: "mob-b",
        programId: "mobility-recovery",
        dayName: "Flexibilidad de Piernas",
        exercises: [
          {
            name: "Sentadillas Profundas",
            targetMuscle: "quadriceps",
            defaultSets: 3, defaultReps: 10, restSeconds: 60,
            difficulty: "beginner", variation: "Pausa de 5s en el fondo",
          },
          {
            name: "Zancadas",
            targetMuscle: "gluteos",
            defaultSets: 3, defaultReps: 10, restSeconds: 60,
            difficulty: "beginner", variation: "Paso muy amplio para estirar flexores",
          },
          {
            name: "Elevación de Piernas",
            targetMuscle: "abdominales",
            defaultSets: 3, defaultReps: 12, restSeconds: 45,
            difficulty: "beginner", variation: "Control excéntrico lento",
          },
          {
            name: "Perro Pájaro",
            targetMuscle: "core",
            defaultSets: 3, defaultReps: 10, restSeconds: 45,
            difficulty: "beginner", variation: "Equilibrio y elongación",
          },
        ]
      }
    ]
  },
  {
    id: "weekly-challenges",
    name: "Retos Metabólicos Semanales",
    description: "Circuitos de alta intensidad para quemar grasa y poner a prueba tu resistencia.",
    days: [
      {
        id: "chal-1",
        programId: "weekly-challenges",
        dayName: "El Reto de los 100 Burpees",
        exercises: [
          {
            name: "Burpees",
            targetMuscle: "full_body",
            defaultSets: 5, defaultReps: 20, restSeconds: 60,
            difficulty: "advanced", variation: "Máxima velocidad posible",
          },
          {
            name: "Escaladores",
            targetMuscle: "core",
            defaultSets: 5, defaultReps: 40, restSeconds: 45,
            difficulty: "intermediate", variation: "Mantener ritmo alto",
          },
        ]
      },
      {
        id: "chal-2",
        programId: "weekly-challenges",
        dayName: "Circuito Iron Core",
        exercises: [
          {
            name: "L-Sit",
            targetMuscle: "core",
            defaultSets: 4, defaultReps: 15, restSeconds: 45,
            difficulty: "expert", variation: "Soportar máximo tiempo posible (reps=seg)",
          },
          {
            name: "Elevación de Piernas",
            targetMuscle: "abdominales",
            defaultSets: 4, defaultReps: 20, restSeconds: 45,
            difficulty: "advanced", variation: "En barra o anillas",
          },
          {
            name: "Plancha con Toque",
            targetMuscle: "core",
            defaultSets: 4, defaultReps: 30, restSeconds: 45,
            difficulty: "intermediate", variation: "Rápido y sin rotar cadera",
          },
        ]
      }
    ]
  }
];
