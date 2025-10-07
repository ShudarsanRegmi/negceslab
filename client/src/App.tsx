import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Loader from "./components/Loader";
import { useAuth } from "./contexts/AuthContext";

// Pages (to be created)
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTemporaryReleases from "./pages/AdminTemporaryReleases";
import AdminComputerManagement from "./pages/AdminComputerManagement";
import BookingForm from "./pages/BookingForm";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import ComputerGrid from "./pages/ComputerGrid";
import LabOverview from "./pages/LabOverview";
import HomePage from "./pages/HomePage";
import Rules from "./pages/Rules";
import Team from "./pages/Team";
import Contact from "./pages/Contact";
import SystemDetails from "./pages/SystemDetails";
import Achievement from "./pages/Achievement";

const basename = import.meta.env.VITE_ROUTER_BASE_CONFIG || '/';
console.log("Basename is: ", basename);

const AppContent = () => {
  const { theme } = useTheme();
  const { loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router basename={basename}>
          <Routes>
                <Route
                  path="/login"
                  element={
                    <MainLayout>
                      <Login />
                    </MainLayout>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <MainLayout>
                      <Register />
                    </MainLayout>
                  }
                />
                <Route
                  path="/"
                  element={
                    <MainLayout>
                      <HomePage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/rules"
                  element={
                    <MainLayout>
                      <Rules />
                    </MainLayout>
                  }
                />
                <Route
                  path="/team"
                  element={
                    <MainLayout>
                      <Team />
                    </MainLayout>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <MainLayout>
                      <Contact />
                    </MainLayout>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Layout>
                        <AdminDashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/temporary-releases"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Layout>
                        <AdminTemporaryReleases />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/computers"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Layout>
                        <AdminComputerManagement />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/book"
                  element={
                    <ProtectedRoute requiredRole="user">
                      <Layout>
                        <BookingForm />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lab-overview"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <LabOverview />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/computers"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ComputerGrid />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/system-details"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <SystemDetails />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/achievements"
                  element={
                    <MainLayout>
                      <Achievement />
                    </MainLayout>
                  }
                />
              </Routes>
            </Router>
          </LocalizationProvider>
        </MuiThemeProvider>
      );
    };

    function App() {
      return (
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      );
    }

    export default App;
