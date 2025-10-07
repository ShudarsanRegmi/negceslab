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
  Edit as EditIcon,
  Info as InfoIcon,
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [editComputer, setEditComputer] = useState({
    name: "",
    os: "",
    processor: "",
    ram: "",
    rom: "",
    location: "",
    status: "available" as "available" | "maintenance" | "reserved",
  });
  const [newComputer, setNewComputer] = useState({
    name: "",
    os: "",
    processor: "",
    ram: "",
    rom: "",
    status: "available" as "available" | "maintenance" | "reserved",
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

  const handleComputerClick = (computer: Computer) => {
    setSelectedComputer(computer);
    
    // Parse specifications to populate edit form
    const specs = computer.specifications;
    const osMatch = specs.match(/OS:\s*([^\n]+)/);
    const processorMatch = specs.match(/Processor:\s*([^\n]+)/);
    const ramMatch = specs.match(/RAM:\s*([^\n]+)/);
    const romMatch = specs.match(/ROM:\s*([^\n]+)/);
    
    setEditComputer({
      name: computer.name,
      os: osMatch ? osMatch[1].trim() : "",
      processor: processorMatch ? processorMatch[1].trim() : "",
      ram: ramMatch ? ramMatch[1].trim() : "",
      rom: romMatch ? romMatch[1].trim() : "",
      location: computer.location,
      status: computer.status,
    });
    
    setIsEditMode(false); // Start in view mode
    setViewDialogOpen(true);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // Reset to original values
    if (selectedComputer) {
      const specs = selectedComputer.specifications;
      const osMatch = specs.match(/OS:\s*([^\n]+)/);
      const processorMatch = specs.match(/Processor:\s*([^\n]+)/);
      const ramMatch = specs.match(/RAM:\s*([^\n]+)/);
      const romMatch = specs.match(/ROM:\s*([^\n]+)/);
      
      setEditComputer({
        name: selectedComputer.name,
        os: osMatch ? osMatch[1].trim() : "",
        processor: processorMatch ? processorMatch[1].trim() : "",
        ram: ramMatch ? ramMatch[1].trim() : "",
        rom: romMatch ? romMatch[1].trim() : "",
        location: selectedComputer.location,
        status: selectedComputer.status,
      });
    }
    setIsEditMode(false);
  };

  const handleUpdateComputer = async () => {
    if (!selectedComputer) return;
    
    try {
      const specifications = `OS: ${editComputer.os}\nProcessor: ${editComputer.processor}\nRAM: ${editComputer.ram}\nROM: ${editComputer.rom}`;
      
      await computersAPI.updateComputer(selectedComputer._id, {
        name: editComputer.name,
        location: editComputer.location,
        specifications,
        status: editComputer.status,
      });
      
      setIsEditMode(false);
      setViewDialogOpen(false);
      setSelectedComputer(null);
      fetchData();
    } catch (error) {
      console.error("Error updating computer:", error);
      setError("Failed to update computer");
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
                <ListItem 
                  onClick={() => handleComputerClick(computer)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
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
                        {computer.status === "reserved" &&
                          computer.nextAvailable && (
                            <Typography
                              variant="caption"
                              color="error"
                              display="block"
                              sx={{ mt: 1 }}
                            >
                              Reserved until {computer.nextAvailable} on{" "}
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
                        {computer.status === "reserved" && (
                          <Typography
                            variant="caption"
                            color="error.main"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            Reserved
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteComputer(computer._id);
                      }}
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
                  <TableRow 
                    key={computer._id}
                    onClick={() => handleComputerClick(computer)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell>{computer.name}</TableCell>
                    <TableCell>{computer.location}</TableCell>
                    <TableCell>
                      Bookings: {bookingCount}
                    </TableCell>
                    <TableCell>{computer.specifications}</TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComputer(computer._id);
                        }}
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
                <MenuItem value="reserved">Reserved</MenuItem>
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

      {/* View/Edit Computer Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setIsEditMode(false);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isEditMode ? (
                <>
                  <EditIcon color="primary" />
                  <Typography variant="h6">Edit Computer</Typography>
                </>
              ) : (
                <>
                  <InfoIcon color="primary" />
                  <Typography variant="h6">Computer Details</Typography>
                </>
              )}
            </Box>
            {!isEditMode && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                size="small"
              >
                Edit
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {selectedComputer && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>System Information</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>ID:</strong> {selectedComputer._id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Active Bookings:</strong> {bookings.filter(
                      b => b.computerId._id === selectedComputer._id && b.status === 'approved'
                    ).length}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {isEditMode ? (
              // Edit Mode - Editable Fields
              <>
                <TextField
                  label="Name"
                  value={editComputer.name}
                  onChange={(e) =>
                    setEditComputer({ ...editComputer, name: e.target.value })
                  }
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                />
                
                <TextField
                  label="Location"
                  value={editComputer.location}
                  onChange={(e) =>
                    setEditComputer({ ...editComputer, location: e.target.value })
                  }
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  placeholder="e.g., Main Lab, Room 101"
                />
                
                <TextField
                  label="Operating System"
                  value={editComputer.os}
                  onChange={(e) =>
                    setEditComputer({ ...editComputer, os: e.target.value })
                  }
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  placeholder="e.g., Windows 11, Ubuntu 22.04, macOS"
                />
                
                <TextField
                  label="Processor"
                  value={editComputer.processor}
                  onChange={(e) =>
                    setEditComputer({ ...editComputer, processor: e.target.value })
                  }
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  placeholder="e.g., Intel i7-12700K, AMD Ryzen 7 5800X"
                />
                
                <TextField
                  label="RAM"
                  value={editComputer.ram}
                  onChange={(e) =>
                    setEditComputer({ ...editComputer, ram: e.target.value })
                  }
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  placeholder="e.g., 16GB DDR4, 32GB DDR5"
                />
                
                <TextField
                  label="Storage"
                  value={editComputer.rom}
                  onChange={(e) =>
                    setEditComputer({ ...editComputer, rom: e.target.value })
                  }
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  placeholder="e.g., 512GB SSD, 1TB NVMe"
                />
                
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editComputer.status}
                    onChange={(e) =>
                      setEditComputer({
                        ...editComputer,
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
              </>
            ) : (
              // View Mode - Read-only Display
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Name</Typography>
                      <Typography variant="body1" fontWeight="medium">{editComputer.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body1" fontWeight="medium">{editComputer.location}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body1"
                          fontWeight="medium"
                          color={
                            editComputer.status === 'available'
                              ? 'success.main'
                              : editComputer.status === 'maintenance'
                              ? 'warning.main'
                              : 'error.main'
                          }
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {editComputer.status}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    Hardware Specifications
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Operating System</Typography>
                      <Typography variant="body1" fontWeight="medium">{editComputer.os || 'Not specified'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Processor</Typography>
                      <Typography variant="body1" fontWeight="medium">{editComputer.processor || 'Not specified'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">RAM</Typography>
                      <Typography variant="body1" fontWeight="medium">{editComputer.ram || 'Not specified'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Storage</Typography>
                      <Typography variant="body1" fontWeight="medium">{editComputer.rom || 'Not specified'}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {isEditMode ? (
            // Edit Mode Actions
            <>
              <Button onClick={handleCancelEdit} color="inherit">
                Cancel
              </Button>
              <Button onClick={handleUpdateComputer} variant="contained" startIcon={<EditIcon />}>
                Save Changes
              </Button>
            </>
          ) : (
            // View Mode Actions
            <Button onClick={() => setViewDialogOpen(false)} variant="outlined">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminComputerManagement;
