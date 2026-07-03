import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Bots from './pages/Bots';
import Apps from './pages/Apps';
import Architecture from './pages/Architecture';
import Contact from './pages/Contact';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bots" element={<Bots />} />
          <Route path="apps" element={<Apps />} />
          <Route path="architecture" element={<Architecture />} />
          <Route path="profile" element={<Profile />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
