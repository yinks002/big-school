import { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native'; // Import AppState
import { supabase } from '../lib/supabase';

const AuthContext = createContext({ session: null, loading: true, userRole: null });

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Helper to get profile role
  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (data) setUserRole(data.role);
    } catch (e) {
      console.error("Profile fetch error:", e);
    }
  };

  useEffect(() => {
    // 1. Initial Session Check
    const initializeAuth = async () => {
      try {
        const { data: { session: initSession } } = await supabase.auth.getSession();
        setSession(initSession);
        if (initSession) await fetchProfile(initSession.user.id);
      } catch (error) {
        console.log("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for Auth Changes (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchProfile(newSession.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    // 3. 🧠 THE FIX: Listen for App State Changes (Tab Switching)
    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground -> Refresh Session to prevent freezing
        supabase.auth.getSession().then(({ data: { session: refreshedSession } }) => {
          setSession(refreshedSession);
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      appStateListener.remove();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);