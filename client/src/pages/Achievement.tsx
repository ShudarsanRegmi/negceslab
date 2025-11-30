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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4, maxWidth: 1200, mx: 'auto' }}>
          {[...Array(4)].map((_, idx) => (
            <Card key={`skeleton-${idx}`} sx={{ borderRadius: 3, boxShadow: 3, background: '#ffffff', p: 2, minHeight: 260, border: '1px solid #e0e7ff' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                  <Skeleton variant="text" width="80%" height={32} />
                </Box>
                <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="80%" height={16} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width={70} height={24} sx={{ borderRadius: 1 }} />
                </Box>
                <Skeleton variant="text" width="40%" height={16} />
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4, maxWidth: 1200, mx: 'auto' }}>
          {achievements.map((ach) => (
            <Card key={ach._id} sx={{ borderRadius: 3, boxShadow: 3, background: '#ffffff', p: 2, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #e0e7ff', transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon sx={{ mr: 1, color: '#6366f1' }} />
                  <Typography variant="h5" fontWeight={600} color="#1e40af" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ach.title}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2, backgroundColor: '#e0e7ff' }} />
                <Typography variant="subtitle1" fontWeight={500} color="#334155" gutterBottom>
                  {ach.author}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {ach.excerpt && (
                    <Typography variant="body1" color="#64748b" sx={{ mb: 1, fontStyle: 'italic' }}>
                      {ach.excerpt}
                    </Typography>
                  )}
                  <Box sx={{ '& p': { margin: 0, marginBottom: 1 }, '& p:last-child': { marginBottom: 0 }, color: '#64748b', fontSize: '1rem', lineHeight: 1.5 }}>
                    <ReactMarkdown>{ach.content}</ReactMarkdown>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {ach.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" sx={{ backgroundColor: '#dbeafe', color: '#1e3a8a', fontWeight: 500 }} />
                  ))}
                </Box>
                <Typography variant="caption" color="#94a3b8">
                  {ach.date}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Achievement;
