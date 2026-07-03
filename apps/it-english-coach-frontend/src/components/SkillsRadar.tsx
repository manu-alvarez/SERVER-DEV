import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../store';

export default function SkillsRadar({ className = "" }: { className?: string }) {
  const { progress } = useAppStore();
  
  const completedModules = Object.values(progress.status).filter(Boolean).length;

  const radarOptions = {
    backgroundColor: 'transparent',
    radar: {
      indicator: [
        { name: 'Vocabulary', max: 100 },
        { name: 'Grammar', max: 100 },
        { name: 'Reading', max: 100 },
        { name: 'Listening', max: 100 },
        { name: 'Speaking', max: 100 },
        { name: 'Writing', max: 100 }
      ],
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisName: { color: '#a1a1aa', fontSize: 10 }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [
            Math.min(100, completedModules * 15 + 20),
            Math.min(100, completedModules * 12 + 10),
            Math.min(100, 40 + completedModules * 5),
            Math.min(100, 30 + completedModules * 8),
            Math.min(100, 20 + completedModules * 10),
            Math.min(100, 25 + completedModules * 7)
          ],
          name: 'Skills',
          areaStyle: { color: 'rgba(0, 255, 204, 0.2)' },
          lineStyle: { color: '#00FFCC' },
          itemStyle: { color: '#00FFCC' }
        }
      ]
    }]
  };

  return (
    <div className={`w-full h-full min-h-[200px] ${className}`}>
      <ReactECharts option={radarOptions} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
