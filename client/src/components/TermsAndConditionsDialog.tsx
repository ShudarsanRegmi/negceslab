import React, { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Alert,
  Box,
  useTheme,
} from '@mui/material';

interface TermsAccepted {
  usageDuration: boolean;
  coolingPeriod: boolean;
  academicPurpose: boolean;
  acknowledgement: boolean;
  prohibitedUse: boolean;
  dataResponsibility: boolean;
  compliance: boolean;
}

interface TermsAndConditionsDialogProps {
  open: boolean;
  onClose: () => void;
  termsAccepted: TermsAccepted;
  onTermsChange: (term: keyof TermsAccepted) => void;
  onAcceptAndSubmit: () => void;
  loading: boolean;
}

const TermsAndConditionsDialog: React.FC<TermsAndConditionsDialogProps> = memo(({
  open,
  onClose,
  termsAccepted,
  onTermsChange,
  onAcceptAndSubmit,
  loading
}) => {
  const theme = useTheme();

  const areAllTermsAccepted = () => {
    return Object.values(termsAccepted).every(accepted => accepted);
  };

  const handleCheckboxChange = (term: keyof TermsAccepted) => (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onTermsChange(term);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={false}
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: '#fff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        background: theme.palette.primary.light,
        color: theme.palette.primary.dark,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 2,
      }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Terms and Conditions
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body1" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
          Please read and accept the following terms and conditions before submitting your booking request:
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted.usageDuration}
                onChange={handleCheckboxChange('usageDuration')}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                <strong>I agree</strong> that the maximum usage duration is 15 days per request, and any extension up to 10 additional days requires admin approval.
              </Typography>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted.coolingPeriod}
                onChange={handleCheckboxChange('coolingPeriod')}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                <strong>I understand</strong> that there is a mandatory 15-day cooling period after maximum usage before I can reapply for resources.
              </Typography>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted.academicPurpose}
                onChange={handleCheckboxChange('academicPurpose')}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                <strong>I confirm</strong> that these resources will be used exclusively for academic or research work purposes only.
              </Typography>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted.acknowledgement}
                onChange={handleCheckboxChange('acknowledgement')}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                <strong>I agree</strong> to cite "This work was carried out using the resources of the NEGCES Laboratory, [University Name]" in any publications or presentations resulting from this work.
              </Typography>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted.prohibitedUse}
                onChange={handleCheckboxChange('prohibitedUse')}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                <strong>I understand</strong> that commercial use and unauthorized data sharing are strictly prohibited.
              </Typography>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted.dataResponsibility}
                onChange={handleCheckboxChange('dataResponsibility')}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                <strong>I acknowledge</strong> that I am responsible for my own data backups and security measures.
              </Typography>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted.compliance}
                onChange={handleCheckboxChange('compliance')}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                <strong>I understand</strong> that my usage will be monitored for compliance, and violations may lead to suspension of privileges.
              </Typography>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />
        </FormGroup>
        
        {!areAllTermsAccepted() && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please accept all terms and conditions to proceed with your booking request.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        p: 2,
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        bgcolor: 'rgba(0, 0, 0, 0.02)',
        justifyContent: 'flex-end',
        gap: 1,
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{
            px: 3,
            py: 1,
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onAcceptAndSubmit}
          variant="contained"
          color="primary"
          disabled={!areAllTermsAccepted() || loading}
          sx={{
            px: 3,
            py: 1,
            fontWeight: 600,
          }}
        >
          {loading ? "Submitting..." : "Accept & Submit Booking"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

TermsAndConditionsDialog.displayName = 'TermsAndConditionsDialog';

export default TermsAndConditionsDialog;
export type { TermsAccepted };
