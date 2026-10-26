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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-uiep-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">UIEP</h1>
              <p className="text-xs text-gray-500">Universal Intelligence Engineering Platform</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-gray-500">v0.1.0</span>
          </nav>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto flex-shrink-0">
          <ConstructorPanel />
        </div>

        <div className="flex-1 overflow-hidden">
          <FlowDiagram />
        </div>

        <div className="w-96 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['results', 'export'] as RightTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={`flex-1 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                    rightTab === tab
                      ? 'border-uiep-600 text-uiep-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
