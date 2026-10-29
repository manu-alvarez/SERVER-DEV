'use client';

import { useConstructorStore } from '@/stores/constructor-store';
import { useState } from 'react';

type Tab = 'artifacts' | 'structure' | 'verification' | 'adapter';

export function ResultPanel() {
  const { result } = useConstructorStore();
  const [activeTab, setActiveTab] = useState<Tab>('artifacts');
  const [selectedArtifact, setSelectedArtifact] = useState<number>(0);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'structure', label: 'Structure' },
    { id: 'verification', label: 'Verification' },
  ];

  if (!result) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Build Output</h2>
        <div className="py-16 text-slate-500">
          <p className="text-xs">No artifacts compiled yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950/60">
      <div className="border-b border-slate-800/80 bg-slate-950/80">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'artifacts' && (
          <div className="space-y-3">
            <div className="space-y-1">
              {result.generation.artifacts.map((artifact, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedArtifact(i)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all flex items-center justify-between ${
                    selectedArtifact === i
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <span className="font-medium truncate">{artifact.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0 ml-2">{artifact.format}</span>
                </button>
              ))}
            </div>

            {result.generation.artifacts[selectedArtifact] && (
              <div className="bg-[#050811] rounded-xl p-3.5 border border-slate-800 overflow-x-auto shadow-inner">
                <pre className="text-[11px] font-mono text-cyan-200/90 whitespace-pre-wrap leading-relaxed">
                  {result.generation.artifacts[selectedArtifact].content}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="bg-[#050811] rounded-xl p-4 border border-slate-800 shadow-inner">
            <pre className="text-xs font-mono text-emerald-300/90 leading-relaxed">
              {result.generation.projectStructure.join('\n')}
            </pre>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="text-3xl font-black text-white font-mono">
                {result.verification.overallScore}
              </div>
              <div className="text-xs text-slate-400 font-mono">/100</div>
              <div
                className={`ml-auto px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${
                  result.verification.passed
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {result.verification.passed ? 'PASSED' : 'FAILED'}
              </div>
            </div>

            {result.verification.checks.map((check, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border transition-all ${
                  check.passed
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-rose-950/20 border-rose-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{check.name}</span>
                  <span className="text-[11px] font-mono text-slate-400">{check.score}/100</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{check.message}</p>
              </div>
            ))}

            {result.verification.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Recommendations</h3>
                <ul className="space-y-1.5">
                  {result.verification.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-blue-400">&bull;</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-800/80 p-3 bg-slate-950">
        <p className="text-[11px] text-slate-400 font-mono">{result.generation.instructions}</p>
      </div>
    </div>
  );
}
