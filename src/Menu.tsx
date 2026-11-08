import { Link, NavLink } from 'react-router-dom';
import { BrandMark } from './components/AnimalIcon/AnimalIcon';

const Menu = () => (
  <header className="site-header">
    <Link className="brand" to="/" aria-label="Jaktsäsong – startsida">
      <span className="brand-mark"><BrandMark /></span>
      <span>JAKTSÄSONG</span>
    </Link>
    <nav className="main-nav" aria-label="Huvudnavigation">
      <NavLink to="/" end>Jakttider</NavLink>
      <NavLink to="/jaktplanering">Vind &amp; vittring</NavLink>
      <a href="#offline-guide" onClick={() => {
        const guide = document.getElementById('offline-guide') as HTMLDetailsElement | null;
        if (guide) guide.open = true;
      }}>Installera</a>
    </nav>
    <span className="header-tagline">Säker jakt. Stark natur.</span>
  </header>
);

export default Menu;
