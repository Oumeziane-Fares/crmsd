import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Layout Component
import AppLayout from "./layout/AppLayout";

// Page Components
import Ecommerce from "./pages/Dashboard/Ecommerce";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import UserProfiles from "./pages/UserProfiles";
import NotFound from "./pages/OtherPage/NotFound";

// --- IMPORT YOUR NEW PAGE ---
import HcpsPage from "./pages/HcpsPage";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />}>
              <Route index element={<Ecommerce />} />
              <Route path="profile" element={<UserProfiles />} />
              
              {/* --- ADD THE ROUTE FOR YOUR NEW PAGE --- */}
              <Route path="hcps" element={<HcpsPage />} />

            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
