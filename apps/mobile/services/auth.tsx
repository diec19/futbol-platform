import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthState = { token: string | null; loading: boolean };

const AuthContext = createContext<{
  token: string | null;
  loading: boolean;
  login: (token: string, member: any) => Promise<void>;
  logout: () => Promise<void>;
}>({ token: null, loading: true, login: async () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, loading: true });

  useEffect(() => {
    AsyncStorage.getItem('member_token').then((token) => {
      setState({ token, loading: false });
    });
  }, []);

  const login = useCallback(async (token: string, member: any) => {
    await AsyncStorage.setItem('member_token', token);
    await AsyncStorage.setItem('member_data', JSON.stringify(member));
    setState({ token, loading: false });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('member_token');
    await AsyncStorage.removeItem('member_data');
    setState({ token: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ token: state.token, loading: state.loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
