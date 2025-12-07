// src/pages/LoginPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Si ya está logueado, mandarlo a pacientes
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const resetMessages = () => {
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      // AuthContext detecta el cambio y navigate('/') se ejecuta en el useEffect
    }

    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!nombre.trim()) {
      setErrorMsg('Escribe tu nombre.');
      return;
    }
    if (password !== password2) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const fullName = `${nombre.trim()} ${apellido.trim()}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Si tienes desactivada la confirmación de email,
    // normalmente ya te devuelve sesión y AuthContext redirige.
    if (data.session) {
      setInfoMsg('Registro exitoso, iniciando sesión...');
      // el useEffect de arriba hará el navigate('/')
    } else {
      // Si tienes confirmación de correo activa:
      setInfoMsg(
        'Registro exitoso. Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.'
      );
    }

    setLoading(false);
  };

  const isLogin = mode === 'login';

  return (
    <div className="login-container">
      <form
        className="login-card"
        onSubmit={isLogin ? handleLogin : handleRegister}
      >
        <h1>{isLogin ? 'Ingreso Nutriólogo' : 'Registro de Nutriólogo'}</h1>

        {/* Switch entre login / registro */}
        <div className="auth-mode-switch">
          <button
            type="button"
            className={
              isLogin
                ? 'auth-switch-btn auth-switch-btn--active'
                : 'auth-switch-btn'
            }
            onClick={() => {
              setMode('login');
              resetMessages();
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={
              !isLogin
                ? 'auth-switch-btn auth-switch-btn--active'
                : 'auth-switch-btn'
            }
            onClick={() => {
              setMode('register');
              resetMessages();
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Campos extra sólo para registro */}
        {!isLogin && (
          <>
            <label>
              Nombre:
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required={!isLogin}
              />
            </label>

            <label>
              Apellidos:
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </label>
          </>
        )}

        <label>
          Correo:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Contraseña:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {!isLogin && (
          <label>
            Confirmar contraseña:
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required={!isLogin}
            />
          </label>
        )}

        {errorMsg && <p className="error">{errorMsg}</p>}
        {infoMsg && <p className="info">{infoMsg}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? isLogin
              ? 'Entrando...'
              : 'Registrando...'
            : isLogin
            ? 'Entrar'
            : 'Registrarme'}
        </button>
      </form>
    </div>
  );
}
