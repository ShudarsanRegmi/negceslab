import React from "react";
import { Box, Typography } from "@mui/material";
import AdminPolicySettings from "../components/AdminPolicySettings";

const AdminPolicyPage: React.FC = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <AdminPolicySettings />
    </Box>
  );
};

export default AdminPolicyPage;
