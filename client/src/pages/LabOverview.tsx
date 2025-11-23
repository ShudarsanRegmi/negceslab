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
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.2s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'primary.main',
                    color: 'white',
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Computer sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="600" color="primary.main" sx={{ lineHeight: 1.2 }}>
                    {stats.totalComputers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Computers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Computers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.2s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'success.main',
                    color: 'white',
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckCircle sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="600" color="success.main" sx={{ lineHeight: 1.2 }}>
                    {stats.availableComputers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Available Now
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Bookings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.2s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'info.main',
                    color: 'white',
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Schedule sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="600" color="info.main" sx={{ lineHeight: 1.2 }}>
                    {stats.totalBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Bookings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Bookings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            },
            transition: 'all 0.2s ease'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'warning.main',
                    color: 'white',
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Info sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="600" color="warning.main" sx={{ lineHeight: 1.2 }}>
                    {stats.pendingBookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Pending Approval
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Computer Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PieChart sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight="600">
                Computer Status Distribution
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Available</Typography>
                <Chip 
                  label={stats.availableComputers} 
                  color="success" 
                  size="small" 
                  sx={{ fontWeight: 600, minWidth: 40 }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalComputers > 0 ? (stats.availableComputers / stats.totalComputers) * 100 : 0}
                sx={{ height: 8, borderRadius: 4, mb: 0.5 }}
                color="success"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Under Maintenance</Typography>
                <Chip 
                  label={stats.maintenanceComputers} 
                  color="warning" 
                  size="small"
                  sx={{ fontWeight: 600, minWidth: 40 }}
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.totalComputers > 0 ? (stats.maintenanceComputers / stats.totalComputers) * 100 : 0}
                sx={{ height: 8, borderRadius: 4, mb: 0.5 }}
                color="warning"
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Reserved</Typography>
                <Chip 
                  label={stats.reservedComputers} 
                  color="error" 
                  size="small"
                  sx={{ fontWeight: 600, minWidth: 40 }}
                />
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
          <Paper sx={{ p: 4, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box 
                sx={{ 
                  p: 1, 
                  borderRadius: 2, 
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <TrendingUp sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight="600">
                Lab Utilization Metrics
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Current Utilization Rate</Typography>
                <Typography variant="h6" color="primary" fontWeight="600">
                  {stats.utilizationRate}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.utilizationRate}
                sx={{ height: 10, borderRadius: 5, mb: 1 }}
                color="primary"
              />
              <Typography variant="body2" color="text.secondary">
                {stats.activeBookings} out of {stats.totalComputers} computers currently in use
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Availability Rate</Typography>
                <Typography variant="h6" color="success.main" fontWeight="600">
                  {stats.availabilityRate}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={stats.availabilityRate}
                sx={{ height: 10, borderRadius: 5, mb: 1 }}
                color="success"
              />
              <Typography variant="body2" color="text.secondary">
                {stats.availableComputers} computers ready for immediate booking
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Status Summary */}
      <Paper sx={{ p: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 4 }}>
          Booking Status Summary
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 3,
              borderRadius: 3, 
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}>
              <Typography variant="h4" fontWeight="600" color="primary.main" sx={{ mb: 1 }}>
                {stats.approvedBookings}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Approved Bookings
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 3,
              borderRadius: 3, 
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}>
              <Typography variant="h4" fontWeight="600" color="success.main" sx={{ mb: 1 }}>
                {stats.activeBookings}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Currently Active
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 3,
              borderRadius: 3, 
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}>
              <Typography variant="h4" fontWeight="600" color="warning.main" sx={{ mb: 1 }}>
                {stats.pendingBookings}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Awaiting Approval
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 3,
              borderRadius: 3, 
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'grey.200',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}>
              <Typography variant="h4" fontWeight="600" color="text.primary" sx={{ mb: 1 }}>
                {stats.totalBookings - stats.approvedBookings - stats.pendingBookings}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
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
