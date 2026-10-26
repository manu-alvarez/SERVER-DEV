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
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Goal</h2>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe what you want to build..."
          className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-uiep-500 focus:border-transparent"
        />
      </div>

      <CategorySelector />

      <ConfigPanel />

      <button
        onClick={generate}
        disabled={!goal.trim() || isGenerating}
        className="w-full py-2.5 px-4 bg-uiep-600 text-white text-sm font-medium rounded-lg hover:bg-uiep-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
