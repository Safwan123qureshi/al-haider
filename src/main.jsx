import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/sections.css";
import "./styles/cart.css";
import "./styles/premium.css"; // premium 3D layer — imported last so it refines the base theme

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
