import React, { useState } from "react";

const menuItems = [
  { id: "jakttider", label: "Jakttider" },
  { id: "soltider", label: "Soltider" }
];

const Menu: React.FC = () => {
  const [active, setActive] = useState(menuItems[0].id);

  return (
    <nav
      style={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        background: "#1A2B1A",
        boxShadow: "0 2px 8px rgba(38,77,38,0.15)",
        borderBottom: "2px solid #264D26"
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
            <a
              href={`#${item.id}`}
              onClick={() => setActive(item.id)}
              style={{
                color: active === item.id ? "#E6F2E6" : "#A7C7A7",
                fontWeight: active === item.id ? "bold" : "normal",
                background: active === item.id ? "#264D26" : "transparent",
                borderRadius: "6px",
                padding: "0.5rem 1.2rem",
                textDecoration: "none",
                transition: "background 0.2s, color 0.2s"
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Menu;
