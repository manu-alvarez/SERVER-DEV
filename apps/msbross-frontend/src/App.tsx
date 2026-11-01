import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Projects from './components/Projects';
import About from './components/About';
import Technologies from './components/Technologies';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ParticleCanvas from './components/ParticleCanvas';
import AppsCatalog from './components/AppsCatalog';

/**
 * Cierre manuelalvarez.dev: dos vistas SIN router extra —
 * · '/'    → portada (destacados + acceso al catálogo)
 * · '/apps' → catálogo completo (único listado completo de la web)
 * El proxy sirve este mismo index.html para ambas rutas.
 */
function isCatalogRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.replace(/\/+$/, '') === '/apps';
}

function App() {
  if (isCatalogRoute()) {
    return <AppsCatalog />;
  }
  return (
    <div className="relative min-h-[100dvh] bg-[#060B18] text-[#F1F5F9] selection:bg-cyan-500/30 selection:text-white">
      <ParticleCanvas />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <About />
        <Projects />
        <Technologies />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
