import React from "react";

const Menu: React.FC = () => {
  return (
    <nav style={{ padding: "1rem", background: "#eee" }}>
      <ul style={{ listStyle: "none", display: "flex", gap: "1rem", margin: 0, padding: 0 }}>
        <li><a href="#jakttider">Jakttider</a></li>
        <li><a href="#soltider">Soltider</a></li>
      </ul>
    </nav>
  );
};

export default Menu;

