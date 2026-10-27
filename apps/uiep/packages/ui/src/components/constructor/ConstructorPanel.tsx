'use client';

import { useConstructorStore } from '@/stores/constructor-store';
import { useDesignEngine } from '@/hooks/useDesignEngine';
import { CategorySelector } from './CategorySelector';
import { ConfigPanel } from './ConfigPanel';

export function ConstructorPanel() {
  const { goal, setGoal, isGenerating } = useConstructorStore();
  const { generate } = useDesignEngine();

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Goal / Objective</h2>
          <span className="text-[10px] text-blue-400 font-medium">Prompt Input</span>
        </div>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe the agent, system, or architecture you want to build..."
          className="w-full h-24 px-3 py-2 text-sm bg-slate-900/90 text-slate-100 placeholder-slate-500 border border-slate-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/80 transition-all shadow-inner"
        />
      </div>

      <CategorySelector />

      <ConfigPanel />

      <button
        onClick={generate}
        disabled={!goal.trim() || isGenerating}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-[0.98]"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Blueprint...
          </span>
        ) : (
          '⚡ Generate Architecture'
        )}
      </button>
    </div>
  );
}
