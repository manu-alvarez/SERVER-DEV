import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Projects from './components/Projects';
import About from './components/About';
import Technologies from './components/Technologies';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ParticleCanvas from './components/ParticleCanvas';

function App() {
  return (
    <div className="relative min-h-screen bg-[#040714] text-[#F1F5F9] selection:bg-cyan-500/30 selection:text-white">
      <ParticleCanvas />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Projects />
        <About />
        <Technologies />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
