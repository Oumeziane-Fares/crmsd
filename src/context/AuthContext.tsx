import  { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the user data and the context
interface User {
  id: string;
  fullName: string;
  email: string;
  // Add any other user properties you need
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean; // To handle the initial check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true

  useEffect(() => {
    // This function checks if a session exists on the backend
    const checkUserSession = async () => {
      const API_URL = 'http://localhost/crmsd/finances-old/action.php';
      const formData = new FormData();
      formData.append('action', 'check_login');

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (data && data.finances_id) {
          // If the backend returns user data, the user is logged in
          const userData = {
            id: data.finances_id,
            fullName: `${data.finances_nom} ${data.finances_prenom}`,
            email: data.finances_email,
          };
          login(userData);
        }
      } catch (error) {
        console.error("Failed to check login status:", error);
      } finally {
        setIsLoading(false); // Stop loading after the check is complete
      }
    };

    checkUserSession();
  }, []);

  const login = (userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
    // You could also save a token to localStorage here if you were using one
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    // Also call a backend endpoint to destroy the session if needed
  };

  // While checking the session, you might want to show a loader instead of the app
  if (isLoading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily use the auth context in other components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};