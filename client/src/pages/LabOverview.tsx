import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  Button,
} from "@mui/material";
import {
  Computer,
  Schedule,
  Build,
  CheckCircle,
  Warning,
  Info,
  TrendingUp,
  PieChart,
} from "@mui/icons-material";
import { computersAPI, bookingsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Computer {
  _id: string;
  name: string;
  location: string;
  status: "available" | "maintenance" | "reserved";
  specifications: string;
}

interface Booking {
  _id: string;
  computerId: {
    _id: string;
    name: string;
  };
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  startDate: string;
  endDate: string;
}

const LabOverview: React.FC = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const usePublic = !currentUser; // Use public API if no user is authenticated
      const [computersRes, bookingsRes] = await Promise.all([
        computersAPI.getAllComputers(usePublic),
        currentUser ? bookingsAPI.getAllBookings() : Promise.resolve({ data: [] }),
      ]);
      setComputers(computersRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load lab data");
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalComputers = computers.length;
    const availableComputers = computers.filter(c => c.status === "available").length;
    const maintenanceComputers = computers.filter(c => c.status === "maintenance").length;
    const reservedComputers = computers.filter(c => c.status === "reserved").length;
    
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === "pending").length;
    const approvedBookings = bookings.filter(b => b.status === "approved").length;
    const activeBookings = bookings.filter(b => {
      if (b.status !== "approved") return false;
      const today = new Date().toISOString().split("T")[0];
      return b.startDate <= today && b.endDate >= today;
    }).length;

    const utilizationRate = totalComputers > 0 ? Math.round((activeBookings / totalComputers) * 100) : 0;
    const availabilityRate = totalComputers > 0 ? Math.round((availableComputers / totalComputers) * 100) : 0;

    return {
      totalComputers,
      availableComputers,
      maintenanceComputers,
      reservedComputers,
      totalBookings,
      pendingBookings,
      approvedBookings,
      activeBookings,
      utilizationRate,
      availabilityRate,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Lab Overview
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={140} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Lab Overview
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Lab Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time statistics and overview of the NEGCES Laboratory resources
        </Typography>
      </Box>

      {/* Main Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Computers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, rgba(79, 109, 245, 0.08) 0%, rgba(79, 109, 245, 0.03) 100%)',
            border: '1px solid rgba(79, 109, 245, 0.12)',
            color: 'text.primary',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(79, 109, 245, 0.15)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats.totalComputers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Computers
                  </Typography>
                </Box>
                <Computer sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Computers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.03) 100%)',
            border: '1px solid rgba(76, 175, 80, 0.12)',
            color: 'text.primary',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(76, 175, 80, 0.15)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.availableComputers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Now
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Bookings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.03) 100%)',
            border: '1px solid rgba(33, 150, 243, 0.12)',
            color: 'text.primary',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(33, 150, 243, 0.15)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.totalBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Bookings
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Bookings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 152, 0, 0.03) 100%)',
            border: '1px solid rgba(255, 152, 0, 0.12)',
            color: 'text.primary',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)',
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.pendingBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approval
                  </Typography>
                </Box>
                <Info sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Computer Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <PieChart color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Computer Status Distribution
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Available</Typography>
                <Chip label={stats.availableComputers} color="success" size="small" />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalComputers > 0 ? (stats.availableComputers / stats.totalComputers) * 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
                color="success"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Under Maintenance</Typography>
                <Chip label={stats.maintenanceComputers} color="warning" size="small" />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalComputers > 0 ? (stats.maintenanceComputers / stats.totalComputers) * 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
                color="warning"
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2">Reserved</Typography>
                <Chip label={stats.reservedComputers} color="error" size="small" />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalComputers > 0 ? (stats.reservedComputers / stats.totalComputers) * 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
                color="error"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Utilization Metrics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Lab Utilization Metrics
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1">Current Utilization Rate</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {stats.utilizationRate}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.utilizationRate}
                sx={{ height: 10, borderRadius: 5 }}
                color="primary"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {stats.activeBookings} out of {stats.totalComputers} computers currently in use
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1">Availability Rate</Typography>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  {stats.availabilityRate}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.availabilityRate}
                sx={{ height: 10, borderRadius: 5 }}
                color="success"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {stats.availableComputers} computers ready for immediate booking
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Status Summary */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          Booking Status Summary
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(79, 109, 245, 0.15)' 
                : 'rgba(79, 109, 245, 0.08)',
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(79, 109, 245, 0.3)' 
                : 'rgba(79, 109, 245, 0.12)'}`
            }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {stats.approvedBookings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Bookings
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(76, 175, 80, 0.15)' 
                : 'rgba(76, 175, 80, 0.08)',
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(76, 175, 80, 0.3)' 
                : 'rgba(76, 175, 80, 0.12)'}`
            }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.activeBookings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently Active
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 152, 0, 0.15)' 
                : 'rgba(255, 152, 0, 0.08)',
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(255, 152, 0, 0.3)' 
                : 'rgba(255, 152, 0, 0.12)'}`
            }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.pendingBookings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Awaiting Approval
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
              border: `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {stats.totalBookings - stats.approvedBookings - stats.pendingBookings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed/Rejected
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default LabOverview;
