import React from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { id: "jakttider", label: "Jakttider" },
  { id: "soltider", label: "Soltider" }
];

const Menu: React.FC = () => {
  return (
    <nav
      style={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        background: "var(--color-menu-bg)",
        boxShadow: "0 2px 8px rgba(38,77,38,0.15)",
        borderBottom: "2px solid var(--color-neutral)"
      }}
    >
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          gap: "2rem",
          margin: 0,
          padding: "0.5rem 2rem",
          justifyContent: "flex-start"
        }}
      >
        {menuItems.map((item) => (
          <li key={item.id}>
            <NavLink
              to={`/${item.id}`}
              style={({ isActive }) => ({
                color: isActive ? "var(--color-button-text)" : "var(--color-text-secondary)",
                fontWeight: isActive ? "bold" : "normal",
                background: isActive ? "var(--color-neutral)" : "transparent",
                borderRadius: "6px",
                padding: "0.5rem 1.2rem",
                textDecoration: "none",
                transition: "background 0.2s, color 0.2s"
              })}
              end
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Menu;
