import React, { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import Diary from "./components/Diary.jsx";

const VALID_EMAILS = [
  "busonlautaro@gmail.com",
  "mlautarobuson@gmail.com"
];

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("diary_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (email) => {
    const clean = email.trim().toLowerCase();
    if (!VALID_EMAILS.includes(clean)) {
      alert("Correo no autorizado.");
      return;
    }
    const userData = { email: clean };
    setUser(userData);
    localStorage.setItem("diary_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("diary_user");
  };

  return (
    <div className="app-root">
      {!user ? (
        <div style={{display:'flex', justifyContent:'center', minHeight:'80vh', alignItems:'center'}}>
             <Login onLogin={handleLogin} />
        </div>
      ) : (
        <>
            <div className="main-title">
                <h1>📔 Mi Diario Personal</h1>
                <p>Un espacio seguro para tus pensamientos</p>
            </div>
            <Diary user={user} onLogout={handleLogout} />
        </>
      )}
    </div>
  );
}