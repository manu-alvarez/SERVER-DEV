import { motion } from 'framer-motion';
import { Download, ExternalLink, Code, Briefcase, Mail, MapPin, Globe } from 'lucide-react';
import './App.css';

function App() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-content">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <img 
                src="/avatar.png" 
                alt="Manuel Álvarez" 
                style={{ 
                  width: '150px', 
                  height: '150px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                  filter: 'grayscale(20%)'
                }} 
              />
            </div>
            <h1 className="hero-title">Manuel Álvarez Diánez</h1>
            <h2 className="hero-subtitle">
              Soporte IT · Sistemas & Redes · Perfil Logístico
            </h2>
            <div className="flex-center" style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              <span className="flex-center" style={{ gap: '0.5rem' }}><MapPin size={18} /> España (Remoto / Presencial)</span>
              <span className="flex-center" style={{ gap: '0.5rem' }}><Mail size={18} /> manuelalvarezdianez@hotmail.com</span>
            </div>
            
            <div className="hero-actions">
              <a href="#about" className="btn btn-primary">
                Conocer mi perfil
              </a>
              <a href="/CV-Manuel_Alvarez_Dianez.pdf" download className="btn btn-secondary">
                <Download size={18} /> Descargar CV PDF
              </a>
            </div>

            <div className="hero-actions" style={{ marginTop: '1.5rem', gap: '1.5rem' }}>
              <a href="https://linkedin.com/in/manu-alvarez-dev" target="_blank" rel="noreferrer" className="icon-link" data-tooltip="LinkedIn"><Briefcase size={24} /></a>
              <a href="https://github.com/manu-alvarez" target="_blank" rel="noreferrer" className="icon-link" data-tooltip="GitHub"><Code size={24} /></a>
              <a href="https://manuelalvarez.dev" target="_blank" rel="noreferrer" className="icon-link" data-tooltip="MSBross Ecosystem"><ExternalLink size={24} /></a>
              <a href="https://manuelalvarez.dev" target="_blank" rel="noreferrer" className="icon-link" data-tooltip="Manuel Álvarez Hub"><Globe size={24} /></a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="section" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <div className="container">
          <motion.div 
            className="glass-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>Perfil Profesional</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
              Técnico en Sistemas Microinformáticos y Redes, con experiencia multiplataforma, en virtualización y administración básica de entornos de red. Perfil orientado al sentido práctico y la eficiencia: desarrollo utilidades personalizadas e integro herramientas de Inteligencia Artificial para simplificar flujos operativos y resolver incidencias informáticas del día a día de manera honesta y organizada. 
              <br/><br/>
              En mi tiempo personal mantengo un pequeño portfolio de aplicaciones prácticas (manuelalvarez.dev) donde pongo en práctica estas habilidades. Complemento mi perfil técnico con una sólida trayectoria en logística y producción industrial en compañías de referencia como Procter & Gamble, GB Foods y Döhler, que aporta disciplina, compromiso con la seguridad y orientación a la mejora continua.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SKILLS SECTION */}
      <section id="skills" className="section">
        <div className="container">
          <h2 className="section-title">Competencias Clave</h2>
          <motion.div 
            className="grid grid-cols-2"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="glass-card" variants={fadeInUp}>
              <div className="skills-category">
                <h3>IT & Sistemas</h3>
                <div>
                  <span className="tag">Sistemas Windows / Linux</span>
                  <span className="tag">Redes y conectividad</span>
                  <span className="tag">Virtualización</span>
                  <span className="tag">Soporte técnico e incidencias</span>
                  <span className="tag">Integración de herramientas IA</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div className="glass-card" variants={fadeInUp}>
              <div className="skills-category">
                <h3>Logística & Industria</h3>
                <div>
                  <span className="tag">SAP</span>
                  <span className="tag">Control de stock e inventarios</span>
                  <span className="tag">Carretilla retráctil</span>
                  <span className="tag">Gestión de almacén y producción</span>
                  <span className="tag">Prevención y Calidad</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* EXPERIENCE SECTION */}
      <section id="experience" className="section" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <div className="container">
          <h2 className="section-title">Experiencia Profesional</h2>
          
          <div className="timeline">
            {[
              { role: 'Expendedor de Gasolinera', company: 'Newton Energies', date: 'Abr 2026 – Jun 2026', desc: 'Atención al cliente, arqueo de caja, recepción de pedidos, reposición y control de inventario.' },
              { role: 'Operario de Producción', company: 'Döhler', date: 'Feb 2026 – Abr 2026', desc: 'Operación de maquinaria industrial, control de calidad, inspección de procesos productivos y mantenimiento preventivo básico.' },
              { role: 'Técnico Informático', company: 'Teringo S.L.U.', date: 'Oct 2025 – Dic 2025', desc: 'Soporte técnico a usuarios, administración básica de sistemas, resolución de incidencias e instalación y configuración de equipos informáticos.' },
              { role: 'Operario Logístico', company: 'Procter & Gamble', date: 'Feb 2025 – Jun 2025 · Oct 2020 – Ago 2022', desc: 'Preparación de pedidos, picking, ubicación de mercancías, carga y descarga, gestión de almacén y utilización de PDA.' },
              { role: 'Carretillero Retráctil', company: 'GB Foods', date: 'Oct 2023 – Ene 2025', desc: 'Ubicación de mercancía en altura mediante carretilla retráctil, expediciones, abastecimiento de líneas de producción, control de stock y uso de SAP.' }
            ].map((exp, i) => (
              <motion.div 
                key={i}
                className="timeline-item"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="timeline-dot"></div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <span className="timeline-date">{exp.date}</span>
                  <h3 className="timeline-title">{exp.role}</h3>
                  <div className="timeline-company">{exp.company}</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{exp.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EDUCATION & CERTS */}
      <section id="education" className="section">
        <div className="container">
          <h2 className="section-title">Formación y Certificaciones</h2>
          
          <motion.div 
            className="grid grid-cols-2"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="glass-card" variants={fadeInUp}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>Formación Académica</h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem' }}>Técnico en Sistemas Microinformáticos y Redes (SMR)</h4>
                <p style={{ color: 'var(--text-secondary)' }}>ILERNA · 2022 – 2023</p>
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem' }}>Educación Secundaria Obligatoria (ESO)</h4>
                <p style={{ color: 'var(--text-secondary)' }}>IES El Coronil</p>
              </div>
            </motion.div>

            <motion.div className="glass-card" variants={fadeInUp}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>Certificaciones</h3>
              <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <li>▹ Cisco CCST Networking</li>
                <li>▹ Cisco CCST Cybersecurity</li>
                <li>▹ Scrum Fundamentals Certified (SFC)</li>
                <li>▹ Kanban Essentials Certified (KEC)</li>
                <li>▹ Six Sigma Yellow Belt</li>
                <li>▹ Carnet de Carretillas y Elevadoras</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '3rem 0', textAlign: 'center', borderTop: '1px solid var(--glass-border)', backgroundColor: '#0a0b0e' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>© {new Date().getFullYear()} Manuel Álvarez Diánez. Todos los derechos reservados.</p>

      </footer>
    </>
  );
}

export default App;
