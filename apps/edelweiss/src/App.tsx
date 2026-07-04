import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ChevronLeft, Star, Clock, Trophy, Target, Palette, Box, Activity, Search } from 'lucide-react';

interface Game {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  component: React.FC;
}

// ---- GAME: Follow the Star (Tracking) ----
const FollowTheStar: React.FC = () => {
  const [starPos, setStarPos] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const moveStar = useCallback(() => {
    const speed = 10 + level * 5;
    setStarPos({
      x: Math.random() * (100 - speed * 2) + speed,
      y: Math.random() * (100 - speed * 2) + speed,
    });
  }, [level]);

  const handleClick = () => {
    setScore(s => s + 1);
    if ((score + 1) % 10 === 0) setLevel(l => l + 1);
    moveStar();
  };

  return (
    <div className="text-center w-full max-w-2xl mx-auto">
      <h2 className="font-display text-gradient text-3xl font-black mb-2 flex justify-center items-center gap-3">
        <Star className="text-brand-400" size={32} /> ¡Sigue la Estrella!
      </h2>
      <p className="text-muted-foreground mb-6 font-medium">¡Toca la estrella antes de que se mueva!</p>
      
      <div className="flex justify-center gap-6 mb-6">
        <div className="glass-panel px-4 py-2 font-bold text-brand-300 flex items-center gap-2"><Star size={18}/> {score} puntos</div>
        <div className="glass-panel px-4 py-2 font-bold text-accent-300 flex items-center gap-2"><Trophy size={18}/> Nivel {level}</div>
        <div className="glass-panel px-4 py-2 font-bold text-rose-300 flex items-center gap-2"><Clock size={18}/> {timeLeft}s</div>
      </div>
      
      <div className="relative w-full h-[400px] glass-panel overflow-hidden cursor-crosshair border-brand-500/20" onClick={handleClick}>
        {/* Stars background */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} />
        ))}
        
        {/* Main star */}
        <motion.div 
          animate={{ left: `${starPos.x}%`, top: `${starPos.y}%` }}
          transition={{ type: "spring", stiffness: 100 }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
        >
          <div className="text-[3rem] filter drop-shadow-[0_0_20px_gold] animate-[sparkle_0.5s_ease_infinite]">⭐</div>
        </motion.div>

        <AnimatePresence>
          {showConfetti && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10"
            >
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                🎉 ¡Genial! 🎉
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ---- GAME: Color Match ----
const ColorMatch: React.FC = () => {
  const colors = [
    { name: 'Rojo', hex: '#ef4444' }, { name: 'Azul', hex: '#3b82f6' },
    { name: 'Verde', hex: '#10b981' }, { name: 'Amarillo', hex: '#eab308' },
    { name: 'Morado', hex: '#8b5cf6' }, { name: 'Naranja', hex: '#f97316' },
  ];
  const [targetColor, setTargetColor] = useState(colors[0]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  const newRound = () => {
    setTargetColor(colors[Math.floor(Math.random() * colors.length)]);
    setFeedback('');
  };
  useEffect(() => { newRound(); }, []);

  const handleClick = (color: typeof colors[0]) => {
    if (color.name === targetColor.name) {
      setScore(s => s + 1);
      setFeedback('🎉 ¡Correcto!');
      setTimeout(newRound, 1000);
    } else {
      setFeedback('😅 ¡Intenta otra vez!');
      setTimeout(() => setFeedback(''), 1000);
    }
  };

  return (
    <div className="text-center w-full max-w-md mx-auto">
      <h2 className="font-display text-gradient text-3xl font-black mb-2 flex justify-center items-center gap-3">
        <Palette className="text-brand-400" size={32} /> ¡Encuentra el Color!
      </h2>
      <p className="text-muted-foreground mb-6 font-medium text-lg">
        ¿Cuál es el color <span className="font-bold text-white px-2 py-1 rounded-lg bg-white/10">{targetColor.name}</span>?
      </p>
      <div className="flex justify-center gap-6 mb-6">
        <div className="glass-panel px-4 py-2 font-bold text-emerald-300 flex items-center gap-2"><Trophy size={18}/> {score} aciertos</div>
      </div>
      
      <div className="h-12 mb-4">
        {feedback && <div className="text-2xl font-bold animate-[bounce_0.5s_ease]">{feedback}</div>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {colors.map(color => (
          <motion.button
            key={color.name}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleClick(color)}
            className="w-full aspect-square rounded-2xl border-4 border-white/10 shadow-lg cursor-pointer"
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>
    </div>
  );
};

// ---- GAME: Shape Finder ----
const ShapeFinder: React.FC = () => {
  const shapes = ['🔵', '🔺', '🟥', '⭐', '💜', '🟢'];
  const [target, setTarget] = useState(shapes[0]);
  const [grid, setGrid] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  const newRound = () => {
    const t = shapes[Math.floor(Math.random() * shapes.length)];
    setTarget(t);
    const g = [...Array(12)].map(() => shapes[Math.floor(Math.random() * shapes.length)]);
    g[Math.floor(Math.random() * g.length)] = t;
    setGrid(g);
    setFeedback('');
  };
  useEffect(() => { newRound(); }, []);

  const handleClick = (shape: string) => {
    if (shape === target) {
      setScore(s => s + 1);
      setFeedback('🎉 ¡Lo encontraste!');
      setTimeout(newRound, 800);
    } else {
      setFeedback('😅 ¡Ese no es!');
      setTimeout(() => setFeedback(''), 800);
    }
  };

  return (
    <div className="text-center w-full max-w-md mx-auto">
      <h2 className="font-display text-gradient text-3xl font-black mb-2 flex justify-center items-center gap-3">
        <Box className="text-accent-400" size={32} /> ¡Encuentra la Forma!
      </h2>
      <p className="text-muted-foreground mb-6 font-medium text-lg">
        ¿Dónde está <span className="text-3xl align-middle mx-2">{target}</span>?
      </p>
      
      <div className="flex justify-center gap-6 mb-6">
        <div className="glass-panel px-4 py-2 font-bold text-accent-300 flex items-center gap-2"><Trophy size={18}/> {score} aciertos</div>
      </div>
      
      <div className="h-12 mb-4">
        {feedback && <div className="text-2xl font-bold animate-[bounce_0.5s_ease]">{feedback}</div>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {grid.map((shape, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleClick(shape)}
            className="w-full aspect-square glass-panel glass-panel-hover flex items-center justify-center text-4xl cursor-pointer"
          >
            {shape}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ---- GAME: High Contrast ----
const HighContrast: React.FC = () => {
  const [pattern, setPattern] = useState(0);
  const patterns = [
    { bg: '#000000', fg: '#ffffff', emoji: '⚫⚪⚫⚪' },
    { bg: '#ffffff', fg: '#000000', emoji: '⬛⬜⬛⬜' },
    { bg: '#000000', fg: '#eab308', emoji: '🟡⚫🟡⚫' },
    { bg: '#000000', fg: '#ef4444', emoji: '🔴⚫🔴⚫' },
    { bg: '#ffffff', fg: '#3b82f6', emoji: '🔵⬜🔵⬜' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setPattern(p => (p + 1) % patterns.length), 3000);
    return () => clearInterval(timer);
  }, []);
  const p = patterns[pattern];

  return (
    <div className="text-center w-full max-w-md mx-auto">
      <h2 className="font-display text-gradient text-3xl font-black mb-2 flex justify-center items-center gap-3">
        <Activity className="text-brand-400" size={32} /> Alto Contraste
      </h2>
      <p className="text-muted-foreground mb-6 font-medium">Observa los patrones que cambian</p>
      
      <div 
        className="grid grid-cols-8 gap-1 p-4 rounded-3xl transition-colors duration-1000 shadow-2xl" 
        style={{ backgroundColor: p.bg }}
      >
        {[...Array(64)].map((_, i) => (
          <div 
            key={i} 
            className="w-full aspect-square rounded-md transition-all duration-1000 border-2"
            style={{ 
              backgroundColor: i % 2 === 0 ? p.fg : p.bg,
              borderColor: i % 2 === 0 ? p.bg : p.fg 
            }} 
          />
        ))}
      </div>
      <div className="text-4xl mt-8 animate-[bounce_2s_ease_infinite]">{p.emoji}</div>
    </div>
  );
};

// ---- GAME: Eye Patch Timer ----
const EyePatchTimer: React.FC = () => {
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [totalSeconds, setTotalSeconds] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTotalSeconds(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  const displayMinutes = Math.floor(totalSeconds / 60);
  const displaySeconds = totalSeconds % 60;

  const selectPreset = (m: number) => {
    setSelectedMinutes(m); setTotalSeconds(m * 60); setIsRunning(false); setDone(false);
  };
  const startTimer = () => { if (totalSeconds > 0) setIsRunning(true); };
  const resetTimer = () => { setIsRunning(false); setDone(false); setTotalSeconds(selectedMinutes * 60); };

  if (done) {
    return (
      <div className="text-center">
        <h2 className="font-display text-emerald-400 text-4xl font-black mb-6">🎉 ¡Tiempo cumplido!</h2>
        <div className="text-8xl animate-[bounce_1s_ease_infinite] mb-6">👏</div>
        <p className="text-xl text-white/80 font-bold mb-8">¡Muy bien! ¡Has completado tu ejercicio!</p>
        <button onClick={resetTimer} className="btn-premium px-8 py-4 rounded-xl text-xl font-bold">
          🔄 Jugar otra vez
        </button>
      </div>
    );
  }

  return (
    <div className="text-center w-full max-w-md mx-auto">
      <h2 className="font-display text-gradient text-3xl font-black mb-2 flex justify-center items-center gap-3">
        <Clock className="text-accent-400" size={32} /> Tiempo del Parche
      </h2>
      <p className="text-muted-foreground mb-8 font-medium">¡Cuenta regresiva para tu ejercicio!</p>
      
      <div className={`text-7xl font-black font-display mb-10 transition-colors ${isRunning ? 'text-emerald-400 animate-pulse drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]' : 'text-white/40'}`}>
        {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
      </div>
      
      <div className="flex justify-center gap-4 mb-8">
        <button onClick={startTimer} disabled={isRunning} className={`px-8 py-4 rounded-xl text-xl font-bold transition-all ${isRunning ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'btn-premium'}`}>
          ▶️ Empezar
        </button>
        <button onClick={resetTimer} className="px-8 py-4 rounded-xl text-xl font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all">
          🔄 Reiniciar
        </button>
      </div>
      
      <div className="flex justify-center gap-3 flex-wrap">
        {[5, 10, 15, 20, 30].map(m => (
          <button 
            key={m} onClick={() => selectPreset(m)} 
            className={`px-4 py-2 rounded-xl font-bold transition-all border-2 ${selectedMinutes === m ? 'bg-accent-500 border-accent-400 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]' : 'glass-panel border-transparent text-white/60 hover:text-white'}`}
          >
            {m} min
          </button>
        ))}
      </div>
    </div>
  );
};

// ---- GAME: Find the Difference ----
const FindDifference: React.FC = () => {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [found, setFound] = useState(false);
  const emojis = ['🐶', '🐱', '🐰', '🐻', '🐼', '🐨', '🦊', '🐸'];

  const generateGrid = () => {
    const main = emojis[Math.floor(Math.random() * emojis.length)];
    const diff = emojis[Math.floor(Math.random() * emojis.length)];
    const grid = [...Array(16)].map(() => main);
    grid[Math.floor(Math.random() * grid.length)] = diff;
    return { grid, main, diff };
  };
  const [state, setState] = useState(generateGrid);

  const handleClick = (emoji: string) => {
    if (emoji === state.diff && !found) {
      setFound(true); setScore(s => s + 1);
      setTimeout(() => {
        setRound(r => r + 1); setFound(false); setState(generateGrid());
      }, 1000);
    }
  };

  return (
    <div className="text-center w-full max-w-md mx-auto">
      <h2 className="font-display text-gradient text-3xl font-black mb-2 flex justify-center items-center gap-3">
        <Search className="text-brand-400" size={32} /> ¡Encuentra el Diferente!
      </h2>
      <p className="text-muted-foreground mb-6 font-medium text-lg">
        Busca el <span className="text-2xl align-middle mx-1">{state.diff}</span> entre los <span className="text-2xl align-middle mx-1">{state.main}</span>
      </p>
      
      <div className="flex justify-center gap-6 mb-4">
        <div className="glass-panel px-4 py-2 font-bold text-amber-300 flex items-center gap-2"><Trophy size={18}/> {score} puntos</div>
        <div className="glass-panel px-4 py-2 font-bold text-brand-300 flex items-center gap-2"><Target size={18}/> Ronda {round}</div>
      </div>
      
      <div className="h-12 mb-2">
        {found && <div className="text-2xl font-bold text-emerald-400 animate-[bounce_0.5s_ease]">🎉 ¡Lo encontraste!</div>}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {state.grid.map((emoji, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleClick(emoji)}
            className={`w-full aspect-square flex items-center justify-center text-4xl rounded-2xl cursor-pointer transition-all ${found && emoji === state.diff ? 'bg-emerald-500 shadow-[0_0_20px_#10b981] border-2 border-emerald-300' : 'glass-panel glass-panel-hover'}`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ---- MAIN APP ----
const games: Game[] = [
  { id: 'star', name: 'Sigue la Estrella', icon: <Star size={24} />, color: 'from-purple-500 to-indigo-500', description: 'Atrapa la estrella escurridiza', component: FollowTheStar },
  { id: 'color', name: 'Encuentra el Color', icon: <Palette size={24} />, color: 'from-amber-500 to-orange-500', description: 'Identifica el color correcto', component: ColorMatch },
  { id: 'shape', name: 'Encuentra la Forma', icon: <Box size={24} />, color: 'from-cyan-500 to-blue-500', description: 'Busca la forma geométrica', component: ShapeFinder },
  { id: 'contrast', name: 'Alto Contraste', icon: <Activity size={24} />, color: 'from-rose-500 to-red-500', description: 'Observa patrones de contraste', component: HighContrast },
  { id: 'timer', name: 'Tiempo del Parche', icon: <Clock size={24} />, color: 'from-emerald-500 to-teal-500', description: 'Cuenta regresiva para tu terapia', component: EyePatchTimer },
  { id: 'diff', name: 'El Diferente', icon: <Search size={24} />, color: 'from-pink-500 to-rose-500', description: 'Encuentra el emoji intruso', component: FindDifference },
];

export default function App() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans pb-16">
      <div className="bg-orbs-container">
        <div className="orb orb-1"></div><div className="orb orb-2"></div><div className="orb orb-3"></div>
      </div>
      
      <header className="sticky top-0 z-50 glass-panel rounded-none border-t-0 border-x-0 border-b-white/10 px-6 py-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.4)]">
            <Eye className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight">Edelweiss</h1>
            <p className="text-xs font-bold text-brand-400 tracking-widest uppercase">Vision Play</p>
          </div>
        </div>
        
        {selectedGame && (
          <button 
            onClick={() => setSelectedGame(null)} 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors font-bold"
          >
            <ChevronLeft size={18} /> Volver
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto p-6 mt-8">
        <AnimatePresence mode="wait">
          {selectedGame ? (
            <motion.div 
              key="game"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="glass-panel p-8 min-h-[600px] flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-accent-500 opacity-50"></div>
              <selectedGame.component />
            </motion.div>
          ) : (
            <motion.div 
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-12">
                <h2 className="font-display text-5xl font-black text-white mb-4">¿A qué jugamos hoy?</h2>
                <p className="text-xl text-muted-foreground font-medium">Terapia visual divertida e interactiva</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game, i) => (
                  <motion.button
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.03, translateY: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGame(game)}
                    className="glass-panel text-left p-6 relative overflow-hidden group cursor-pointer border-transparent hover:border-white/20 transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-white bg-gradient-to-br ${game.color} shadow-lg shadow-black/20`}>
                      {game.icon}
                    </div>
                    <h3 className="font-display text-xl font-bold text-white mb-2">{game.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{game.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
