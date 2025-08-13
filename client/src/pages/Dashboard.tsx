import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Grid from '@mui/material/Grid';
import {
  Computer as ComputerIcon,
  BookOnline as BookingIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Cancel as CancelIcon,
  Notifications as NotificationIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  ArrowUpward as ArrowUpIcon,
  AccessTime as ClockIcon,
  Close as CloseIcon,
  ExitToApp as FreeIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { format, addDays, isBefore, startOfDay, isWithinInterval, parseISO } from "date-fns";
import { bookingsAPI, computersAPI, temporaryReleaseAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";


interface Booking {
  _id: string;
  computerId: {
    _id: string;
    name: string;
    location: string;
    specifications?: string;
  };
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  reason: string;
  rejectionReason?: string;
  createdAt: string;
  mentor?: string; // Added mentor field
  freedAt?: string; // Added freed tracking
  freedBy?: string; // Added freed tracking
}

interface Computer {
  _id: string;
  name: string;
  location: string;
  status: "available" | "maintenance" | "booked";
  specifications: string;
  currentBookings?: Booking[];
  nextAvailable?: string;
  nextAvailableDate?: string;
}

interface TemporaryRelease {
  _id: string;
  originalBookingId: string;
  userId: string;
  computerId: {
    _id: string;
    name: string;
    location: string;
  };
  releaseDates: string[];
  reason: string;
  status: "active" | "cancelled";
  tempBookings: string[];
  createdAt: string;
  originalBooking?: Booking;
}

const Dashboard: React.FC = () => {
  const { userRole } = useAuth(); // Get userRole from auth context
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [freeLoading, setFreeLoading] = useState(false);
  const [tempReleaseDialogOpen, setTempReleaseDialogOpen] = useState(false);
  const [tempReleaseLoading, setTempReleaseLoading] = useState(false);
  const [temporaryReleases, setTemporaryReleases] = useState<TemporaryRelease[]>([]);
  // Temporary release form state - now calendar based
  const [selectedReleaseDates, setSelectedReleaseDates] = useState<Date[]>([]);
  const [tempReleaseReason, setTempReleaseReason] = useState("");
  const [calendarValue, setCalendarValue] = useState<Date | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, computersRes] = await Promise.all([
        bookingsAPI.getUserBookings(),
        computersAPI.getComputersWithBookings(),
      ]);
      setBookings(bookingsRes.data || []);
      setComputers(computersRes.data || []);
      
      // Fetch temporary releases separately to handle potential API errors
      try {
        const tempReleasesRes = await temporaryReleaseAPI.getUserTemporaryReleases();
        const list = Array.isArray((tempReleasesRes as any)?.data?.data)
          ? (tempReleasesRes as any).data.data
          : (Array.isArray((tempReleasesRes as any)?.data) ? (tempReleasesRes as any).data : []);
        setTemporaryReleases(list);
      } catch (tempError) {
        console.warn("Error fetching temporary releases:", tempError);
        setTemporaryReleases([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
      // Set fallback empty arrays on error
      setBookings([]);
      setComputers([]);
      setTemporaryReleases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancelLoading(true);
    try {
      await bookingsAPI.cancelBooking(bookingId);
      // Refresh the data after cancellation
      fetchData();
      setCancelDialogOpen(false);
      setSelectedBookingId(null);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setError("Failed to cancel booking");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleFreeSystem = async (bookingId: string) => {
    setFreeLoading(true);
    try {
      await bookingsAPI.freeSystem(bookingId);
      // Refresh the data after freeing
      fetchData();
      setDetailsDialogOpen(false);
      setSelectedBookingDetails(null);
    } catch (error) {
      console.error("Error freeing system:", error);
      setError("Failed to free system");
    } finally {
      setFreeLoading(false);
    }
  };

  const openCancelDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedBookingId(null);
  };

  const handleRowClick = (booking: Booking) => {
    setSelectedBookingDetails(booking);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedBookingDetails(null);
  };

  const handleCreateTemporaryRelease = async () => {
    if (!selectedBookingDetails || selectedReleaseDates.length === 0 || !tempReleaseReason.trim()) {
      setError("Please select at least one date and provide a reason");
      return;
    }

    setTempReleaseLoading(true);
    try {
      await temporaryReleaseAPI.createTemporaryRelease({
        bookingId: selectedBookingDetails._id,
        // Use local date-only strings to avoid timezone off-by-one
        releaseDates: selectedReleaseDates.map(date => format(date, 'yyyy-MM-dd')),
        reason: tempReleaseReason.trim(),
      });
      
      // Refresh data and close dialogs
      fetchData();
      setTempReleaseDialogOpen(false);
      setDetailsDialogOpen(false);
      resetTempReleaseForm();
    } catch (error: any) {
      console.error("Error creating temporary release:", error);
      setError(error.response?.data?.message || "Failed to create temporary release");
    } finally {
      setTempReleaseLoading(false);
    }
  };

  const resetTempReleaseForm = () => {
    setSelectedReleaseDates([]);
    setTempReleaseReason("");
    setCalendarValue(null);
  };

  const openTempReleaseDialog = () => {
    setTempReleaseDialogOpen(true);
  };

  const closeTempReleaseDialog = () => {
    setTempReleaseDialogOpen(false);
    resetTempReleaseForm();
  };

  // Calendar helper functions
  const handleDateSelect = (date: Date | null) => {
    if (!date || !selectedBookingDetails) return;
    
    // Compare using local yyyy-MM-dd strings to avoid timezone drift
    const bookingStartStr = selectedBookingDetails.startDate;
    const bookingEndStr = selectedBookingDetails.endDate;
    const dateStr = format(date, 'yyyy-MM-dd');

    // Check if date is within booking period (inclusive)
    if (dateStr < bookingStartStr || dateStr > bookingEndStr) {
      return;
    }
    
    const isSelected = selectedReleaseDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
    
    if (isSelected) {
      // Remove date if already selected
      setSelectedReleaseDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
    } else {
      // Add date if not selected
      setSelectedReleaseDates(prev => [...prev, date]);
    }
  };

  const isDateInBookingRange = (date: Date) => {
    if (!selectedBookingDetails) return false;
    const bookingStart = parseISO(selectedBookingDetails.startDate);
    const bookingEnd = parseISO(selectedBookingDetails.endDate);
    return isWithinInterval(date, { start: bookingStart, end: bookingEnd });
  };

  const isDateSelected = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedReleaseDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
  };

  const shouldDisableDate = (date: Date) => {
    // Disable if date is not in booking range
    if (!isDateInBookingRange(date)) return true;
    
    // Disable Sundays (getDay() returns 0 for Sunday)
    if (date.getDay() === 0) return true;
    
    return false;
  };

  const handleCancelTemporaryRelease = async (releaseId: string) => {
    try {
      await temporaryReleaseAPI.cancelTemporaryRelease(releaseId);
      fetchData(); // Refresh the data
    } catch (error: any) {
      console.error("Error cancelling temporary release:", error);
      setError(error.response?.data?.message || "Failed to cancel temporary release");
    }
  };

  const isBookingActive = (booking: Booking) => {
    if (booking.status !== 'approved') return false;
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const bookingStartDate = new Date(booking.startDate).toISOString().split('T')[0];
    const bookingEndDate = new Date(booking.endDate).toISOString().split('T')[0];

    // Check if booking is currently active
    return (
      (bookingStartDate < currentDate || 
       (bookingStartDate === currentDate && booking.startTime <= currentTime)) &&
      (bookingEndDate > currentDate || 
       (bookingEndDate === currentDate && booking.endTime >= currentTime))
    );
  };

  const canBookingBeFreed = (booking: Booking) => {
    // Can free if booking is approved and either active or future
    if (booking.status !== 'approved') return false;
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const bookingEndDate = new Date(booking.endDate).toISOString().split('T')[0];

    // Can free if booking hasn't ended yet (includes both active and future bookings)
    return (
      bookingEndDate > currentDate || 
      (bookingEndDate === currentDate && booking.endTime >= currentTime)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      case "cancelled":
        return "info";
      case "completed":
        return "success";
      default:
        return "info";
    }
  };

  const getComputerStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "success";
      case "maintenance":
        return "warning";
      case "booked":
        return "error";
      default:
        return "info";
    }
  };

  const recentBookings = bookings.slice(0, 5);
  const availableComputers = computers.filter(
    (c: Computer) => c.status === "available"
  ).length;
  const maintenanceComputers = computers.filter(
    (c: Computer) => c.status === "maintenance"
  ).length;
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(
    (b: Booking) => b.status === "pending"
  ).length;
  const activeBookings = bookings.filter(
    (b: Booking) => b.status === "approved"
  ).length;
  const totalComputers = computers.length;
  const labUtilization =
    totalComputers > 0
      ? Math.round((activeBookings / totalComputers) * 100)
      : 0;

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width={280} height={120} />
          ))}
        </Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // // If user is admin, don't show the dashboard
  // if (userRole === 'admin') {
  //   return (
  //     <Box sx={{ p: 3 }}>
  //       <Typography variant="h6">
  //         Please use the Admin Dashboard to manage bookings and computers.
  //       </Typography>
  //     </Box>
  //   );
  // }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {/* Total Computers */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "visible",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: 2,
              minHeight: 140,
            }}
          >
            <CardContent
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 3,
                "&:last-child": { pb: 3 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    Total Computers
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: "bold",
                      mb: 1,
                      fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
                    }}
                  >
                    {totalComputers}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ArrowUpIcon sx={{ color: "#4caf50", fontSize: 14 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: "#4caf50", fontSize: "0.75rem" }}
                    >
                      {availableComputers} Available
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    bgcolor: "rgba(33, 150, 243, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                  }}
                >
                  <ComputerIcon sx={{ color: "#1976d2", fontSize: 22 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Active Bookings */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "visible",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: 2,
              minHeight: 140,
            }}
          >
            <CardContent
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 3,
                "&:last-child": { pb: 3 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    Active Bookings
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: "bold",
                      mb: 1,
                      fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
                    }}
                  >
                    {activeBookings}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ClockIcon sx={{ color: "#ff9800", fontSize: 14 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: "#ff9800", fontSize: "0.75rem" }}
                    >
                      {pendingBookings} Pending
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    bgcolor: "rgba(255, 152, 0, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                  }}
                >
                  <BookingIcon sx={{ color: "#f57c00", fontSize: 22 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Users Online */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "visible",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: 2,
              minHeight: 140,
            }}
          >
            <CardContent
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 3,
                "&:last-child": { pb: 3 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    Users Online
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: "bold",
                      mb: 1,
                      fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
                    }}
                  >
                    {activeBookings}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PeopleIcon sx={{ color: "#4caf50", fontSize: 14 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: "#4caf50", fontSize: "0.75rem" }}
                    >
                      Active Now
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    bgcolor: "rgba(76, 175, 80, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                  }}
                >
                  <PeopleIcon sx={{ color: "#2e7d32", fontSize: 22 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Lab Utilization */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "visible",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: 2,
              minHeight: 140,
            }}
          >
            <CardContent
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 3,
                "&:last-child": { pb: 3 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    Lab Utilization
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: "bold",
                      mb: 1,
                      fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
                    }}
                  >
                    {labUtilization}%
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ArrowUpIcon sx={{ color: "#4caf50", fontSize: 14 }} />
                    <Typography
                      variant="body2"
                      sx={{ color: "#4caf50", fontSize: "0.75rem" }}
                    >
                      +5% from yesterday
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    bgcolor: "rgba(33, 150, 243, 0.15)",
                    borderRadius: 1.5,
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    height: 44,
                  }}
                >
                  <BarChartIcon sx={{ color: "#1976d2", fontSize: 22 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Content Grid */}
      <Box>
        {/* Recent Bookings - Only show for non-admin users */}
        {userRole !== 'admin' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Bookings
              </Typography>
              {recentBookings.length === 0 ? (
                <Typography
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 4 }}
                >
                  No bookings yet
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Computer</TableCell>
                        <TableCell>From</TableCell>
                        <TableCell>To</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created On</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentBookings.map((booking) => (
                        <TableRow
                          key={booking._id}
                          onClick={() => handleRowClick(booking)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {booking._id.slice(-6).toUpperCase()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {booking.computerId?.name || "Unknown Computer"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {booking.computerId?.location ||
                                  "Unknown Location"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {isNaN(new Date(booking.startDate).getTime())
                                ? "Invalid date"
                                : format(new Date(booking.startDate), "yyyy-MM-dd")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.startTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {isNaN(new Date(booking.endDate).getTime())
                                ? "Invalid date"
                                : format(new Date(booking.endDate), "yyyy-MM-dd")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.endTime}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status}
                              color={getStatusColor(booking.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {isNaN(new Date(booking.createdAt).getTime())
                                ? "Invalid date"
                                : format(new Date(booking.createdAt), "yyyy-MM-dd HH:mm:ss")}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {booking.status === "pending" && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<CloseIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openCancelDialog(booking._id);
                                  }}
                                  sx={{ minWidth: "auto", px: 1 }}
                                >
                                  Cancel
                                </Button>
                              )}
                              {canBookingBeFreed(booking) && (
                                <Button
                                  variant="outlined"
                                  color="warning"
                                  size="small"
                                  startIcon={<FreeIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFreeSystem(booking._id);
                                  }}
                                  disabled={freeLoading}
                                  sx={{ minWidth: "auto", px: 1 }}
                                >
                                  Free
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Temporary Releases - Only show for non-admin users */}
        {userRole !== 'admin' && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Temporary Releases
              </Typography>
              {(temporaryReleases || []).length === 0 ? (
                <Typography
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 4 }}
                >
                  No temporary releases yet
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Computer</TableCell>
                        <TableCell>Release Dates</TableCell>
                        <TableCell>Time Period</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Temp Bookings</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(temporaryReleases || []).slice(0, 5).map((release) => (
                        <TableRow key={release._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {release.computerId?.name || "Unknown Computer"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {release.computerId?.location || "Unknown Location"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {release.releaseDates.length} day(s)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {release.releaseDates.length > 0 && format(new Date(release.releaseDates[0]), "MMM d")}
                              {release.releaseDates.length > 1 && ` - ${format(new Date(release.releaseDates[release.releaseDates.length - 1]), "MMM d, yyyy")}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {release.originalBooking ? 
                                `${release.originalBooking.startTime} - ${release.originalBooking.endTime}` :
                                'Full Day'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={release.status}
                              color={release.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {release.tempBookings?.length || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {release.status === 'active' && (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleCancelTemporaryRelease(release._id)}
                                sx={{ minWidth: "auto", px: 1 }}
                              >
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Booking Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Booking Details
          <Chip
            label={selectedBookingDetails?.status}
            color={getStatusColor(selectedBookingDetails?.status || '') as any}
            size="small"
            sx={{ ml: 1 }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedBookingDetails && (
            <Box sx={{ py: 1 }}>
              {/* Computer Information */}
              <Typography variant="h6" gutterBottom color="primary">
                Computer Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedBookingDetails.computerId.name}
                </Typography>
                <Typography variant="body1">
                  <strong>Location:</strong> {selectedBookingDetails.computerId.location}
                </Typography>
                {selectedBookingDetails.computerId.specifications && (
                  <Typography variant="body1">
                    <strong>Specifications:</strong> {selectedBookingDetails.computerId.specifications}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Booking Information */}
              <Typography variant="h6" gutterBottom color="primary">
                Booking Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Start Date:</strong> {format(new Date(selectedBookingDetails.startDate), "MMMM d, yyyy")}
                </Typography>
                <Typography variant="body1">
                  <strong>End Date:</strong> {format(new Date(selectedBookingDetails.endDate), "MMMM d, yyyy")}
                </Typography>
                <Typography variant="body1">
                  <strong>Time:</strong> {selectedBookingDetails.startTime} - {selectedBookingDetails.endTime}
                </Typography>
                <Typography variant="body1">
                  <strong>Purpose:</strong> {selectedBookingDetails.reason}
                </Typography>
                <Typography variant="body1">
                  <strong>Mentor:</strong> {selectedBookingDetails?.mentor === undefined ? 'N/A' : (selectedBookingDetails.mentor?.trim() === '' || selectedBookingDetails.mentor?.toLowerCase() === 'self' ? 'Self' : selectedBookingDetails.mentor)}
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong>{" "}
                  <Chip
                    label={selectedBookingDetails.status}
                    color={getStatusColor(selectedBookingDetails.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body1">
                  <strong>Created:</strong> {new Date(selectedBookingDetails.createdAt).toLocaleString()}
                </Typography>
                {selectedBookingDetails.freedAt && (
                  <Typography variant="body1" sx={{ color: 'warning.main' }}>
                    <strong>System Freed Early:</strong> {new Date(selectedBookingDetails.freedAt).toLocaleString()}
                  </Typography>
                )}
              </Box>

              {/* Show rejection reason if booking was rejected */}
              {selectedBookingDetails.status === 'rejected' && selectedBookingDetails.rejectionReason && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom color="error">
                      Rejection Reason
                    </Typography>
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {selectedBookingDetails.rejectionReason}
                    </Alert>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          {selectedBookingDetails?.status === 'pending' && (
            <Button
              color="error"
              onClick={() => {
                handleCloseDetails();
                openCancelDialog(selectedBookingDetails._id);
              }}
              disabled={cancelLoading}
            >
              {cancelLoading ? <CircularProgress size={20} color="inherit" /> : "Cancel Booking"}
            </Button>
          )}
          {selectedBookingDetails && canBookingBeFreed(selectedBookingDetails) && (
            <>
              <Button
                color="info"
                variant="outlined"
                onClick={openTempReleaseDialog}
                disabled={tempReleaseLoading}
              >
                Temporary Release
              </Button>
              <Button
                color="warning"
                variant="contained"
                startIcon={<FreeIcon />}
                onClick={() => handleFreeSystem(selectedBookingDetails._id)}
                disabled={freeLoading}
              >
                {freeLoading ? <CircularProgress size={20} color="inherit" /> : "Free System"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Cancel Booking Dialog */}
      <Dialog open={cancelDialogOpen} onClose={closeCancelDialog}>
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          Are you sure you want to cancel this booking? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog} color="primary" disabled={cancelLoading}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              selectedBookingId && handleCancelBooking(selectedBookingId)
            }
            color="error"
            variant="contained"
            disabled={cancelLoading}
          >
            {cancelLoading ? <CircularProgress size={20} color="inherit" /> : "Confirm Cancel"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Temporary Release Dialog */}
      <Dialog 
        open={tempReleaseDialogOpen} 
        onClose={closeTempReleaseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon />
            Create Temporary Release
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the days within your booking period that you want to temporarily release to other users.
            Each selected day will be available for full-day bookings by others. 
            <strong>Note: Sundays are not available for release.</strong>
          </Typography>
          
          {selectedBookingDetails && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your booking period: {format(new Date(selectedBookingDetails.startDate), "MMM d, yyyy")} to {format(new Date(selectedBookingDetails.endDate), "MMM d, yyyy")} ({selectedBookingDetails.startTime} - {selectedBookingDetails.endTime})
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <DateCalendar
                  value={calendarValue}
                  onChange={(newValue) => {
                    setCalendarValue(newValue);
                    handleDateSelect(newValue);
                  }}
                  shouldDisableDate={shouldDisableDate}
                  sx={{
                    '& .MuiPickersDay-root': {
                      position: 'relative',
                    },
                    '& .Mui-selected': {
                      backgroundColor: isDateSelected(calendarValue || new Date()) ? 'primary.main' : 'inherit',
                    },
                    '& .MuiPickersDay-root.Mui-disabled': {
                      color: 'text.disabled',
                      backgroundColor: 'transparent',
                    }
                  }}
                />
              </Box>
            </LocalizationProvider>
            
            {selectedReleaseDates.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Dates ({selectedReleaseDates.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedReleaseDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date, index) => (
                    <Chip
                      key={index}
                      label={format(date, "MMM d")}
                      size="small"
                      onDelete={() => {
                        const ds = format(date, 'yyyy-MM-dd');
                        setSelectedReleaseDates(prev => 
                          prev.filter(d => format(d, 'yyyy-MM-dd') !== ds)
                        );
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Reason for Temporary Release"
              value={tempReleaseReason}
              onChange={(e) => setTempReleaseReason(e.target.value)}
              multiline
              rows={3}
              size="small"
              placeholder="Why do you want to temporarily release these dates? (e.g., 'Going out of town', 'Don't need system during this period')"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTempReleaseDialog} disabled={tempReleaseLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTemporaryRelease}
            variant="contained"
            disabled={tempReleaseLoading || selectedReleaseDates.length === 0 || !tempReleaseReason.trim()}
            startIcon={tempReleaseLoading ? <CircularProgress size={20} color="inherit" /> : <CalendarIcon />}
          >
            Release {selectedReleaseDates.length} Day{selectedReleaseDates.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
