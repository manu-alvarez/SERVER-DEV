'use client';

import { ConstructorPanel } from '@/components/constructor/ConstructorPanel';
import { FlowDiagram } from '@/components/visualization/FlowDiagram';
import { ResultPanel } from '@/components/results/ResultPanel';
import { ExportPanel } from '@/components/results/ExportPanel';
import { useState } from 'react';

type RightTab = 'results' | 'export';

export default function Home() {
  const [rightTab, setRightTab] = useState<RightTab>('results');

  return (
    <main className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col">
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <span className="text-white font-extrabold text-sm tracking-wider">U</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">UIEP</h1>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">Studio</span>
              </div>
              <p className="text-[11px] text-slate-400">Universal Intelligence Engineering Platform</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/60 rounded-full border border-slate-800 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Engine v0.1.0</span>
            </div>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 h-[calc(100vh-65px)] overflow-hidden">
        {/* Left: Constructor */}
        <div className="w-80 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-sm overflow-y-auto flex-shrink-0">
          <ConstructorPanel />
        </div>

        {/* Center: Flow Visualization */}
        <div className="flex-1 overflow-hidden relative bg-[#070B14]">
          <FlowDiagram />
        </div>

        {/* Right: Results / Export */}
        <div className="w-96 border-l border-slate-800/80 bg-slate-950/70 backdrop-blur-sm flex flex-col flex-shrink-0">
          <div className="border-b border-slate-800/80 bg-slate-950/90">
            <div className="flex">
              {(['results', 'export'] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                    rightTab === tab
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightTab === 'results' ? <ResultPanel /> : <ExportPanel />}
          </div>
        </div>
      </div>
    </main>
  );
}
