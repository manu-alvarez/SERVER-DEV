import React, { useState, useMemo, useEffect } from 'react';
import toolsData from './tools.json';

interface Tool { id: string; name: string; url: string; description: string; shortcut?: string; }
interface Category { id: string; name: string; icon: string; tools: Tool[]; }

const App: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('moko_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('moko_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    setFavorites(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
  };

  const categories: Category[] = toolsData.categories;
  const allTools = categories.flatMap(c => c.tools.map(t => ({ ...t, category: c.name, icon: c.icon })));
  const categoryNames = ['All', 'Favorites', ...categories.map(c => c.name)];
  
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allTools.filter(t => {
      const matchCat = selectedCategory === 'All' ? true : selectedCategory === 'Favorites' ? favorites.includes(t.name) : t.category === selectedCategory;
      const matchSearch = t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.shortcut && t.shortcut.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [allTools, search, selectedCategory, favorites]);

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
          🛠️ Moko-Tools
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>{allTools.length} herramientas en {categories.length} categorías</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar herramientas..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: '1rem' }} />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categoryNames.slice(0, 8).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                style={{ padding: '0.5rem 1rem', background: selectedCategory === cat ? '#14b8a6' : 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                {cat === 'Favorites' ? '⭐ Favoritos' : cat}
              </button>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filtered.map((tool, i) => {
            const isFav = favorites.includes(tool.name);
            return (
            <div key={i} className="portal-card">
            <a href={tool.url} target="_blank" rel="noopener noreferrer" className="portal-card-inner"
              style={{ display: 'block', padding: '1.5rem', textDecoration: 'none', color: '#f8fafc', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
              <button onClick={(e) => toggleFavorite(e, tool.name)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', opacity: isFav ? 1 : 0.3, transition: 'all 0.2s' }} title="Favorito">
                 {isFav ? '⭐' : '☆'}
              </button>
              <h3 style={{ margin: '0 0 0.5rem', fontWeight: 700, paddingRight: '2rem' }}>{tool.icon} {tool.name}</h3>
              <p style={{ margin: '0 0 0.75rem', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5 }}>{tool.description}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(20,184,166,0.1)', borderRadius: 100, fontSize: '0.75rem', color: '#14b8a6' }}>{tool.category}</span>
                {tool.shortcut && <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: 100, fontSize: '0.75rem', color: '#64748b' }}>{tool.shortcut}</span>}
              </div>
            </a>
            </div>
          )})}
        </div>
        {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#64748b', padding: '4rem' }}>No se encontraron herramientas</p>}
      </div>
    </div>
  );
};

export default App;
