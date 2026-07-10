'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface ClienteProfile {
  id_cliente: string;
  nome: string;
  email: string;
  cpf: string;
  senha_transacao: string | null;
  created_at: string;
}

interface ContaDetails {
  numero_conta: number;
  saldo: number;
  tipo_conta: string;
  data_abertura: string;
}

interface AuthContextType {
  user: User | null;
  profile: ClienteProfile | null;
  conta: ContaDetails | null;
  loading: boolean;
  refreshConta: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  conta: null,
  loading: true,
  refreshConta: async () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClienteProfile | null>(null);
  const [conta, setConta] = useState<ContaDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndAccount = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileErr } = await supabase
        .from('clientes')
        .select('*')
        .eq('id_cliente', userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      setProfile(profileData);

      if (profileData) {
        // Fetch account
        const { data: contaData, error: contaErr } = await supabase
          .from('contas')
          .select('*')
          .eq('id_cliente', userId)
          .maybeSingle();

        if (contaErr) throw contaErr;
        setConta(contaData);
      }
    } catch (err) {
      console.error('Error fetching client auth data:', err);
    }
  }, []);

  const refreshConta = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('contas')
        .select('*')
        .eq('id_cliente', user.id)
        .maybeSingle();
      if (error) throw error;
      setConta(data);
    } catch (err) {
      console.error('Error refreshing account balance:', err);
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id_cliente', user.id)
        .maybeSingle();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error refreshing profile details:', err);
    }
  }, [user]);

  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setConta(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfileAndAccount(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfileAndAccount(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setConta(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndAccount]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        conta,
        loading,
        refreshConta,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
