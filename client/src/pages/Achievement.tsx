import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Avatar, Divider, Chip, Alert, Skeleton } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ReactMarkdown from 'react-markdown';
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

const Achievement: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await achievementsAPI.getPublishedAchievements();
      setAchievements(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f7faff', py: { xs: 4, md: 8 }, px: { xs: 2, md: 6 } }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f7faff', py: { xs: 4, md: 8 }, px: { xs: 2, md: 6 } }}>
      <Box sx={{ maxWidth: 900, mx: 'auto', mb: 6, textAlign: 'center' }}>
        <Avatar sx={{ bgcolor: '#c7d2fe', width: 64, height: 64, mb: 2, mx: 'auto', boxShadow: 3 }}>
          <EmojiEventsIcon sx={{ fontSize: 40, color: '#4f46e5' }} />
        </Avatar>
        <Typography variant="h3" fontWeight={700} color="#1e293b" gutterBottom>
          Lab Achievements
        </Typography>
        <Typography variant="h6" color="#475569">
          Celebrating the outstanding accomplishments and research milestones of our lab members.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {[...Array(3)].map((_, idx) => (
            <Card key={`skeleton-${idx}`} sx={{ mb: 4, borderRadius: 3, boxShadow: 3, background: '#ffffff', border: '1px solid #e0e7ff', '&:last-child': { mb: 0 } }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <Skeleton variant="text" width="70%" height={40} sx={{ mb: 1 }} />
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Skeleton variant="text" width="30%" height={24} />
                        <Skeleton variant="text" width="25%" height={20} />
                      </Box>
                    </Box>
                    <Skeleton variant="rectangular" width={40} height={24} sx={{ borderRadius: 1 }} />
                  </Box>
                </Box>
                <Box sx={{ mb: 3, p: 3, backgroundColor: '#f8fafc', borderRadius: 2 }}>
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="80%" height={20} />
                </Box>
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="60%" height={16} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 2, borderTop: '1px solid #f1f5f9' }}>
                  <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1 }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : achievements.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No achievements published yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ maxWidth: 800, mx: 'auto', position: 'relative', pl: { xs: 0, md: 3 } }}>
          {/* Timeline line (visible on desktop) */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: '#e0e7ff',
              display: { xs: 'none', md: 'block' },
              zIndex: 0
            }}
          />
          
          {achievements
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((ach, index) => (
            <Card 
              key={ach._id} 
              sx={{ 
                mb: 4,
                borderRadius: 3, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                background: '#ffffff', 
                border: '1px solid #e0e7ff', 
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                '&:hover': { 
                  transform: 'translateY(-2px)', 
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)' 
                },
                '&:last-child': {
                  mb: 0
                }
              }}
            >
              {/* Timeline indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  left: { xs: 16, md: -12 },
                  top: 24,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: '#6366f1',
                  border: '4px solid #f7faff',
                  zIndex: 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                {/* Header with title and date */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ flex: 1, mr: 2, pl: { xs: 4, md: 0 } }}>
                      <Typography 
                        variant="h4" 
                        fontWeight={700} 
                        color="#1e293b" 
                        sx={{ 
                          mb: 1,
                          fontSize: { xs: '1.5rem', md: '2rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {ach.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={600} 
                          color="#6366f1"
                          sx={{ display: 'flex', alignItems: 'center' }}
                        >
                          <EmojiEventsIcon sx={{ mr: 1, fontSize: 20 }} />
                          {ach.author}
                        </Typography>
                        <Typography variant="body2" color="#64748b">
                          {ach.date}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      label={`#${index + 1}`} 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#f1f5f9', 
                        color: '#475569', 
                        fontWeight: 600,
                        minWidth: 40
                      }} 
                    />
                  </Box>
                </Box>

                {/* Content section */}
                <Box sx={{ mb: 3 }}>
                  {ach.excerpt && (
                    <Box sx={{ 
                      mb: 3, 
                      p: 3, 
                      backgroundColor: '#f8fafc', 
                      borderRadius: 2, 
                      borderLeft: '4px solid #6366f1' 
                    }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontStyle: 'italic', 
                          color: '#475569',
                          fontSize: '1.1rem',
                          lineHeight: 1.6
                        }}
                      >
                        {ach.excerpt}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ 
                    '& p': { 
                      margin: 0, 
                      marginBottom: 2, 
                      fontSize: '1rem',
                      lineHeight: 1.7,
                      color: '#374151'
                    }, 
                    '& p:last-child': { 
                      marginBottom: 0 
                    },
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      color: '#1f2937',
                      fontWeight: 600,
                      marginBottom: 1,
                      marginTop: 2
                    },
                    '& h1, & h2': {
                      fontSize: '1.25rem'
                    },
                    '& h3, & h4': {
                      fontSize: '1.1rem'
                    },
                    '& ul, & ol': {
                      marginLeft: 2,
                      marginBottom: 2
                    },
                    '& li': {
                      marginBottom: 0.5,
                      color: '#374151'
                    },
                    '& blockquote': {
                      borderLeft: '4px solid #e5e7eb',
                      paddingLeft: 2,
                      margin: '1rem 0',
                      fontStyle: 'italic',
                      color: '#6b7280'
                    },
                    '& code': {
                      backgroundColor: '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: 1,
                      fontSize: '0.9rem'
                    },
                    '& pre': {
                      backgroundColor: '#f3f4f6',
                      padding: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      marginBottom: 2
                    }
                  }}>
                    <ReactMarkdown>{ach.content}</ReactMarkdown>
                  </Box>
                </Box>

                {/* Tags section */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 2, borderTop: '1px solid #f1f5f9' }}>
                  {ach.tags.map((tag, i) => (
                    <Chip 
                      key={i} 
                      label={tag} 
                      size="small" 
                      sx={{ 
                        backgroundColor: '#dbeafe', 
                        color: '#1e40af', 
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: '#bfdbfe'
                        }
                      }} 
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Achievement;
