import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onLogin(email);
  };

  return (
    <div className="login-card">
      <h2 style={{color:'#E6A868', marginBottom:'10px'}}>Bienvenido</h2>
      <p style={{color:'#8D6E63', fontSize:'0.9rem'}}>Ingresa tu correo para acceder a tu diario</p>
      
      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="tucorreo@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary" style={{width: '100%', justifyContent:'center'}}>
            Entrar al Diario
        </button>
      </form>
    </div>
  );
}