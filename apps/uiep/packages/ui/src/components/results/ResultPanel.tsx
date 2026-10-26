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
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Results</h2>
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No results yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-uiep-600 text-uiep-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'artifacts' && (
          <div className="space-y-3">
            <div className="space-y-1">
              {result.generation.artifacts.map((artifact, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedArtifact(i)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedArtifact === i
                      ? 'bg-uiep-50 text-uiep-700 border border-uiep-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{artifact.name}</span>
                  <span className="text-xs text-gray-400 ml-2">({artifact.format})</span>
                </button>
              ))}
            </div>

            {result.generation.artifacts[selectedArtifact] && (
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {result.generation.artifacts[selectedArtifact].content}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-xs text-gray-300">
              {result.generation.projectStructure.join('\n')}
            </pre>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl font-bold text-gray-900">
                {result.verification.overallScore}
              </div>
              <div className="text-sm text-gray-500">/100</div>
              <div
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  result.verification.passed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {result.verification.passed ? 'PASSED' : 'FAILED'}
              </div>
            </div>

            {result.verification.checks.map((check, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  check.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{check.name}</span>
                  <span className="text-xs text-gray-500">{check.score}/100</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{check.message}</p>
              </div>
            ))}

            {result.verification.recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-900 mb-2">Recommendations</h3>
                <ul className="space-y-1">
                  {result.verification.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-uiep-600">&bull;</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-500">{result.generation.instructions}</p>
      </div>
    </div>
  );
}
