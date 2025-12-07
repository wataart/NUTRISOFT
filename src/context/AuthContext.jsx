// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Obtener sesión inicial y suscribirse a cambios
  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) setSession(data.session || null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2) Cuando haya usuario logueado, asegurar que tenga fila en profiles
  useEffect(() => {
    const ensureProfile = async () => {
      if (!session?.user) return;

      const user = session.user;
      const userId = user.id;

      // ¿Ya existe un profile con este id?
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      // error PGRST116 = no hay filas, es normal la primera vez
      if (error && error.code !== 'PGRST116') {
        console.error('Error comprobando profile:', error);
        return;
      }

      if (!data) {
        // Sacar un nombre rápido del email o metadata
        const fullName =
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Nutriólogo';
        const [nombre, ...rest] = fullName.split(' ');
        const apellido = rest.join(' ');

        const { error: insertError } = await supabase.from('profiles').insert({
          id: userId,
          nombre: nombre || 'Nutriólogo',
          apellido: apellido || '',
        });

        if (insertError) {
          // si ves error 23505 es que ya existía y no pasa nada
          console.error('Error creando profile:', insertError);
        }
      }
    };

    ensureProfile();
  }, [session?.user?.id]);

  const value = { session, user: session?.user || null };

  if (loading) return <div>Cargando...</div>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
