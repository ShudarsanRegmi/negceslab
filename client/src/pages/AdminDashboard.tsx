import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Link,
  Skeleton,
  Badge,
  CircularProgress,
} from "@mui/material";
import { DateCalendar, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Computer as ComputerIcon,
  BookOnline as BookingIcon,
  Notifications as NotificationIcon,
  Edit as EditIcon,
  Block as RevokeIcon,
  Update as ExtendIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  ExitToApp as TempReleaseIcon,
} from "@mui/icons-material";
import { format, addDays, isWithinInterval, parseISO } from "date-fns";
import { computersAPI, bookingsAPI, feedbackAPI, temporaryReleaseAPI } from "../services/api";
import AdminNotificationPanel from "../components/AdminNotificationPanel";

interface Computer {
  _id: string;
  name: string;
  location: string;
  status: "available" | "maintenance" | "reserved";
  specifications: string;
  currentBookings?: Booking[];
  nextAvailable?: string;
  nextAvailableDate?: string;
}

// Update the Booking interface to include new fields
interface Booking {
  _id: string;
  userId: string;
  userInfo?: {
    name: string;
    email: string;
  };
  computerId: {
    _id: string;
    name: string;
    location: string;
    specifications: string;
  };
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  createdAt: string;
  // Optional fields
  requiresGPU: boolean;
  gpuMemoryRequired?: number;
  problemStatement?: string;
  datasetType?: string;
  datasetSize?: {
    value: number;
    unit: string;
  };
  datasetLink?: string;
  bottleneckExplanation?: string;
  mentor?: string; // Added mentor field
}

// Add feedback interface
interface Feedback {
  _id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'in_progress';
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminDashboard: React.FC = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Computer management states
  const [computerDialogOpen, setComputerDialogOpen] = useState(false);
  const [newComputer, setNewComputer] = useState({
    name: "",
    os: "",
    processor: "",
    ram: "",
    rom: "",
    status: "available" as const,
  });

  // Booking management states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<"approved" | "rejected">(
    "approved"
  );
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(
    null
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Current Bookings management states
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [selectedCurrentBooking, setSelectedCurrentBooking] = useState<Booking | null>(null);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extensionData, setExtensionData] = useState({
    endDate: "",
  });

  // Add at the top of AdminDashboard component state
  const [currentBookingsTab, setCurrentBookingsTab] = useState<'active' | 'upcoming'>('active');

  // Filter current bookings: only approved and not expired
  const filteredCurrentBookings = currentBookings.filter(
    (booking) =>
      booking.status === "approved" &&
      new Date(booking.endDate) >= new Date(new Date().toDateString())
  );

  // Add new state variables at the top of the component
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: null,
    endDate: null,
  });

  // Add to component state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [bookingTab, setBookingTab] = useState<'all' | 'pending'>('all');

  // Add loading states
  const [actionLoading, setActionLoading] = useState({
    approve: false,
    reject: false,
    revoke: false,
    extend: false,
    tempRelease: false,
  });

  // Temporary release state
  const [tempReleaseDialogOpen, setTempReleaseDialogOpen] = useState(false);
  const [selectedReleaseDates, setSelectedReleaseDates] = useState<Date[]>([]);
  const [tempReleaseReason, setTempReleaseReason] = useState("");
  const [tempReleaseAdminNote, setTempReleaseAdminNote] = useState("");
  const [calendarValue, setCalendarValue] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [computersRes, bookingsRes, currentBookingsRes, feedbackRes] = await Promise.all([
        computersAPI.getComputersWithBookings(),
        bookingsAPI.getAllBookings(),
        bookingsAPI.getCurrentBookings(),
        feedbackAPI.getAllFeedback(),
      ]);
      setComputers(computersRes.data);
      setBookings(bookingsRes.data);
      setCurrentBookings(currentBookingsRes.data);
      setFeedbacks(feedbackRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComputer = async () => {
    try {
      // Combine specifications into a single string
      const specifications = `OS: ${newComputer.os}\nProcessor: ${newComputer.processor}\nRAM: ${newComputer.ram}\nROM: ${newComputer.rom}`;

      await computersAPI.createComputer({
        name: newComputer.name,
        location: "Lab", // Default location
        specifications: specifications,
        status: newComputer.status,
      });
      setComputerDialogOpen(false);
      setNewComputer({
        name: "",
        os: "",
        processor: "",
        ram: "",
        rom: "",
        status: "available",
      });
      fetchData();
    } catch (error) {
      console.error("Error adding computer:", error);
      setError("Failed to add computer");
    }
  };

  const handleDeleteComputer = async (computerId: string) => {
    try {
      await computersAPI.deleteComputer(computerId);
      fetchData();
    } catch (error) {
      console.error("Error deleting computer:", error);
      setError("Failed to delete computer");
    }
  };

  const handleUpdateBookingStatus = async () => {
    if (!selectedBooking) return;
    setActionLoading((prev) => ({ ...prev, [newStatus]: true }));
    try {
      // Only pass rejection reason if status is rejected
      const reason = newStatus === 'rejected' ? cancelReason : undefined;
      await bookingsAPI.updateBookingStatus(selectedBooking._id, newStatus, reason);
      
      setStatusDialogOpen(false);
      setSelectedBooking(null);
      setCancelReason(''); // Clear the reason after use
      fetchData();
      setStatusUpdateSuccess(`Booking ${newStatus} successfully!`);
      setTimeout(() => setStatusUpdateSuccess(null), 5000);
    } catch (error) {
      console.error("Error updating booking status:", error);
      setError("Failed to update booking status");
    } finally {
      setActionLoading((prev) => ({ ...prev, [newStatus]: false }));
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBookingDetails(booking);
    setDetailsDialogOpen(true);
  };

  // Function to handle revoking a booking
  const handleRevokeBooking = async (bookingId: string) => {
    setActionLoading((prev) => ({ ...prev, revoke: true }));
    try {
      await bookingsAPI.updateBookingStatus(bookingId, "cancelled", "Revoked by admin");
      fetchData();
      setStatusUpdateSuccess("Booking revoked successfully!");
      setTimeout(() => setStatusUpdateSuccess(null), 5000);
    } catch (error) {
      console.error("Error revoking booking:", error);
      setError("Failed to revoke booking");
    } finally {
      setActionLoading((prev) => ({ ...prev, revoke: false }));
    }
  };

  // Function to handle extending a booking
  const handleExtendBooking = async () => {
    if (!selectedCurrentBooking) return;
    setActionLoading((prev) => ({ ...prev, extend: true }));
    try {
      await bookingsAPI.updateBookingTime(selectedCurrentBooking._id, extensionData);
      setExtendDialogOpen(false);
      setSelectedCurrentBooking(null);
      setExtensionData({ endDate: "" });
      fetchData();
      setStatusUpdateSuccess("Booking extended successfully!");
      setTimeout(() => setStatusUpdateSuccess(null), 5000);
    } catch (error) {
      console.error("Error extending booking:", error);
      setError("Failed to extend booking");
    } finally {
      setActionLoading((prev) => ({ ...prev, extend: false }));
    }
  };

  // Temporary release handler functions
  const handleCreateTemporaryRelease = async () => {
    if (!selectedBookingDetails || selectedReleaseDates.length === 0 || !tempReleaseReason.trim()) {
      setError("Please select at least one date and provide a reason");
      return;
    }

    setActionLoading((prev) => ({ ...prev, tempRelease: true }));
    try {
      await temporaryReleaseAPI.adminCreateTemporaryRelease({
        bookingId: selectedBookingDetails._id,
        releaseDates: selectedReleaseDates.map(date => format(date, 'yyyy-MM-dd')),
        reason: tempReleaseReason.trim(),
        adminNote: tempReleaseAdminNote.trim() || undefined,
      });
      
      // Refresh data and close dialogs
      fetchData();
      setTempReleaseDialogOpen(false);
      setDetailsDialogOpen(false);
      resetTempReleaseForm();
      setStatusUpdateSuccess("Temporary release created successfully!");
      setTimeout(() => setStatusUpdateSuccess(null), 5000);
    } catch (error: any) {
      console.error("Error creating temporary release:", error);
      setError(error.response?.data?.message || "Failed to create temporary release");
    } finally {
      setActionLoading((prev) => ({ ...prev, tempRelease: false }));
    }
  };

  const resetTempReleaseForm = () => {
    setSelectedReleaseDates([]);
    setTempReleaseReason("");
    setTempReleaseAdminNote("");
    setCalendarValue(null);
  };

  const openTempReleaseDialog = () => {
    setTempReleaseDialogOpen(true);
  };

  const closeTempReleaseDialog = () => {
    setTempReleaseDialogOpen(false);
    resetTempReleaseForm();
  };

  // Calendar helper functions for temporary release
  const handleDateSelect = (date: Date | null) => {
    if (!date || !selectedBookingDetails) return;
    
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

  const totalComputers = computers.length;
  const availableComputers = computers.filter(
    (c) => c.status === "available"
  ).length;
  const maintenanceComputers = computers.filter(
    (c) => c.status === "maintenance"
  ).length;
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  // Add filter function
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false;
    }

    // Date range filter
    if (dateRange.startDate && new Date(booking.startDate) < new Date(dateRange.startDate)) {
      return false;
    }
    if (dateRange.endDate && new Date(booking.endDate) > new Date(dateRange.endDate)) {
      return false;
    }

    // Search query
    const searchLower = searchQuery.toLowerCase();
    return (
      booking.computerId?.name?.toLowerCase().includes(searchLower) ||
      booking.userInfo?.name?.toLowerCase().includes(searchLower) ||
      booking.userInfo?.email?.toLowerCase().includes(searchLower) ||
      booking.reason.toLowerCase().includes(searchLower)
    );
  });

  const pendingBookingsList = bookings.filter((b) => b.status === "pending");
  const nonPendingBookings = bookings.filter((b) => b.status !== "pending");

  // Helper functions to get user name and email from booking
  const getBookingUserName = (booking: any) =>
    booking.userInfo?.name || booking.user?.name || "Unknown User";
  const getBookingUserEmail = (booking: any) =>
    booking.userInfo?.email || booking.user?.email || booking.userId;

  // Helper to format booking date range
  const formatBookingDateRange = (start: string, end: string) => {
    if (!start) return '';
    // Always show both dates, even if they are the same
    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
  };

  // Helper functions for filtering
  const now = new Date();
  const isActiveBooking = (booking: Booking) => {
    const start = new Date(booking.startDate + 'T' + booking.startTime);
    const end = new Date(booking.endDate + 'T' + booking.endTime);
    return start <= now && end >= now;
  };
  const isUpcomingBooking = (booking: Booking) => {
    const start = new Date(booking.startDate + 'T' + booking.startTime);
    return start > now;
  };
  const activeBookings = filteredCurrentBookings.filter(isActiveBooking);
  const upcomingBookings = filteredCurrentBookings.filter(isUpcomingBooking);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {statusUpdateSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {statusUpdateSuccess}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
        variant={isMobile ? "scrollable" : "fullWidth"}
        scrollButtons={isMobile ? "auto" : false}
      >
        <Tab label="Overview" />
        <Tab label="Computers" />
        <Tab label="Current Bookings" />
        <Tab
          label={
            <Badge color="error" badgeContent={pendingBookingsList.length} max={99}>
              New Booking Requests
            </Badge>
          }
        />
        <Tab label="All Bookings" />
        <Tab label="Feedback" />
        {/* <Tab label="Notifications" /> */}
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Header with reload button */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6">Dashboard Overview</Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>
          </Box>
          
          {/* Summary Cards */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
            {/* Pending Approvals */}
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 33.33%" } }}>
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
                        Pending Approvals
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: "bold",
                          mb: 1,
                          fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" },
                        }}
                      >
                        {pendingBookings}
                      </Typography>
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
                      <NotificationIcon
                        sx={{ color: "#f57c00", fontSize: 22 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      )}

      {/* Computers Tab */}
      {activeTab === 1 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Typography variant="h6">Computer Management</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                disabled={loading}
                size="small"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setComputerDialogOpen(true)}
                fullWidth={isMobile}
              >
                Add Computer
              </Button>
            </Box>
          </Box>

          {isMobile ? (
            <List>
              {computers.map((computer) => {
                                    const bookingCount = bookings.filter(
                      b => b.computerId._id === computer._id && b.status === 'approved'
                    ).length;
                return (
                  <React.Fragment key={computer._id}>
                    <ListItem>
                      <ListItemText
                        primary={computer.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {computer.location}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {computer.specifications}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Bookings: {bookingCount}
                            </Typography>
                            {computer.status === "booked" &&
                              computer.nextAvailable && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  display="block"
                                  sx={{ mt: 1 }}
                                >
                                  Booked until {computer.nextAvailable} on{" "}
                                  {computer.nextAvailableDate}
                                </Typography>
                              )}
                            {computer.status === "maintenance" && (
                              <Typography
                                variant="caption"
                                color="warning.main"
                                display="block"
                                sx={{ mt: 1 }}
                              >
                                Under maintenance
                              </Typography>
                            )}
                            {computer.status === "available" && (
                              <Typography
                                variant="caption"
                                color="success.main"
                                display="block"
                                sx={{ mt: 1 }}
                              >
                                Available now
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDeleteComputer(computer._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Booking Info</TableCell>
                    <TableCell>Specifications</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {computers.map((computer) => {
                    const bookingCount = bookings.filter(
                      b => b.computerId._id === computer._id && b.status === 'approved'
                    ).length;
                    return (
                      <TableRow key={computer._id}>
                        <TableCell>{computer.name}</TableCell>
                        <TableCell>{computer.location}</TableCell>
                        <TableCell>
                          Bookings: {bookingCount}
                        </TableCell>
                        <TableCell>{computer.specifications}</TableCell>
                        <TableCell>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteComputer(computer._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Current Bookings Tab */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6">Current Bookings Management</Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
              size="small"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </Box>
          {/* Tabbed filter for Active/Upcoming */}
          <Tabs
            value={currentBookingsTab}
            onChange={(_, v) => setCurrentBookingsTab(v)}
            sx={{ mb: 2 }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Active Bookings" value="active" />
            <Tab label="Upcoming Bookings" value="upcoming" />
          </Tabs>
          {/* List/Table rendering based on filter */}
          {isMobile ? (
            <List>
              {(currentBookingsTab === 'active' ? activeBookings : upcomingBookings).map((booking) => (
                <React.Fragment key={booking._id}>
                  <ListItem
                    onClick={() => handleViewDetails(booking)}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <ListItemText
                      primary={<Typography variant="subtitle1">{booking.computerId?.name || "Unknown Computer"}</Typography>}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">User: {getBookingUserName(booking)}</Typography>
                          <Typography variant="body2" color="text.secondary">Email: {getBookingUserEmail(booking)}</Typography>
                          <Typography variant="body2" color="text.secondary">Date: {formatBookingDateRange(booking.startDate, booking.endDate)}</Typography>
                          <Typography variant="body2" color="text.secondary">Time: {booking.startTime} - {booking.endTime}</Typography>
                          <Typography variant="body2" color="text.secondary">Reason: {booking.reason}</Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCurrentBooking(booking);
                          setExtendDialogOpen(true);
                        }}
                        title="Extend Booking"
                        disabled={actionLoading.extend}
                      >
                        {actionLoading.extend ? <CircularProgress size={20} color="inherit" /> : <ExtendIcon />}
                      </IconButton>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevokeBooking(booking._id);
                        }}
                        title="Revoke Booking"
                        disabled={actionLoading.revoke}
                      >
                        {actionLoading.revoke ? <CircularProgress size={20} color="inherit" /> : <RevokeIcon />}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Computer</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(currentBookingsTab === 'active' ? activeBookings : upcomingBookings).map((booking) => (
                    <TableRow
                      key={booking._id}
                      onClick={() => handleViewDetails(booking)}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>{booking.computerId?.name}</TableCell>
                      <TableCell>
                        <Typography>{getBookingUserName(booking)}</Typography>
                        <Typography variant="caption" color="text.secondary">{getBookingUserEmail(booking)}</Typography>
                      </TableCell>
                      <TableCell>{formatBookingDateRange(booking.startDate, booking.endDate)}</TableCell>
                      <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                      <TableCell>{booking.reason}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCurrentBooking(booking);
                            setExtendDialogOpen(true);
                          }}
                          title="Extend Booking"
                          disabled={actionLoading.extend}
                        >
                          {actionLoading.extend ? <CircularProgress size={20} color="inherit" /> : <ExtendIcon />}
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevokeBooking(booking._id);
                          }}
                          title="Revoke Booking"
                          disabled={actionLoading.revoke}
                        >
                          {actionLoading.revoke ? <CircularProgress size={20} color="inherit" /> : <RevokeIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {(currentBookingsTab === 'active' ? activeBookings : upcomingBookings).length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" color="text.secondary">
                No {currentBookingsTab === 'active' ? 'active' : 'upcoming'} bookings found
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* New Booking Requests Tab */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            New Booking Requests
          </Typography>
          {pendingBookingsList.length === 0 ? (
            <Typography color="text.secondary">No new booking requests.</Typography>
          ) : (
            isMobile ? (
              <List>
                {pendingBookingsList.map((booking) => (
                  <React.Fragment key={booking._id}>
                    <ListItem
                      onClick={() => handleViewDetails(booking)}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <ListItemText
                        primary={<Typography variant="subtitle1">{booking.computerId?.name || "Unknown Computer"}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">User: {getBookingUserName(booking)}</Typography>
                            <Typography variant="body2" color="text.secondary">Email: {getBookingUserEmail(booking)}</Typography>
                            <Typography variant="body2" color="text.secondary">Date: {formatBookingDateRange(booking.startDate, booking.endDate)}</Typography>
                            <Typography variant="body2" color="text.secondary">Time: {booking.startTime} - {booking.endTime}</Typography>
                            <Typography variant="body2" color="text.secondary">Reason: {booking.reason}</Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          color="success"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNewStatus("approved");
                            setStatusDialogOpen(true);
                          }}
                          title="Approve"
                          disabled={actionLoading.approve}
                        >
                          {actionLoading.approve ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setNewStatus("rejected");
                            setStatusDialogOpen(true);
                          }}
                          title="Reject"
                          disabled={actionLoading.reject}
                        >
                          {actionLoading.reject ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Computer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingBookingsList.map((booking) => (
                      <TableRow
                        key={booking._id}
                        onClick={() => handleViewDetails(booking)}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>{getBookingUserName(booking)}</TableCell>
                        <TableCell>{getBookingUserEmail(booking)}</TableCell>
                        <TableCell>{booking.computerId?.name || "Unknown Computer"}</TableCell>
                        <TableCell>{formatBookingDateRange(booking.startDate, booking.endDate)}</TableCell>
                        <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                        <TableCell>{booking.reason}</TableCell>
                        <TableCell>
                          <IconButton
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                              setNewStatus("approved");
                              setStatusDialogOpen(true);
                            }}
                            title="Approve"
                            disabled={actionLoading.approve}
                          >
                            {actionLoading.approve ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                              setNewStatus("rejected");
                              setStatusDialogOpen(true);
                            }}
                            title="Reject"
                            disabled={actionLoading.reject}
                          >
                            {actionLoading.reject ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </Box>
      )}

      {/* All Bookings Tab (remove pending bookings) */}
      {activeTab === 4 && (
        <Box>
          {/* Header and Search Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 2 
          }}>
            {/* Left side - Title and Results Count */}
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                All Bookings Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredBookings.filter(b => b.status !== 'pending').length} of {nonPendingBookings.length} bookings
              </Typography>
            </Box>

            {/* Right side - Refresh button */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
              size="small"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>

            {/* Right side - Search and Filters */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: 1,
              flex: { xs: '1', sm: '0.7' },
              '& > *': { 
                minWidth: { xs: '100%', sm: '150px' }
              }
            }}>
              <TextField
                size="small"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                      🔍
                    </Box>
                  ),
                }}
              />
              <FormControl size="small">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="date"
                value={dateRange.startDate || ""}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.875rem' }}>
                      From:
                    </Box>
                  ),
                }}
                sx={{ maxWidth: { sm: '200px' } }}
              />
              <TextField
                size="small"
                type="date"
                value={dateRange.endDate || ""}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.875rem' }}>
                      To:
                    </Box>
                  ),
                }}
                sx={{ maxWidth: { sm: '200px' } }}
              />
            </Box>
          </Box>

          {/* Table/List Content */}
          {isMobile ? (
            <List>
              {filteredBookings.filter(b => b.status !== 'pending').map((booking) => (
                <React.Fragment key={booking._id}>
                  <ListItem>
                    <ListItemText
                      primary={booking.computerId?.name || "Unknown Computer"}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">User: {getBookingUserName(booking)}</Typography>
                          <Typography variant="body2" color="text.secondary">Email: {getBookingUserEmail(booking)}</Typography>
                          <Typography variant="body2" color="text.secondary">Date: {formatBookingDateRange(booking.startDate, booking.endDate)}</Typography>
                          <Typography variant="body2" color="text.secondary">Time: {booking.startTime} - {booking.endTime}</Typography>
                          <Typography variant="body2" color="text.secondary">Reason: {booking.reason}</Typography>
                          <Chip label={booking.status} color={getStatusColor(booking.status) as any} size="small" sx={{ mt: 1 }} />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {/* Only show actions for non-pending bookings if needed */}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Computer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBookings.filter(b => b.status !== 'pending').map((booking) => (
                    <TableRow
                      key={booking._id}
                      onClick={() => handleViewDetails(booking)}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    >
                      <TableCell>{getBookingUserName(booking)}</TableCell>
                      <TableCell>{getBookingUserEmail(booking)}</TableCell>
                      <TableCell>{booking.computerId?.name || "Unknown Computer"}</TableCell>
                      <TableCell>{formatBookingDateRange(booking.startDate, booking.endDate)}</TableCell>
                      <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                      <TableCell>
                        <Chip label={booking.status} color={getStatusColor(booking.status) as any} size="small" />
                      </TableCell>
                      <TableCell>{/* Only show actions for non-pending bookings if needed */}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {filteredBookings.filter(b => b.status !== 'pending').length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" color="text.secondary">
                No bookings found matching your filters
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Add Feedback Tab */}
      {activeTab === 5 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h6">Feedback Management</Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
              size="small"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow
                    key={feedback._id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                    onClick={() => {
                      setSelectedFeedback(feedback);
                      setFeedbackDialogOpen(true);
                    }}
                  >
                    <TableCell>{new Date(feedback.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Typography>{feedback.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {feedback.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{feedback.subject}</TableCell>
                    <TableCell>
                      <Chip
                        label={feedback.status}
                        color={
                          feedback.status === 'resolved'
                            ? 'success'
                            : feedback.status === 'in_progress'
                            ? 'warning'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {feedbacks.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" color="text.secondary">
                No feedback submissions found
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Notifications Tab */}
      {activeTab === 6 && <AdminNotificationPanel />}

      {/* Add Computer Dialog */}
      <Dialog
        open={computerDialogOpen}
        onClose={() => setComputerDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Computer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={newComputer.name}
              placeholder="e.g. System1"
              onChange={(e) =>
                setNewComputer({ ...newComputer, name: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
            />
            <TextField
              label="OS"
              value={newComputer.os}
              onChange={(e) =>
                setNewComputer({ ...newComputer, os: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="e.g., Windows 11, Ubuntu 22.04, macOS"
            />
            <TextField
              label="Processor"
              value={newComputer.processor}
              onChange={(e) =>
                setNewComputer({ ...newComputer, processor: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="e.g., Intel i7-12700K, AMD Ryzen 7 5800X"
            />
            <TextField
              label="RAM"
              value={newComputer.ram}
              onChange={(e) =>
                setNewComputer({ ...newComputer, ram: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="e.g., 16GB DDR4, 32GB DDR5"
            />
            <TextField
              label="ROM"
              value={newComputer.rom}
              onChange={(e) =>
                setNewComputer({ ...newComputer, rom: e.target.value })
              }
              fullWidth
              size={isMobile ? "small" : "medium"}
              placeholder="e.g., 512GB SSD, 1TB NVMe"
            />
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newComputer.status}
                onChange={(e) =>
                  setNewComputer({
                    ...newComputer,
                    status: e.target.value as any,
                  })
                }
                label="Status"
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="reserved">Reserved</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComputerDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComputer} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Booking Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Booking Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Booking Details
            </Typography>
            {selectedBooking && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Computer:</strong> {selectedBooking.computerId.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>User:</strong>{" "}
                  {selectedBooking.userInfo?.name || getBookingUserName(selectedBooking) || "Unknown User"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong>{" "}
                  {selectedBooking.userInfo?.email || getBookingUserEmail(selectedBooking) || selectedBooking.userId}
                </Typography>
                {/* Booking Date */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Booking Date:</strong> {formatBookingDateRange(selectedBooking.startDate, selectedBooking.endDate)}
                </Typography>
                {/* Booking Time */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Booking Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}
                </Typography>
                {/* Booking Duration */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Booking Duration:</strong> {
                    `${new Date(selectedBooking.startDate).toLocaleDateString()} - ${new Date(selectedBooking.endDate).toLocaleDateString()}`
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Reason:</strong> {selectedBooking.reason}
                </Typography>
              </Box>
            )}
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Automatic Notification:</strong> When you {newStatus} this
              booking, an automatic notification will be sent to the user
              informing them of the status change.
            </Typography>
          </Alert>

          {newStatus === "rejected" && (
            <TextField
              label="Reason for Cancellation"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              fullWidth
              required
              multiline
              minRows={2}
              sx={{ mb: 2 }}
              error={!cancelReason}
              helperText={!cancelReason ? "Please provide a reason for cancellation." : ""}
            />
          )}

          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
              color: newStatus === "approved" ? "success.main" : "error.main",
            }}
          >
            Are you sure you want to {newStatus} this booking?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateBookingStatus}
            variant="contained"
            color={newStatus === "approved" ? "success" : "error"}
            disabled={actionLoading[newStatus] || (newStatus === "rejected" && !cancelReason)}
          >
            {actionLoading[newStatus] ? <CircularProgress size={20} color="inherit" /> : (newStatus === "approved" ? "Approve" : "Reject") + " Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Booking Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Booking Request Details
            <Chip
              label={selectedBookingDetails?.status}
              color={getStatusColor(selectedBookingDetails?.status || '') as any}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedBookingDetails && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* User Information */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  User Information
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1">
                      {getBookingUserName(selectedBookingDetails)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {getBookingUserEmail(selectedBookingDetails)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Computer Information */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Computer Details
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Computer Name
                    </Typography>
                    <Typography variant="body1">
                      {selectedBookingDetails.computerId.name}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {selectedBookingDetails.computerId.location}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Specifications
                    </Typography>
                    <Typography variant="body1">
                      {selectedBookingDetails.computerId.specifications}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Booking Schedule */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Booking Schedule
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {formatBookingDateRange(selectedBookingDetails.startDate, selectedBookingDetails.endDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Time
                    </Typography>
                    <Typography variant="body1">
                      {selectedBookingDetails.startTime} - {selectedBookingDetails.endTime}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Request Details */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Request Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reason for Request
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedBookingDetails.reason}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Request Status
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={selectedBookingDetails.status}
                        color={getStatusColor(selectedBookingDetails.status) as any}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Request Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedBookingDetails.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    <strong>Mentor:</strong> {selectedBookingDetails?.mentor === undefined ? 'N/A' : (selectedBookingDetails.mentor?.trim() === '' || selectedBookingDetails.mentor?.toLowerCase() === 'self' ? 'Self' : selectedBookingDetails.mentor)}
                  </Typography>
                </Box>
              </Paper>

              {/* Project Details Section */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Project Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {selectedBookingDetails.problemStatement && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Problem Statement
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedBookingDetails.problemStatement}
                      </Typography>
                    </Box>
                  )}

                  {/* Dataset Information */}
                  {(selectedBookingDetails.datasetType || selectedBookingDetails.datasetLink || selectedBookingDetails.datasetSize) && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Dataset Information
                      </Typography>
                      {selectedBookingDetails.datasetType && (
                        <Typography variant="body1">
                          Type: {selectedBookingDetails.datasetType}
                        </Typography>
                      )}
                      {selectedBookingDetails.datasetSize && (
                        <Typography variant="body1">
                          Size: {selectedBookingDetails.datasetSize.value} {selectedBookingDetails.datasetSize.unit}
                        </Typography>
                      )}
                      {selectedBookingDetails.datasetLink && (
                        <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                          Link: <Link href={selectedBookingDetails.datasetLink} target="_blank" rel="noopener noreferrer">
                            {selectedBookingDetails.datasetLink}
                          </Link>
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* GPU Requirements */}
                  {selectedBookingDetails.requiresGPU && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        GPU Requirements
                      </Typography>
                      <Typography variant="body1">
                        Memory Required: {selectedBookingDetails.gpuMemoryRequired}GB
                      </Typography>
                      {selectedBookingDetails.bottleneckExplanation && (
                        <>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                            Bottleneck Explanation
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {selectedBookingDetails.bottleneckExplanation}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Action Buttons for Pending Requests */}
              {selectedBookingDetails.status === "pending" && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => {
                      setSelectedBooking(selectedBookingDetails);
                      setNewStatus("approved");
                      setStatusDialogOpen(true);
                      setDetailsDialogOpen(false);
                    }}
                    fullWidth
                    disabled={actionLoading.approve}
                  >
                    {actionLoading.approve ? <CircularProgress size={20} color="inherit" /> : "Approve Request"}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setSelectedBooking(selectedBookingDetails);
                      setNewStatus("rejected");
                      setStatusDialogOpen(true);
                      setDetailsDialogOpen(false);
                    }}
                    fullWidth
                    disabled={actionLoading.reject}
                  >
                    {actionLoading.reject ? <CircularProgress size={20} color="inherit" /> : "Reject Request"}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedBookingDetails?.status === 'approved' && (
            <Button
              color="info"
              variant="outlined"
              onClick={openTempReleaseDialog}
              startIcon={<TempReleaseIcon />}
              disabled={actionLoading.tempRelease}
            >
              Create Temporary Release
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Extend Booking Dialog */}
      <Dialog
        open={extendDialogOpen}
        onClose={() => setExtendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Extend Booking</DialogTitle>
        <DialogContent>
          {selectedCurrentBooking && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Booking Details:
              </Typography>
              <Typography variant="body2">
                Computer: {selectedCurrentBooking.computerId?.name}
              </Typography>
              <Typography variant="body2">
                Current Start Time: {selectedCurrentBooking.startTime}
              </Typography>
              <Typography variant="body2">
                Current End Time: {selectedCurrentBooking.endTime}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Current End Date: {new Date(selectedCurrentBooking.endDate).toLocaleDateString()}
              </Typography>

              <TextField
                label="New End Date"
                type="date"
                value={extensionData.endDate}
                onChange={(e) => setExtensionData({ ...extensionData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: selectedCurrentBooking.endDate // Disable dates before current end date
                }}
                fullWidth
                helperText="Select the new end date for the booking (must be after current end date, time will remain the same)"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtendDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleExtendBooking} 
            variant="contained" 
            color="primary"
            disabled={actionLoading.extend || !extensionData.endDate}
          >
            {actionLoading.extend ? <CircularProgress size={20} color="inherit" /> : "Extend Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Feedback Dialog */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Feedback Details
            <Chip
              label={selectedFeedback?.status}
              color={
                selectedFeedback?.status === 'resolved'
                  ? 'success'
                  : selectedFeedback?.status === 'in_progress'
                  ? 'warning'
                  : 'default'
              }
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedFeedback && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  User Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography><strong>Name:</strong> {selectedFeedback.fullName}</Typography>
                  <Typography><strong>Email:</strong> {selectedFeedback.email}</Typography>
                  <Typography><strong>Subject:</strong> {selectedFeedback.subject}</Typography>
                  <Typography><strong>Submitted:</strong> {new Date(selectedFeedback.createdAt).toLocaleString()}</Typography>
                </Box>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Feedback Message
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedFeedback.message}</Typography>
              </Paper>

              {selectedFeedback.adminResponse && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Admin Response
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedFeedback.adminResponse}</Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Admin Temporary Release Dialog */}
      <Dialog 
        open={tempReleaseDialogOpen} 
        onClose={closeTempReleaseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon />
            Create Temporary Release (Admin)
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the days within the booking period that you want to temporarily release to other users.
            Each selected day will be available for full-day bookings by others. 
            <strong>Note: Sundays are not available for release.</strong>
          </Typography>
          
          {selectedBookingDetails && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Booking period: {format(new Date(selectedBookingDetails.startDate), "MMM d, yyyy")} to {format(new Date(selectedBookingDetails.endDate), "MMM d, yyyy")} ({selectedBookingDetails.startTime} - {selectedBookingDetails.endTime})
              <br />
              Computer: {selectedBookingDetails.computerId.name} | User: {getBookingUserName(selectedBookingDetails)}
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
              required
              placeholder="Why is this temporary release being created? (e.g., 'User requested', 'System maintenance', 'Emergency release')"
            />

            <TextField
              fullWidth
              label="Admin Note (Optional)"
              value={tempReleaseAdminNote}
              onChange={(e) => setTempReleaseAdminNote(e.target.value)}
              multiline
              rows={2}
              size="small"
              placeholder="Additional notes for this admin action (e.g., 'Per user request via email', 'Emergency situation')"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTempReleaseDialog} disabled={actionLoading.tempRelease}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTemporaryRelease}
            variant="contained"
            disabled={actionLoading.tempRelease || selectedReleaseDates.length === 0 || !tempReleaseReason.trim()}
            startIcon={actionLoading.tempRelease ? <CircularProgress size={20} color="inherit" /> : <CalendarIcon />}
          >
            Create Release ({selectedReleaseDates.length} Day{selectedReleaseDates.length !== 1 ? 's' : ''})
          </Button>
        </DialogActions>
      </Dialog>

      {statusUpdateSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {statusUpdateSuccess}
        </Alert>
      )}
    </Box>
  );
};

export default AdminDashboard;
