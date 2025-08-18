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
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { computersAPI, bookingsAPI } from "../services/api";

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
  mentor?: string;
}

const AdminComputerManagement: React.FC = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [computersRes, bookingsRes] = await Promise.all([
        computersAPI.getComputersWithBookings(),
        bookingsAPI.getAllBookings(),
      ]);
      
      setComputers(computersRes.data);
      setBookings(bookingsRes.data);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComputer = async () => {
    try {
      const specifications = `OS: ${newComputer.os}\nProcessor: ${newComputer.processor}\nRAM: ${newComputer.ram}\nROM: ${newComputer.rom}`;
      
      await computersAPI.createComputer({
        name: newComputer.name,
        location: "Main Lab", // Default location
        specifications,
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

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Computer Management
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
          Computer Management
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
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
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComputerDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComputer} variant="contained">
            Add Computer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminComputerManagement;
