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

// Pages (to be created)
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BookingForm from "./pages/BookingForm";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import ComputerGrid from "./pages/ComputerGrid";
import HomePage from "./pages/HomePage";
import Rules from "./pages/Rules";
import Team from "./pages/Team";
import Contact from "./pages/Contact";

const AppContent = () => {
  const { theme } = useTheme();

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <NotificationProvider>
            <Router>
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
              </Routes>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
