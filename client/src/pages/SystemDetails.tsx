import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Computer as ComputerIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Monitor as MonitorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { systemDetailsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Computer {
  _id: string;
  name: string;
  location: string;
  specifications: string;
  systemDetails?: {
    operatingSystem: string;
    osVersion: string;
    architecture: string;
    processor: string;
    ram: string;
    storage: string;
    gpu: string;
    installedSoftware: Array<{
      name: string;
      version: string;
      category: string;
      icon: string;
    }>;
    additionalNotes: string;
    lastUpdated: string;
  };
}

interface Software {
  name: string;
  version: string;
  category: string;
  icon: string;
}

const SystemDetails: React.FC = () => {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [softwarePool, setSoftwarePool] = useState<any[]>([]);
  const [osIcons, setOsIcons] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [softwareDialogOpen, setSoftwareDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [softwareSearchTerm, setSoftwareSearchTerm] = useState('');
  const [filteredSoftware, setFilteredSoftware] = useState<any[]>([]);
  const [softwareViewDialogOpen, setSoftwareViewDialogOpen] = useState(false);
  const [selectedComputerForSoftware, setSelectedComputerForSoftware] = useState<Computer | null>(null);
  
  // Form states
  const [systemForm, setSystemForm] = useState({
    operatingSystem: '',
    osVersion: '',
    architecture: '',
    processor: '',
    ram: '',
    storage: '',
    gpu: '',
    additionalNotes: ''
  });
  
  const [softwareForm, setSoftwareForm] = useState({
    name: '',
    version: '',
    category: 'Other',
    icon: ''
  });

  const { userRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetchSystemDetails();
    fetchSoftwarePool();
  }, []);

  useEffect(() => {
    // Filter software based on search term
    if (softwareSearchTerm.trim() === '') {
      setFilteredSoftware(softwarePool);
    } else {
      const filtered = softwarePool.filter(software => 
        software.keywords.some((keyword: string) => 
          keyword.toLowerCase().includes(softwareSearchTerm.toLowerCase())
        ) || 
        software.name.toLowerCase().includes(softwareSearchTerm.toLowerCase())
      );
      setFilteredSoftware(filtered);
    }
  }, [softwareSearchTerm, softwarePool]);

  const fetchSystemDetails = async () => {
    try {
      setLoading(true);
      const usePublic = !currentUser; // Use public API if no user is authenticated
      const response = await systemDetailsAPI.getAllSystemDetails(usePublic);
      setComputers(response.data);
    } catch (error) {
      console.error("Error fetching system details:", error);
      setError("Failed to load system details");
    } finally {
      setLoading(false);
    }
  };

  const fetchSoftwarePool = async () => {
    try {
      const usePublic = !currentUser; // Use public API if no user is authenticated
      const response = await systemDetailsAPI.getSoftwarePool(usePublic);
      setSoftwarePool(response.data.softwarePool);
      setOsIcons(response.data.osIcons);
      setFilteredSoftware(response.data.softwarePool);
    } catch (error) {
      console.error("Error fetching software pool:", error);
    }
  };

  const handleEditSystem = (computer: Computer) => {
    setSelectedComputer(computer);
    setSystemForm({
      operatingSystem: computer.systemDetails?.operatingSystem || '',
      osVersion: computer.systemDetails?.osVersion || '',
      architecture: computer.systemDetails?.architecture || '',
      processor: computer.systemDetails?.processor || '',
      ram: computer.systemDetails?.ram || '',
      storage: computer.systemDetails?.storage || '',
      gpu: computer.systemDetails?.gpu || '',
      additionalNotes: computer.systemDetails?.additionalNotes || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateSystem = async () => {
    if (!selectedComputer) return;

    try {
      const response = await systemDetailsAPI.updateSystemDetails(selectedComputer._id, systemForm);
      setComputers(prev => prev.map(comp => 
        comp._id === selectedComputer._id ? response.data : comp
      ));
      setEditDialogOpen(false);
      setSuccessMessage("System details updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating system details:", error);
      setError("Failed to update system details");
    }
  };

  const handleAddSoftware = () => {
    setSoftwareForm({
      name: '',
      version: '',
      category: 'Other',
      icon: '💻'
    });
    setSoftwareDialogOpen(true);
  };

  const handleSaveSoftware = async () => {
    if (!selectedComputer || !softwareForm.name) return;

    try {
      const response = await systemDetailsAPI.addSoftware(selectedComputer._id, softwareForm);
      setComputers(prev => prev.map(comp => 
        comp._id === selectedComputer._id ? response.data : comp
      ));
      setSoftwareDialogOpen(false);
      setSuccessMessage("Software added successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error adding software:", error);
      setError("Failed to add software");
    }
  };

  const handleRemoveSoftware = async (softwareIndex: number) => {
    if (!selectedComputer) return;

    try {
      const response = await systemDetailsAPI.removeSoftware(selectedComputer._id, softwareIndex);
      setComputers(prev => prev.map(comp => 
        comp._id === selectedComputer._id ? response.data : comp
      ));
      setSuccessMessage("Software removed successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error removing software:", error);
      setError("Failed to remove software");
    }
  };

  const getOSIcon = (os: string) => {
    return osIcons[os] || osIcons['Other'];
  };

  const getOSDisplay = (os: string) => {
    switch (os) {
      case 'Dual Boot':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <img 
              src={osIcons['Windows']} 
              alt="Windows"
              style={{ width: 20, height: 20, objectFit: 'contain' }}
            />
            <span style={{ fontSize: '12px' }}>+</span>
            <img 
              src={osIcons['Linux']} 
              alt="Linux"
              style={{ width: 20, height: 20, objectFit: 'contain' }}
            />
          </Box>
        );
      case 'WSL':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <img 
              src={osIcons['Windows']} 
              alt="Windows"
              style={{ width: 20, height: 20, objectFit: 'contain' }}
            />
            <span style={{ fontSize: '12px' }}>+</span>
            <img 
              src={osIcons['Linux']} 
              alt="WSL"
              style={{ width: 20, height: 20, objectFit: 'contain' }}
            />
          </Box>
        );
      default:
        return (
          <img 
            src={getOSIcon(os)} 
            alt={os}
            style={{ width: 20, height: 20, objectFit: 'contain' }}
          />
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Development': return 'primary';
      case 'Design': return 'secondary';
      case 'Analysis': return 'success';
      case 'Office': return 'info';
      default: return 'default';
    }
  };

  // Remove admin-only restriction - now accessible to all users

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading system details...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          System Details
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchSystemDetails}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {computers.map((computer) => (
          <Grid item xs={12} sm={6} md={4} key={computer._id}>
            <Card 
              sx={{ 
                height: 380,
                width: '100%',
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {computer.name}
                  </Typography>
                  {userRole === 'admin' && (
                    <IconButton
                      size="small"
                      onClick={() => handleEditSystem(computer)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {computer.location}
                </Typography>

                {computer.systemDetails ? (
                  <Box sx={{ mt: 2, flexGrow: 1 }}>
                    {/* Operating System */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getOSDisplay(computer.systemDetails.operatingSystem)}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {computer.systemDetails.operatingSystem}
                        {computer.systemDetails.osVersion && ` ${computer.systemDetails.osVersion}`}
                      </Typography>
                    </Box>

                    {/* Hardware Details */}
                    {computer.systemDetails.processor && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SpeedIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {computer.systemDetails.processor}
                        </Typography>
                      </Box>
                    )}

                    {computer.systemDetails.ram && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MemoryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {computer.systemDetails.ram}
                        </Typography>
                      </Box>
                    )}

                    {computer.systemDetails.storage && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <StorageIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {computer.systemDetails.storage}
                        </Typography>
                      </Box>
                    )}

                    {computer.systemDetails.gpu && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <MonitorIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {computer.systemDetails.gpu}
                        </Typography>
                      </Box>
                    )}

                    {/* Installed Software */}
                    {computer.systemDetails.installedSoftware && computer.systemDetails.installedSoftware.length > 0 && (
                      <Box sx={{ mt: 2, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2">
                            Installed Software ({computer.systemDetails.installedSoftware.length})
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedComputerForSoftware(computer);
                              setSoftwareViewDialogOpen(true);
                            }}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            View All
                          </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {computer.systemDetails.installedSoftware.slice(0, 3).map((software, index) => (
                            <Chip
                              key={index}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <img 
                                    src={software.icon} 
                                    alt={software.name}
                                    style={{ width: 16, height: 16, objectFit: 'contain' }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <span>{software.name}</span>
                                </Box>
                              }
                              size="small"
                              color={getCategoryColor(software.category) as any}
                              variant="outlined"
                            />
                          ))}
                          {computer.systemDetails.installedSoftware.length > 3 && (
                            <Chip
                              label={`+${computer.systemDetails.installedSoftware.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedComputerForSoftware(computer);
                                setSoftwareViewDialogOpen(true);
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Last Updated */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                      Last updated: {new Date(computer.systemDetails.lastUpdated).toLocaleDateString()}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No system details available
                    </Typography>
                    {userRole === 'admin' && (
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleEditSystem(computer)}
                        sx={{ mt: 1 }}
                      >
                        Add Details
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit System Details Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit System Details - {selectedComputer?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Operating System</InputLabel>
                  <Select
                    value={systemForm.operatingSystem}
                    onChange={(e) => setSystemForm({ ...systemForm, operatingSystem: e.target.value })}
                    label="Operating System"
                  >
                    <MenuItem value="Windows">Windows</MenuItem>
                    <MenuItem value="Linux">Linux</MenuItem>
                    <MenuItem value="macOS">macOS</MenuItem>
                    <MenuItem value="Dual Boot">Dual Boot</MenuItem>
                    <MenuItem value="WSL">WSL</MenuItem>
                    <MenuItem value="VM on Linux">VM on Linux</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="OS Version"
                  value={systemForm.osVersion}
                  onChange={(e) => setSystemForm({ ...systemForm, osVersion: e.target.value })}
                  placeholder="e.g., Windows 11, Ubuntu 22.04"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Architecture</InputLabel>
                  <Select
                    value={systemForm.architecture}
                    onChange={(e) => setSystemForm({ ...systemForm, architecture: e.target.value })}
                    label="Architecture"
                  >
                    <MenuItem value="x86_64">x86_64</MenuItem>
                    <MenuItem value="ARM64">ARM64</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Processor"
                  value={systemForm.processor}
                  onChange={(e) => setSystemForm({ ...systemForm, processor: e.target.value })}
                  placeholder="e.g., Intel i7-12700K"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="RAM"
                  value={systemForm.ram}
                  onChange={(e) => setSystemForm({ ...systemForm, ram: e.target.value })}
                  placeholder="e.g., 16GB DDR4"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Storage"
                  value={systemForm.storage}
                  onChange={(e) => setSystemForm({ ...systemForm, storage: e.target.value })}
                  placeholder="e.g., 512GB SSD"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="GPU"
                  value={systemForm.gpu}
                  onChange={(e) => setSystemForm({ ...systemForm, gpu: e.target.value })}
                  placeholder="e.g., NVIDIA RTX 3080"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  value={systemForm.additionalNotes}
                  onChange={(e) => setSystemForm({ ...systemForm, additionalNotes: e.target.value })}
                  multiline
                  rows={3}
                  placeholder="Any additional notes about the system..."
                />
              </Grid>
            </Grid>

            {/* Installed Software Section */}
            {selectedComputer?.systemDetails?.installedSoftware && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Installed Software</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddSoftware}
                  >
                    Add Software
                  </Button>
                </Box>
                <List>
                  {selectedComputer.systemDetails.installedSoftware.map((software, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {software.icon} {software.name}
                            </Typography>
                            {software.version && (
                              <Chip label={software.version} size="small" variant="outlined" />
                            )}
                            <Chip
                              label={software.category}
                              size="small"
                              color={getCategoryColor(software.category) as any}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleRemoveSoftware(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSystem} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Software Dialog */}
      <Dialog
        open={softwareDialogOpen}
        onClose={() => setSoftwareDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Software</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Search Software"
              value={softwareSearchTerm}
              onChange={(e) => setSoftwareSearchTerm(e.target.value)}
              placeholder="Type to search (e.g., python, matlab, photoshop)"
              helperText="Search by software name or keywords"
            />
            
            {/* Software Pool Results */}
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
              {filteredSoftware.length > 0 ? (
                <Grid container spacing={1}>
                  {filteredSoftware.map((software, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' }
                        }}
                        onClick={() => {
                          setSoftwareForm({
                            name: software.name,
                            version: software.version,
                            category: software.category,
                            icon: software.icon
                          });
                          setSoftwareSearchTerm('');
                        }}
                      >
                        <CardContent sx={{ py: 1, px: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <img 
                              src={software.icon} 
                              alt={software.name}
                              style={{ width: 24, height: 24, objectFit: 'contain' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {software.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {software.version} • {software.category}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No software found. Try different keywords.
                </Typography>
              )}
            </Box>

            {/* Manual Entry Fields */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Or enter manually:
            </Typography>
            <TextField
              fullWidth
              label="Software Name"
              value={softwareForm.name}
              onChange={(e) => setSoftwareForm({ ...softwareForm, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Version"
              value={softwareForm.version}
              onChange={(e) => setSoftwareForm({ ...softwareForm, version: e.target.value })}
              placeholder="e.g., 2023.1"
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={softwareForm.category}
                onChange={(e) => setSoftwareForm({ ...softwareForm, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Analysis">Analysis</MenuItem>
                <MenuItem value="Office">Office</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSoftwareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSoftware} variant="contained" disabled={!softwareForm.name}>
            Add Software
          </Button>
        </DialogActions>
      </Dialog>

      {/* Software View Dialog */}
      <Dialog
        open={softwareViewDialogOpen}
        onClose={() => setSoftwareViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Installed Software - {selectedComputerForSoftware?.name}
        </DialogTitle>
        <DialogContent>
          {selectedComputerForSoftware?.systemDetails?.installedSoftware && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {selectedComputerForSoftware.systemDetails.installedSoftware.map((software, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img 
                          src={software.icon} 
                          alt={software.name}
                          style={{ width: 32, height: 32, objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3">
                            {software.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Version: {software.version || 'N/A'}
                          </Typography>
                          <Chip
                            label={software.category}
                            size="small"
                            color={getCategoryColor(software.category) as any}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSoftwareViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemDetails; 