import { NavLink } from 'react-router-dom';
import { BrandMark } from './components/AnimalIcon/AnimalIcon';

const Menu = () => (
  <header className="site-header">
    <a className="brand" href="/huntingseasons/jakttider" aria-label="Jaktsäsong – startsida">
      <span className="brand-mark"><BrandMark /></span>
      <span>JAKTSÄSONG</span>
    </a>
    <nav className="main-nav" aria-label="Huvudnavigation"><NavLink to="/jakttider">Jakttider</NavLink></nav>
    <span className="header-tagline">Säker jakt. Stark natur.</span>
  </header>
);

export default Menu;
