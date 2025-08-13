import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Info as InfoIcon,
  BookOnline as BookingIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { temporaryReleaseAPI } from "../services/api";

interface TemporaryRelease {
  _id: string;
  bookingId: string;
  userId: string;
  releasedDates: string[];
  reason: string;
  status: "active" | "cancelled" | "partially_booked";
  createdAt: string;
  originalBooking?: {
    _id: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    reason: string;
    computerId: {
      _id: string;
      name: string;
      location: string;
    };
  };
  userInfo?: {
    uid: string;
    email: string;
    displayName?: string;
  };
}

const AdminTemporaryReleases: React.FC = () => {
  const [releases, setReleases] = useState<TemporaryRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<TemporaryRelease | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [originalBookingDialogOpen, setOriginalBookingDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetchTemporaryReleases();
  }, []);

  const fetchTemporaryReleases = async () => {
    try {
      setLoading(true);
      const response = await temporaryReleaseAPI.getAllTemporaryReleases();
      
      // The backend now returns an array directly
      const releasesList = Array.isArray(response.data) ? response.data : [];
      setReleases(releasesList);
    } catch (error: any) {
      console.error("Error fetching temporary releases:", error);
      setError("Failed to load temporary releases");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (release: TemporaryRelease) => {
    setSelectedRelease(release);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedRelease(null);
  };

  const handleViewOriginalBooking = (release: TemporaryRelease) => {
    setSelectedRelease(release);
    setOriginalBookingDialogOpen(true);
  };

  const handleCloseOriginalBooking = () => {
    setOriginalBookingDialogOpen(false);
    setSelectedRelease(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "cancelled":
        return "error";
      case "partially_booked":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      case "partially_booked":
        return "Partially Booked";
      default:
        return status;
    }
  };

  const filteredReleases = releases.filter((release) => {
    const matchesSearch = 
      (release.userInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (release.userInfo?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (release.originalBooking?.computerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (release.reason?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || release.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Temporary Releases Management
        </Typography>
        <Box sx={{ mt: 3 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 2 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Temporary Releases Management
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Temporary Releases Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and manage all temporary release requests from users.
      </Typography>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search by user, computer, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="partially_booked">Partially Booked</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Releases Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Temporary Releases ({filteredReleases.length})
          </Typography>
          
          {filteredReleases.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No temporary releases found
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>User Details</TableCell>
                    <TableCell>Computer</TableCell>
                    <TableCell>Released Dates</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReleases.map((release) => (
                    <TableRow key={release._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {release.userInfo?.displayName || release.userInfo?.email || "Unknown User"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {release.userInfo?.email || "No email provided"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {release.originalBooking?.computerId?.name || "Unknown Computer"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {release.originalBooking?.computerId?.location || "Unknown Location"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {release.releasedDates.length} day{release.releasedDates.length !== 1 ? 's' : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {release.releasedDates
                              .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                              .slice(0, 3) // Show only first 3 dates
                              .map((dateStr, index) => (
                                <Chip
                                  key={index}
                                  label={format(new Date(dateStr), "MMM d")}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: '20px' }}
                                />
                              ))
                            }
                            {release.releasedDates.length > 3 && (
                              <Chip
                                label={`+${release.releasedDates.length - 3} more`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: '20px' }}
                                color="primary"
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 150,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {release.reason}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Release Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(release)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Original Booking">
                            <IconButton
                              size="small"
                              onClick={() => handleViewOriginalBooking(release)}
                              color="primary"
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon />
            Temporary Release Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRelease && (
            <Box sx={{ py: 1 }}>
              {/* User Information */}
              <Typography variant="h6" gutterBottom color="primary">
                User Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedRelease.userInfo?.displayName || selectedRelease.userInfo?.email || "Not provided"}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {selectedRelease.userInfo?.email || "Not provided"}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Release Information */}
              <Typography variant="h6" gutterBottom color="primary">
                Release Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Reason for Release:</strong> {selectedRelease.reason}
                </Typography>
                {/* <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Status:</strong>{" "}
                  <Chip
                    label={getStatusLabel(selectedRelease.status)}
                    color={getStatusColor(selectedRelease.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography> */}
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Created:</strong> {new Date(selectedRelease.createdAt).toLocaleString()}
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Released Dates ({selectedRelease.releasedDates.length}):</strong>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedRelease.releasedDates
                  .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                  .map((dateStr, index) => (
                    <Chip
                      key={index}
                      label={format(new Date(dateStr), "MMM d, yyyy")}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))
                }
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Original Booking Dialog */}
      <Dialog
        open={originalBookingDialogOpen}
        onClose={handleCloseOriginalBooking}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookingIcon />
            Original Booking Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRelease?.originalBooking ? (
            <Box sx={{ py: 1 }}>
              {/* Computer Information */}
              <Typography variant="h6" gutterBottom color="primary">
                Computer Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedRelease.originalBooking.computerId.name}
                </Typography>
                <Typography variant="body1">
                  <strong>Location:</strong> {selectedRelease.originalBooking.computerId.location}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Booking Information */}
              <Typography variant="h6" gutterBottom color="primary">
                Booking Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Start Date:</strong> {format(new Date(selectedRelease.originalBooking.startDate), "MMMM d, yyyy")}
                </Typography>
                <Typography variant="body1">
                  <strong>End Date:</strong> {format(new Date(selectedRelease.originalBooking.endDate), "MMMM d, yyyy")}
                </Typography>
                <Typography variant="body1">
                  <strong>Time:</strong> {selectedRelease.originalBooking.startTime} - {selectedRelease.originalBooking.endTime}
                </Typography>
                <Typography variant="body1">
                  <strong>Purpose:</strong> {selectedRelease.originalBooking.reason}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* User Information */}
              <Typography variant="h6" gutterBottom color="primary">
                User Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedRelease.userInfo?.displayName || "Not provided"}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {selectedRelease.userInfo?.email || "Not provided"}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Alert severity="warning">
              Original booking information is not available
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOriginalBooking}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTemporaryReleases;
