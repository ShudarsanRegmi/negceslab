import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Skeleton,
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { feedbackAPI } from '../services/api';

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

const AdminFeedbackManagement: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'resolved' | 'in_progress'>('pending');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackAPI.getAllFeedback();
      setFeedbacks(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminResponse(feedback.adminResponse || '');
    setNewStatus(feedback.status);
    setFeedbackDialogOpen(true);
  };

  const handleCloseFeedbackDialog = () => {
    setFeedbackDialogOpen(false);
    setSelectedFeedback(null);
    setAdminResponse('');
    setNewStatus('pending');
  };

  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;
    
    setUpdating(true);
    try {
      await feedbackAPI.updateFeedbackStatus(selectedFeedback._id, {
        status: newStatus,
        adminResponse: adminResponse.trim() || undefined,
      });
      
      handleCloseFeedbackDialog();
      fetchFeedbacks();
      setSuccessMessage('Feedback updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error updating feedback:', error);
      setError('Failed to update feedback');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string): 'default' | 'warning' | 'success' => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'in_progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Feedback Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and respond to user feedback and inquiries
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchFeedbacks}
          disabled={loading}
          size="small"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </Box>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 150, flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Feedback
            </Typography>
            <Typography variant="h4">
              {feedbacks.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Pending
            </Typography>
            <Typography variant="h4" color="warning.main">
              {feedbacks.filter(f => f.status === 'pending').length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              In Progress
            </Typography>
            <Typography variant="h4" color="info.main">
              {feedbacks.filter(f => f.status === 'in_progress').length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 150, flex: 1 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Resolved
            </Typography>
            <Typography variant="h4" color="success.main">
              {feedbacks.filter(f => f.status === 'resolved').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Feedback Table/List */}
      {loading ? (
        <Card>
          <CardContent>
            {[...Array(5)].map((_, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="80%" height={16} />
              </Box>
            ))}
          </CardContent>
        </Card>
      ) : isMobile ? (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <List>
              {feedbacks.map((feedback, index) => (
                <React.Fragment key={feedback._id}>
                  <ListItem
                    onClick={() => handleFeedbackClick(feedback)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {feedback.subject}
                          </Typography>
                          <Chip
                            label={feedback.status}
                            color={getStatusColor(feedback.status)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            From: {feedback.fullName} ({feedback.email})
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mt: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {feedback.message}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < feedbacks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
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
                  onClick={() => handleFeedbackClick(feedback)}
                >
                  <TableCell>{new Date(feedback.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{feedback.fullName}</TableCell>
                  <TableCell>{feedback.email}</TableCell>
                  <TableCell>{feedback.subject}</TableCell>
                  <TableCell>
                    <Chip
                      label={feedback.status}
                      color={getStatusColor(feedback.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedbackClick(feedback);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {feedbacks.length === 0 && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No feedback submissions found
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Feedback Detail Dialog */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={handleCloseFeedbackDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Feedback Details</Typography>
          <IconButton onClick={handleCloseFeedbackDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedFeedback && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* User Information */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Contact Information
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1">
                      {selectedFeedback.fullName}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {selectedFeedback.email}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Submitted
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedFeedback.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Feedback Content */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Feedback Content
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Subject
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedFeedback.subject}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Message
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedFeedback.message}
                  </Typography>
                </Box>
              </Paper>

              {/* Admin Response */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Admin Response
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as 'pending' | 'resolved' | 'in_progress')}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Admin Response (Optional)"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder="Add your response or notes here..."
                  />
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFeedbackDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateFeedback}
            variant="contained"
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Feedback'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFeedbackManagement;
