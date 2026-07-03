import React from 'react';
import { useStats } from '../hooks/useStats';
import { useTranslation } from '../hooks/useTranslation';

export default function Statistics({ onExit }) {
  const { t } = useTranslation();
  const [stats, , resetStats] = useStats();

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center text-white p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{t('app.statistics.title')}</h2>
      </div>
      <div className="space-y-4 w-full max-w-md">
        <div className="flex justify-between">
          <span>{t('app.statistics.alto')}:</span>
          <span>{stats.alto} {t('app.statistics.sessions', { count: stats.alto })}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('app.statistics.seguimiento')}:</span>
          <span>{stats.seguimiento} {t('app.statistics.sessions', { count: stats.seguimiento })}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('app.statistics.enfoque')}:</span>
          <span>{stats.enfoque} {t('app.statistics.sessions', { count: stats.enfoque })}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('app.statistics.descanso')}:</span>
          <span>{stats.descanso} {t('app.statistics.sessions', { count: stats.descanso })}</span>
        </div>
        <div className="flex justify-between border-t pt-4">
          <span className="font-medium">{t('app.statistics.total')}:</span>
          <span className="font-medium">{stats.total} {t('app.statistics.sessions', { count: stats.total })}</span>
        </div>
        {stats.lastSession && (
          <div className="flex justify-between mt-2 text-sm">
            <span>{t('app.statistics.lastSession')}:</span>
            <span>{new Date(stats.lastSession).toLocaleString()}</span>
          </div>
        )}
      </div>
      <div className="mt-6 flex space-x-4">
        <button
          onClick={resetStats}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          {t('app.statistics.reset')}
        </button>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          {t('app.statistics.close')}
        </button>
      </div>
    </div>
  );
}