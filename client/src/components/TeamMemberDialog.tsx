import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Avatar, IconButton, Stack } from "@mui/material";
import { Close, LinkedIn, Email, Work } from "@mui/icons-material";
import { motion } from "framer-motion";

interface TeamMember {
  name: string;
  role: string;
  image: string;
  contact: string;
  contactLabel: string;
  roleLink: string;
  roleLabel: string;
}

interface TeamMemberDialogProps {
  open: boolean;
  member: TeamMember | null;
  onClose: () => void;
}

const placeholderBio =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur consectetur, nisl nisi euismod nisi, euismod euismod nisi nisi euismod.";

const TeamMemberDialog: React.FC<TeamMemberDialogProps> = ({ open, member, onClose }) => {
  if (!member) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'visible', boxShadow: 8, position: 'relative', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(2.5px)' } }}>
      <DialogTitle sx={{ p: 0, pb: 1, background: 'linear-gradient(90deg, #2563eb 0%, #1de9b6 100%)', color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ p: 2, pb: 1 }}>
          <Avatar src={member.image} alt={member.name} sx={{ width: 64, height: 64, border: '3px solid #fff', boxShadow: 2 }} />
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', letterSpacing: 0.5 }}>{member.name}</Typography>
            <Typography variant="subtitle1" sx={{ color: '#e0f2fe', fontWeight: 500 }}>{member.role}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ ml: 'auto', color: '#fff' }}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Typography variant="body1" sx={{ mb: 2, color: '#374151' }}>{placeholderBio}</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 1 }}>
            <Button variant="outlined" color="primary" startIcon={<Email />} href={member.contact} target="_blank" rel="noopener" sx={{ textTransform: 'none', fontWeight: 600 }}>
              Email
            </Button>
            <Button variant="outlined" color="secondary" startIcon={<LinkedIn />} href="#" target="_blank" rel="noopener" sx={{ textTransform: 'none', fontWeight: 600 }}>
              LinkedIn
            </Button>
          </Stack>
        </motion.div>
      </DialogContent>
      <DialogActions sx={{ pb: 2, pr: 3 }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ fontWeight: 700, borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamMemberDialog; 