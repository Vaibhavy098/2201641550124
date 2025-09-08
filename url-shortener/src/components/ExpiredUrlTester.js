import React, { useState } from 'react';
import { Box, Button, Alert, Typography, TextField, Grid } from '@mui/material';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import urlService from '../services/urlService';
import { Logger } from '../services/logger.js';

const ExpiredUrlTester = ({ onUrlCreated }) => {
  const [testUrl, setTestUrl] = useState('https://example.com');
  const [expirySeconds, setExpirySeconds] = useState(10);
  const [result, setResult] = useState(null);

  const createTestUrl = () => {
    Logger.info('component', 'Creating test URL with short expiry', 'assessment-token');
    
    try {
      // Convert seconds to minutes (minimum 1 minute for the service)
      const validityMinutes = Math.max(1, Math.floor(expirySeconds / 60));
      
      const urlData = urlService.createShortUrl(
        testUrl, 
        null, // auto-generate shortcode
        validityMinutes === 0 ? 0.1 : validityMinutes // Use 0.1 minutes (6 seconds) for very short URLs
      );

      setResult({
        success: true,
        message: `Test URL created: ${urlData.shortcode} (expires in ${validityMinutes || 0.1} minutes)`,
        urlData
      });

      Logger.info('component', `Test URL created: ${urlData.shortcode}`, 'assessment-token');
      
      // Notify parent
      if (onUrlCreated) {
        onUrlCreated();
      }

    } catch (error) {
      setResult({
        success: false,
        message: `Failed to create test URL: ${error.message}`
      });
      Logger.error('component', `Failed to create test URL: ${error.message}`, 'assessment-token');
    }
  };

  return (
    <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        🧪 Create Test URL with Short Expiry
      </Typography>
      
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Test URL"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            size="small"
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Expiry (seconds)"
            type="number"
            value={expirySeconds}
            onChange={(e) => setExpirySeconds(parseInt(e.target.value) || 10)}
            size="small"
            inputProps={{ min: 1, max: 300 }}
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Button
            startIcon={<AccessTimeIcon />}
            variant="contained"
            onClick={createTestUrl}
            fullWidth
            size="small"
            color="secondary"
          >
            Create Test URL
          </Button>
        </Grid>
      </Grid>

      {result && (
        <Alert 
          severity={result.success ? "success" : "error"} 
          onClose={() => setResult(null)}
        >
          <Typography variant="body2">
            {result.message}
          </Typography>
          {result.success && result.urlData && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" display="block">
                Short URL: <strong>{result.urlData.shortUrl}</strong>
              </Typography>
              <Typography variant="caption" display="block">
                Expires: <strong>{new Date(result.urlData.expiresAt).toLocaleString()}</strong>
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      <Typography variant="caption" color="textSecondary">
        This creates URLs that expire quickly so you can test the expired URL functionality.
        Wait for the expiry time, then check the Statistics page to see expired URLs.
      </Typography>
    </Box>
  );
};

export default ExpiredUrlTester;
