import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, Clock, Plus, Target, ChevronRight } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { tasks, settings } = useTaskStore();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.createdAt && t.createdAt.startsWith(today));
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');

  const stats = [
    { id: 'today', title: 'Tareas Hoy', value: todayTasks.length, icon: <Target size={24} />, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20', filter: 'all' },
    { id: 'completed', title: 'Completadas', value: completedTasks.length, icon: <CheckCircle2 size={24} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', filter: 'completed' },
    { id: 'pending', title: 'Pendientes', value: pendingTasks.length, icon: <Flame size={24} />, color: 'text-accent-400', bg: 'bg-accent-500/10 border-accent-500/20', filter: 'pending' },
    { id: 'urgent', title: 'Urgentes', value: highPriorityTasks.length, icon: <Clock size={24} />, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', filter: 'high' },
  ];

  const handleStatClick = (filter: string) => navigate(`/tasks?filter=${filter}`);

  return (
    <div className="flex-1 flex flex-col gap-6 lg:gap-8 pb-10 relative">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 mt-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <h2 className="text-4xl md:text-5xl font-display font-black mb-2 tracking-tight">
            Buen día, <span className="text-gradient">{settings.whatsappPhone1 || 'Comandante'}</span>
          </h2>
          <p className="text-muted-foreground font-semibold text-lg">
            Tienes {pendingTasks.length} misiones activas en el núcleo.
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <button 
            onClick={() => navigate('/tasks')}
            className="btn-premium font-display tracking-wide flex items-center gap-2 py-4 px-8 rounded-[20px] text-lg font-black cursor-pointer shadow-xl"
          >
            <Plus size={22} className="relative z-10 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">Nueva Misión</span>
          </button>
        </motion.div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 mt-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.id}
            className="portal-card cursor-pointer group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
            onClick={() => handleStatClick(stat.filter)}
          >
            <div className="portal-card-inner p-5 md:p-6 flex items-center gap-4">
              <div className={`p-4 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <h3 className="text-4xl font-display font-black leading-none mb-1 tracking-tighter">{stat.value}</h3>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  {stat.title}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lower Bento Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 mt-2">
        
        {/* Next Missions */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-display font-black tracking-tight">Misiones de Próxima Ejecución</h3>
            <button onClick={() => navigate('/tasks')} className="text-brand-400 hover:text-brand-300 text-sm font-semibold flex items-center transition-colors group cursor-pointer">
              Ver todas <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {pendingTasks.slice(0, 5).map((task, i) => (
               <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + (i * 0.1) }}
                className="glass-panel p-4 flex items-center justify-between rounded-xl group hover:bg-white/[0.04]"
               >
                 <div className="flex items-center gap-4">
                   <div className={`w-1.5 h-10 rounded-full ${
                     task.priority === 'high' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                     task.priority === 'medium' ? 'bg-accent-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-brand-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                   }`} />
                   <div>
                     <h4 className="font-bold text-white/90 text-lg group-hover:text-brand-300 transition-colors">{task.title}</h4>
                     <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">PRIORIDAD {task.priority}</span>
                   </div>
                 </div>
                 {task.reminderTime && (
                   <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                     <Clock size={16} className="text-brand-400" />
                   </div>
                 )}
               </motion.div>
            ))}
            
            {pendingTasks.length === 0 && (
              <div className="p-10 text-center glass-panel rounded-2xl border-dashed border-white/20">
                <p className="text-muted-foreground font-semibold">No hay misiones activas. El núcleo está en reposo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Execution Ratio */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-display font-black px-2 tracking-tight">Ratio de Ejecución</h3>
          <motion.div
            className="portal-card h-full min-h-[280px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="portal-card-inner flex flex-col items-center justify-center p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-48 h-48 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
                  <div className="absolute inset-2 rounded-full border border-accent-500/20" />
                  
                  <h2 className="text-6xl font-display font-black text-gradient tracking-tighter">
                    {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                  </h2>
                </div>
                <p className="mt-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Eficiencia Global</p>
              </div>
            </div>
          </motion.div>
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
