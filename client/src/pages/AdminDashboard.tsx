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
} from "@mui/material";
import Grid from '@mui/material/Grid';
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
} from "@mui/icons-material";
import { computersAPI, bookingsAPI } from "../services/api";
import AdminNotificationPanel from "../components/AdminNotificationPanel";

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
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  // New fields
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
  endDate?: string; // Added for multi-day bookings
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
    endTime: "",
    endDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [computersRes, bookingsRes, currentBookingsRes] = await Promise.all([
        computersAPI.getComputersWithBookings(),
        bookingsAPI.getAllBookings(),
        bookingsAPI.getCurrentBookings(),
      ]);
      setComputers(computersRes.data);
      setBookings(bookingsRes.data);
      setCurrentBookings(currentBookingsRes.data);
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
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBookingDetails(booking);
    setDetailsDialogOpen(true);
  };

  // Function to handle revoking a booking
  const handleRevokeBooking = async (bookingId: string) => {
    try {
      await bookingsAPI.updateBookingStatus(bookingId, "cancelled", "Revoked by admin");
      fetchData();
      setStatusUpdateSuccess("Booking revoked successfully!");
      setTimeout(() => setStatusUpdateSuccess(null), 5000);
    } catch (error) {
      console.error("Error revoking booking:", error);
      setError("Failed to revoke booking");
    }
  };

  // Function to handle extending a booking
  const handleExtendBooking = async () => {
    if (!selectedCurrentBooking) return;

    try {
      await bookingsAPI.updateBookingTime(selectedCurrentBooking._id, extensionData);
      setExtendDialogOpen(false);
      setSelectedCurrentBooking(null);
      setExtensionData({ endTime: "", endDate: "" });
      fetchData();
      setStatusUpdateSuccess("Booking extended successfully!");
      setTimeout(() => setStatusUpdateSuccess(null), 5000);
    } catch (error) {
      console.error("Error extending booking:", error);
      setError("Failed to extend booking");
    }
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

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

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
        <Tab label="All Bookings" />
        <Tab label="Notifications" />
      </Tabs>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box>
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setComputerDialogOpen(true)}
              fullWidth={isMobile}
            >
              Add Computer
            </Button>
          </Box>

          {isMobile ? (
            <List>
              {computers.map((computer) => (
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
                          <Chip
                            label={computer.status}
                            color={
                              getComputerStatusColor(computer.status) as any
                            }
                            size="small"
                            sx={{ mt: 1 }}
                          />
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
              ))}
            </List>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Booking Info</TableCell>
                    <TableCell>Specifications</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {computers.map((computer) => (
                    <TableRow key={computer._id}>
                      <TableCell>{computer.name}</TableCell>
                      <TableCell>{computer.location}</TableCell>
                      <TableCell>
                        <Chip
                          label={computer.status}
                          color={getComputerStatusColor(computer.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {computer.status === "booked" &&
                          computer.nextAvailable && (
                            <Box>
                              <Typography variant="body2" color="error">
                                Booked until {computer.nextAvailable}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Date: {computer.nextAvailableDate}
                              </Typography>
                            </Box>
                          )}
                        {computer.status === "maintenance" && (
                          <Typography variant="body2" color="warning.main">
                            Under maintenance
                          </Typography>
                        )}
                        {computer.status === "available" && (
                          <Typography variant="body2" color="success.main">
                            Available now
                          </Typography>
                        )}
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Current Bookings Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Current Bookings Management
          </Typography>

          {isMobile ? (
            <List>
              {currentBookings.map((booking) => (
                <React.Fragment key={booking._id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {booking.computerId?.name || "Unknown Computer"}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            User: {booking.userInfo?.name || "Unknown User"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Email: {booking.userInfo?.email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Date: {new Date(booking.date).toLocaleDateString()}
                            {booking.endDate && ` - ${new Date(booking.endDate).toLocaleDateString()}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Time: {booking.startTime} - {booking.endTime}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reason: {booking.reason}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={() => {
                          setSelectedCurrentBooking(booking);
                          setExtendDialogOpen(true);
                        }}
                        title="Extend Booking"
                      >
                        <ExtendIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRevokeBooking(booking._id)}
                        title="Revoke Booking"
                      >
                        <RevokeIcon />
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
                  {currentBookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking.computerId?.name}</TableCell>
                      <TableCell>
                        <Typography>{booking.userInfo?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.userInfo?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(booking.date).toLocaleDateString()}
                        {booking.endDate && (
                          <><br />{new Date(booking.endDate).toLocaleDateString()}</>
                        )}
                      </TableCell>
                      <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                      <TableCell>{booking.reason}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setSelectedCurrentBooking(booking);
                            setExtendDialogOpen(true);
                          }}
                          title="Extend Booking"
                        >
                          <ExtendIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleRevokeBooking(booking._id)}
                          title="Revoke Booking"
                        >
                          <RevokeIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* All Bookings Tab */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            All Bookings Management
          </Typography>

          {isMobile ? (
            <List>
              {bookings.map((booking) => (
                <React.Fragment key={booking._id}>
                  <ListItem>
                    <ListItemText
                      primary={booking.computerId?.name || "Unknown Computer"}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            User: {booking.userInfo?.name || "Unknown User"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Email: {booking.userInfo?.email || booking.userId}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Date: {new Date(booking.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Time: {booking.startTime} - {booking.endTime}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reason: {booking.reason}
                          </Typography>
                          <Chip
                            label={booking.status}
                            color={getStatusColor(booking.status) as any}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {booking.status === "pending" && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                            color="success"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setNewStatus("approved");
                              setStatusDialogOpen(true);
                            }}
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setNewStatus("rejected");
                              setStatusDialogOpen(true);
                            }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      )}
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
                  {bookings.map((booking) => (
                    <TableRow
                      key={booking._id}
                      onClick={() => handleViewDetails(booking)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>{booking.userInfo?.name || "Unknown User"}</TableCell>
                      <TableCell>{booking.userInfo?.email || booking.userId}</TableCell>
                      <TableCell>{booking.computerId?.name || "Unknown Computer"}</TableCell>
                      <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                      <TableCell>{`${booking.startTime} - ${booking.endTime}`}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {booking.status === "pending" && (
                          <Box>
                            <IconButton
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                setSelectedBooking(booking);
                                setNewStatus("approved");
                                setStatusDialogOpen(true);
                              }}
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                setSelectedBooking(booking);
                                setNewStatus("rejected");
                                setStatusDialogOpen(true);
                              }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Notifications Tab */}
      {activeTab === 4 && <AdminNotificationPanel />}

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
                <MenuItem value="booked">Booked</MenuItem>
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
                  {selectedBooking.userInfo?.name || "Unknown User"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong>{" "}
                  {selectedBooking.userInfo?.email || selectedBooking.userId}
                </Typography>
                {/* Booking Date */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Booking Date:</strong> {selectedBooking.endDate && selectedBooking.endDate !== selectedBooking.date
                    ? `${new Date(selectedBooking.date).toLocaleDateString()} - ${new Date(selectedBooking.endDate).toLocaleDateString()}`
                    : new Date(selectedBooking.date).toLocaleDateString()}
                </Typography>
                {/* Booking Time */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Booking Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}
                </Typography>
                {/* Booking Duration */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Booking Duration:</strong> {(() => {
                    const startDateStr = new Date(selectedBooking.date).toLocaleDateString();
                    const endDateStr = selectedBooking.endDate ? new Date(selectedBooking.endDate).toLocaleDateString() : startDateStr;
                    return `${startDateStr} - ${endDateStr}`;
                  })()}
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
            disabled={newStatus === "rejected" && !cancelReason}
          >
            {newStatus === "approved" ? "Approve" : "Reject"} Booking
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
                      {selectedBookingDetails.userInfo?.name || "Unknown User"}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)' } }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {selectedBookingDetails.userInfo?.email || selectedBookingDetails.userId}
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
                      {new Date(selectedBookingDetails.date).toLocaleDateString()}
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
                  >
                    Approve Request
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
                  >
                    Reject Request
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
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
                Current End Time: {selectedCurrentBooking.endTime}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Current End Date: {new Date(selectedCurrentBooking.endDate || selectedCurrentBooking.date).toLocaleDateString()}
              </Typography>

              <TextField
                label="New End Time"
                type="time"
                value={extensionData.endTime}
                onChange={(e) => setExtensionData({ ...extensionData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="New End Date"
                type="date"
                value={extensionData.endDate}
                onChange={(e) => setExtensionData({ ...extensionData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
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
            disabled={!extensionData.endTime && !extensionData.endDate}
          >
            Extend Booking
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
