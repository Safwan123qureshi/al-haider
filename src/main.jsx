import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/sections.css";
import "./styles/cart.css";
import "./styles/premium.css"; // premium 3D layer — imported last so it refines the base theme

// Enable the scroll-reveal start states BEFORE the first paint. Doing it in a
// React effect (after mount) made cards paint visible for a frame, then snap
// back to the hidden start state — a visible flash on every load. useReveal()
// removes the class again and marks everything visible when motion is reduced
// or IntersectionObserver is unavailable, so content can never get stuck hidden.
document.documentElement.classList.add("reveal-active");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
