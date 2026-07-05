import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Divider, 
  Chip, 
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Version: React.FC = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f8fafc', 
      py: 6,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Container maxWidth="md">
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          href="/"
          sx={{ mb: 4, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Back to Home
        </Button>

        <Card sx={{ borderRadius: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
                  System Changelog
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  NegcesLab Slot Booking Management System
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Chip 
                  label="Version 3.1.0" 
                  color="primary" 
                  sx={{ fontWeight: 700, fontSize: '0.95rem', px: 1, py: 2, borderRadius: 2 }} 
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
                  Released: July 5, 2026
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              What's New in Version 3.1.0
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              
              {/* Category 1 */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  Booking Conflict Resolver & Overlap Management
                </Typography>
                <List dense>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Conflict checks now ignore pending applications, allowing multiple users to apply for the same slot." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Integrated automatic rejection logic that cancels and notifies overlapping requests once a booking is approved." />
                  </ListItem>
                </List>
              </Box>

              {/* Category 2 */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  Interactive User Warners
                </Typography>
                <List dense>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Real-time conflict alert flags now display directly under the date/time selectors to warn users before submission." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Created step intercept dialogs requiring user acknowledgement of competing booking risks." />
                  </ListItem>
                </List>
              </Box>

              {/* Category 3 */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  Admin Workspace Overhaul
                </Typography>
                <List dense>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Dedicated grouped workspace for slot conflicts showing chronologically sorted entries with request order badges (e.g. 1st Applied)." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Added real-time overdue delay badges (e.g., 'Delayed by 2 days') indicating how long a pending request has been waiting past its start date." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Disabled direct Approve/Reject actions in normal lists to prevent bypass of conflict resolution." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Added table pagination options and collapsible search filter drawer sections." />
                  </ListItem>
                </List>
              </Box>

              {/* Category 4 */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  System details & Software Grid
                </Typography>
                <List dense>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Cleaned up software lists to display tooltipped icons only, creating perfectly uniform layout cards." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Synchronized real-time software additions/deletions within the administrator edit dialog." />
                  </ListItem>
                </List>
              </Box>

              {/* Category 5 */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  Email Notifications
                </Typography>
                <List dense>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Redesigned all transactional emails to use clean, professional templates without emojis." />
                  </ListItem>
                  <ListItem disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Enabled HTML MIME parsing fixes to avoid raw source display on email clients." />
                  </ListItem>
                </List>
              </Box>

            </Box>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                For security issues or system feedback, please contact the administrator.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Version;
