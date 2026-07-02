import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Agents from './pages/Agents';
import SaaS from './pages/SaaS';
import Architecture from './pages/Architecture';
import Contact from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="agents" element={<Agents />} />
          <Route path="saas" element={<SaaS />} />
          <Route path="architecture" element={<Architecture />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
