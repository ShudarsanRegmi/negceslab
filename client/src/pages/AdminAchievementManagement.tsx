import React, { useState, useEffect } from 'react';
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
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Publish as PublishIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import { achievementsAPI } from '../services/api';

interface Achievement {
  _id: string;
  title: string;
  author: string;
  content: string;
  excerpt?: string;
  tags: string[];
  date: string;
  status: 'draft' | 'published' | 'hidden';
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface AchievementFormData {
  title: string;
  author: string;
  content: string;
  excerpt: string;
  tags: string[];
  date: string;
  status: 'draft' | 'published' | 'hidden';
  featuredImage: string;
}

const AdminAchievementManagement: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);

  // Form state
  const [formData, setFormData] = useState<AchievementFormData>({
    title: '',
    author: '',
    content: '',
    excerpt: '',
    tags: [],
    date: '',
    status: 'draft',
    featuredImage: '',
  });

  // Tag input state
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await achievementsAPI.getAllAchievements();
      setAchievements(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (achievement?: Achievement) => {
    if (achievement) {
      setEditingAchievement(achievement);
      setFormData({
        title: achievement.title,
        author: achievement.author,
        content: achievement.content,
        excerpt: achievement.excerpt || '',
        tags: achievement.tags,
        date: achievement.date,
        status: achievement.status,
        featuredImage: achievement.featuredImage || '',
      });
    } else {
      setEditingAchievement(null);
      setFormData({
        title: '',
        author: '',
        content: '',
        excerpt: '',
        tags: [],
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        status: 'draft',
        featuredImage: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAchievement(null);
    setTagInput('');
  };

  const handleInputChange = (field: keyof AchievementFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    try {
      if (editingAchievement) {
        await achievementsAPI.updateAchievement(editingAchievement._id, formData);
        setSuccess('Achievement updated successfully');
      } else {
        await achievementsAPI.createAchievement(formData);
        setSuccess('Achievement created successfully');
      }
      fetchAchievements();
      handleCloseDialog();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving achievement:', error);
      setError('Failed to save achievement');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleStatusChange = async (achievement: Achievement, newStatus: 'draft' | 'published' | 'hidden') => {
    try {
      await achievementsAPI.updateAchievementStatus(achievement._id, newStatus);
      fetchAchievements();
      setSuccess(`Achievement ${newStatus} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!achievementToDelete) return;
    
    try {
      await achievementsAPI.deleteAchievement(achievementToDelete._id);
      fetchAchievements();
      setDeleteDialogOpen(false);
      setAchievementToDelete(null);
      setSuccess('Achievement deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting achievement:', error);
      setError('Failed to delete achievement');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'hidden':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Achievement Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Achievement
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {['Title', 'Author', 'Date', 'Status', 'Actions'].map((header) => (
                  <TableCell key={header}>
                    <Skeleton variant="text" width="80%" height={20} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, idx) => (
                <TableRow key={idx}>
                  {[...Array(5)].map((_, cellIdx) => (
                    <TableCell key={cellIdx}>
                      <Skeleton variant="text" width="100%" height={20} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {achievements.map((achievement) => (
                <TableRow key={achievement._id}>
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {achievement.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{achievement.author}</TableCell>
                  <TableCell>{achievement.date}</TableCell>
                  <TableCell>
                    <Chip 
                      label={achievement.status} 
                      color={getStatusColor(achievement.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(achievement)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    
                    {achievement.status !== 'published' && (
                      <IconButton
                        color="success"
                        onClick={() => handleStatusChange(achievement, 'published')}
                        title="Publish"
                      >
                        <PublishIcon />
                      </IconButton>
                    )}
                    
                    {achievement.status === 'published' && (
                      <IconButton
                        color="warning"
                        onClick={() => handleStatusChange(achievement, 'hidden')}
                        title="Hide"
                      >
                        <HideIcon />
                      </IconButton>
                    )}
                    
                    <IconButton
                      color="error"
                      onClick={() => {
                        setAchievementToDelete(achievement);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete"
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

      {/* Edit/Create Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          {editingAchievement ? 'Edit Achievement' : 'Create New Achievement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Author"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              fullWidth
              required
            />
            
            <TextField
              label="Excerpt (Optional)"
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              fullWidth
              multiline
              rows={2}
              helperText="Brief summary of the achievement (recommended for better display)"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag"
                  sx={{ flexGrow: 1 }}
                />
                <Button variant="outlined" onClick={handleAddTag}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="hidden">Hidden</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Content
              </Typography>
              <Box sx={{ '& .w-md-editor': { minHeight: '300px' } }}>
                <MDEditor
                  value={formData.content}
                  onChange={(val) => handleInputChange('content', val || '')}
                  preview="edit"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!formData.title || !formData.author || !formData.content}
          >
            {editingAchievement ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{achievementToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAchievementManagement;
