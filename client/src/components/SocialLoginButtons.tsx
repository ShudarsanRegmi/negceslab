import React from 'react';
import { Box, Button, Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled components for social login buttons
const SocialButton = styled(Button)(({ theme }) => ({
  width: '100%',
  padding: '8px 16px',
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  fontSize: '0.9rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  '& img': {
    width: '20px',
    height: '20px',
  },
}));

const GoogleButton = styled(SocialButton)({
  backgroundColor: '#ffffff',
  border: '1px solid #dadce0',
  color: '#3c4043',
  '&:hover': {
    backgroundColor: '#f8f9fa',
    borderColor: '#dadce0',
    boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
  },
});

const MicrosoftButton = styled(SocialButton)({
  backgroundColor: '#ffffff',
  border: '1px solid #8C8C8C',
  color: '#5E5E5E',
  '&:hover': {
    backgroundColor: '#f8f9fa',
    borderColor: '#8C8C8C',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.1), 0 1px 3px 1px rgba(0,0,0,0.05)',
  },
});

const StyledDivider = styled(Divider)(({ theme }) => ({
  width: '100%',
  margin: theme.spacing(2, 0),
  '& .MuiDivider-wrapper': {
    padding: theme.spacing(0, 2),
  },
}));

interface SocialLoginButtonsProps {
  onGoogleClick: () => void;
  onMicrosoftClick: () => void;
  isLoading?: boolean;
}

const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGoogleClick,
  onMicrosoftClick,
  isLoading = false,
}) => {
  return (
    <>
      <StyledDivider>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </StyledDivider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <GoogleButton
          onClick={onGoogleClick}
          disabled={isLoading}
        >
          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTcuNiA5LjJsLS4xLTEuOEg5djMuNGg0LjhDMTMuNiAxMiAxMyAxMyAxMiAxMy42djIuMmgzYTguOCA4LjggMCAwIDAgMi42LTYuNnoiIGZpbGw9IiM0Mjg1RjQiIGZpbGwtcnVsZT0ibm9uemVybyIvPjxwYXRoIGQ9Ik05IDE4YzIuNCAwIDQuNS0uOCA2LTIuMmwtMy0yLjJhNS40IDUuNCAwIDAgMS04LTIuOUgxVjEzYTkgOSAwIDAgMCA4IDV6IiBmaWxsPSIjMzRBODUzIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNNCAxMC43YTUuNCA1LjQgMCAwIDEgMC0zLjRWNUgxYTkgOSAwIDAgMCAwIDhsMy0yLjN6IiBmaWxsPSIjRkJCQzA1IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48cGF0aCBkPSJNOSAzLjZjMS4zIDAgMi41LjQgMy40IDEuM0wxNSAyLjNBOSA5IDAgMCAwIDEgNWwzIDIuNGE1LjQgNS40IDAgMCAxIDUtMy43eiIgZmlsbD0iI0VBNDMzNSIgZmlsbC1ydWxlPSJub256ZXJvIi8+PHBhdGggZD0iTTAgMGgxOHYxOEgweiIvPjwvZz48L3N2Zz4="
            alt="Google"
          />
          Continue with Google
        </GoogleButton>
        {/* <MicrosoftButton
          onClick={onMicrosoftClick}
          disabled={isLoading}
        >
          <img
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMyAyMyI+PHBhdGggZmlsbD0iI2YzNWMyNiIgZD0iTTEgMWgxMHYxMEgxeiIvPjxwYXRoIGZpbGw9IiMwMGE0ZWYiIGQ9Ik0xMiAxaDEwdjEwSDEyeiIvPjxwYXRoIGZpbGw9IiM3ZmJhMDAiIGQ9Ik0xIDEyaDEwdjEwSDF6Ii8+PHBhdGggZmlsbD0iI2ZmYjkwMCIgZD0iTTEyIDEyaDEwdjEwSDF6Ii8+PC9zdmc+"
            alt="Microsoft"
          />
          Continue with Microsoft
        </MicrosoftButton> */}
      </Box>
    </>
  );
};

export default SocialLoginButtons; 