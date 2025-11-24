import React from 'react';
import { Box, Typography, Card, CardContent, Avatar, Grid, Divider, Chip } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const achievements = [
  {
    title: 'Paper Accepted at SecITC 2025 | International Conference on Security for Information Technology and Communications',
    author: 'Shudarsan Regmi, Dr. Saravanan Selvam',
    description:
      'A research contribution from NEGCES Lab was presented at SecITC 2025, an established international forum focused on advancements in information and communication security. The conference took place in Bucharest, Romania.\n\n' +
      'The paper titled "Securing LLM-Integrated Chatbots: A Transformer-Based Vulnerability Scanner for Prompt Injection and Jailbreak Detection" introduces a structured evaluation framework for assessing security weaknesses in LLM driven chatbot systems. The study examines three critical threat categories, namely prompt manipulation, jailbreak style interactions, and exposure of sensitive information. The work provides a clear methodology to investigate how these threats emerge in practical deployments.\n\n' +
      'The project was carried out under the academic supervision of Dr. Saravanan Selvam.\n\n' +
      'NEGCES Lab acknowledges the support of Amrita Vishwa Vidyapeetham, Chennai Campus. The research environment and computational facilities available at the campus enabled consistent experimentation and reliable analysis.',
    date: 'November 2025',
    tags: ['Research', 'LLM Security', 'Vulnerability Analysis', 'Prompt Injection', 'Conference', 'NEGCES Lab']
  },
  {
    title: 'Paper Accepted at SOTVIA 2025! | International Conference',
    author: 'Vishal R, Deepak K, Venkatesan K, Syarifah Bahiyah Rahayu, Najah Alsubaie',
    description:
      '🎉 Paper Accepted at SOTVIA 2025!\n' +
      'We’re excited to announce that a research work from NEGCES Lab has been accepted for presentation at the prestigious 3rd SOTVIA 2025 Conference, to be held in Nanjing, China on September 9, 2025.\n\n' +
      'The paper, titled\n' +
      '"DeepNest-SCAN: An Unsupervised Surface Crack Anomaly Detection Using Nested Autoencoders",\n' +
      'will also be published in the JOIV: International Journal on Informatics Visualization (indexed by SCOPUS).\n\n' +
      'Congratulations to the authors:\n' +
      '👉 Vishal R (final year UG student, Automation & Robotics, Mechanical Engg.)\n' +
      '👉 Deepak K, Venkatesan K (Amrita School of Computing)\n' +
      '👉 Syarifah Bahiyah Rahayu (National Defence University Malaysia)\n' +
      '👉 Najah Alsubaie (Princess Nourah bint Abdulrahman University, Saudi Arabia)',
    date: 'August 2025',
    tags: ['Research', 'Unsupervised Learning', 'Autoencoders', 'Conference', 'SCOPUS', 'NEGCES Lab'],
  }
  
];

const Achievement: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f7faff',
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 6 },
      }}
    >
      <Box sx={{ maxWidth: 900, mx: 'auto', mb: 6, textAlign: 'center' }}>
        <Avatar
          sx={{
            bgcolor: '#c7d2fe',
            width: 64,
            height: 64,
            mb: 2,
            mx: 'auto',
            boxShadow: 3,
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 40, color: '#4f46e5' }} />
        </Avatar>
        <Typography variant="h3" fontWeight={700} color="#1e293b" gutterBottom>
          Lab Achievements
        </Typography>
        <Typography variant="h6" color="#475569">
          Celebrating the outstanding accomplishments and research milestones of our lab members.
        </Typography>
      </Box>
      <Grid container spacing={4} justifyContent="center">
        {achievements.map((ach, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 3,
                background: '#ffffff',
                p: 2,
                minHeight: 260,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid #e0e7ff',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmojiEventsIcon sx={{ mr: 1, color: '#6366f1' }} />
                  <Typography variant="h5" fontWeight={600} color="#1e40af">
                    {ach.title}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2, backgroundColor: '#e0e7ff' }} />
                <Typography variant="subtitle1" fontWeight={500} color="#334155" gutterBottom>
                  {ach.author}
                </Typography>
                <Typography variant="body1" color="#64748b" sx={{ mb: 2 }}>
                  {ach.description.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {ach.tags.map((tag, i) => (
                    <Chip
                      key={i}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor: '#dbeafe',
                        color: '#1e3a8a',
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="#94a3b8">
                  {ach.date}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Achievement;
