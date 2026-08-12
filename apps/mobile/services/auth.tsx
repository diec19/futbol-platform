import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthState = { token: string | null; loading: boolean };

const ONBOARDING_KEY = 'onboarding_done';

const AuthContext = createContext<{
  token: string | null;
  loading: boolean;
  onboardingDone: boolean;
  login: (token: string, member: any) => Promise<void>;
  logout: () => Promise<void>;
  setOnboardingDone: () => Promise<void>;
}>({
  token: null,
  loading: true,
  onboardingDone: false,
  login: async () => {},
  logout: async () => {},
  setOnboardingDone: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, loading: true });
  const [onboardingDone, setOnboardingDoneFlag] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('member_token'),
      AsyncStorage.getItem(ONBOARDING_KEY),
    ]).then(([token, onboarding]) => {
      setState({ token, loading: false });
      setOnboardingDoneFlag(onboarding === '1');
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

  const setOnboardingDone = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setOnboardingDoneFlag(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        loading: state.loading,
        onboardingDone,
        login,
        logout,
        setOnboardingDone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
