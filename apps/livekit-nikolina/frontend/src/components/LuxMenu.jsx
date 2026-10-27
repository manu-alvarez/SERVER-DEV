import React from 'react';

const MENU_DATA = {
  entrantes: [
    { id: 11, name: 'CROQUETAS DE JAMÓN IBÉRICO', price: '14€', desc: '100% Bellota, rebozado panko y bechamel extra cremosa.', img: './assets/croquetas.png', tag: 'TOP VENTAS' },
    { id: 12, name: 'ENSALADA MEDITERRÁNEA', price: '12.5€', desc: 'Tomate, pepino, aceitunas kalamata, queso feta y AOVE.', img: './assets/ensalada.png' },
    { id: 13, name: 'GAZPACHO ANDALUZ', price: '9€', desc: 'Receta tradicional con picatoste de jamón y huevo.', img: './assets/gazpacho.png' },
  ],
  principales: [
    { id: 21, name: 'PAELLA VALENCIANA', price: '22€', desc: 'Arroz bomba, marisco fresco y azafrán de hebra.', img: './assets/paella.png', tag: 'ESPECIALIDAD' },
    { id: 22, name: 'SOLOMILLO DE TERNERA', price: '28€', desc: 'Nacional, a la brasa con reducción de Pedro Ximénez.', img: './assets/solomillo.png' },
    { id: 23, name: 'LUBINA A LA PLANCHA', price: '24.5€', desc: 'Salvaje, con emulsión de ajos tiernos y verduras.', img: './assets/lubina.png' },
    { id: 24, name: 'RISOTTO DE SETAS', price: '18.5€', desc: 'Cremoso de boletus con lascas de parmesano gallego.', img: './assets/risotto.png' },
  ],
  postres: [
    { id: 31, name: 'TARTA DE QUESO MSB', price: '8.5€', desc: 'Horneada al estilo San Sebastián con frutos rojos.', img: './assets/tarta.png' },
    { id: 32, name: 'TIRAMISÚ CASERO', price: '7.5€', desc: 'Bizcocho al Amaretto y mascarpone artesanal.', img: './assets/tiramisu.png' },
  ],
  bebidas: [
    { id: 41, name: 'SANGRÍA DE LA CASA', price: '5€', desc: 'Receta secreta MSB con fruta de temporada.', img: './assets/sangria.png' },
    { id: 42, name: 'CAVA RESERVA', price: '24€', desc: 'Brut Nature Selección Especial.', img: './assets/cava.png' },
  ]
};

export default function LuxMenu({ onClose }) {
  return (
    <div className="luxury-modal-overlay" onClick={onClose}>
      <div className="luxury-modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-luxury" onClick={onClose}>&times;</button>
        
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '4px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Experiencia Gastronómica</span>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--gold-primary)', margin: '0.5rem 0' }}>LA CARTA MSB</h2>
          <div style={{ width: '60px', height: '1px', background: 'var(--gold-primary)', margin: '0 auto' }}></div>
        </header>

        <div className="menu-sections-container">
          {Object.entries(MENU_DATA).map(([category, items]) => (
            <section key={category} style={{ marginBottom: '4rem' }}>
              <h3 style={{ fontFamily: 'Outfit', letterSpacing: '6px', fontSize: '0.9rem', color: 'var(--gold-bright)', textTransform: 'uppercase', marginBottom: '2rem', textAlign: 'center', opacity: 0.8 }}>
                {category}
              </h3>
              
              <div className="lux-menu-grid">
                {items.map(item => (
                  <div key={item.id} className="lux-menu-card">
                    {item.img && (
                      <div className="card-image-container">
                        <img src={item.img} alt={item.name} className="card-image" />
                        {item.tag && (
                          <div className="card-overlay">
                            <span style={{ fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--gold-bright)' }}>{item.tag}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ padding: '1.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', color: 'var(--text-pure)', fontWeight: 600 }}>{item.name}</h4>
                        <span style={{ color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.9rem' }}>{item.price}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        
        <footer style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.5 }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '2px' }}>IVA INCLUIDO · PRODUCTOS DE PROXIMIDAD</p>
        </footer>
      </div>
    </div>
  );
}
