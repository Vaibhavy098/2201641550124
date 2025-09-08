import React, { useState } from 'react';
import { Box, Button, Alert, Typography } from '@mui/material';
import { BugReport as BugReportIcon } from '@mui/icons-material';
import urlService from '../services/urlService';
import { Logger } from '../services/logger.js';

const ClickTestComponent = ({ onStatsUpdate }) => {
  const [testResult, setTestResult] = useState(null);

  const runClickTest = () => {
    Logger.info('component', 'Running click recording test', 'assessment-token');
    
    try {
      // Get all URLs
      const urls = urlService.getAllUrls();
      
      if (urls.length === 0) {
        setTestResult({
          success: false,
          message: "No URLs found. Please create a short URL first to test click recording."
        });
        return;
      }

      // Get the first URL for testing
      const testUrl = urls[0];
      const beforeClicks = testUrl.totalClicks;

      // Record a test click
      const success = urlService.recordClick(
        testUrl.shortcode, 
        'test-button', 
        'Test Location'
      );

      if (success) {
        // Get updated data
        const updatedUrl = urlService.getUrlByShortcode(testUrl.shortcode);
        const afterClicks = updatedUrl.totalClicks;

        setTestResult({
          success: true,
          message: `Click recorded successfully! Clicks went from ${beforeClicks} to ${afterClicks} for shortcode: ${testUrl.shortcode}`
        });

        Logger.info('component', `Test click recorded: ${testUrl.shortcode}`, 'assessment-token');
        
        // Notify parent to update stats
        if (onStatsUpdate) {
          onStatsUpdate();
        }
      } else {
        setTestResult({
          success: false,
          message: "Failed to record test click"
        });
      }

    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`
      });
      Logger.error('component', `Click test failed: ${error.message}`, 'assessment-token');
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        startIcon={<BugReportIcon />}
        variant="outlined"
        onClick={runClickTest}
        size="small"
      >
        Test Click Recording
      </Button>
      
      {testResult && (
        <Alert 
          severity={testResult.success ? "success" : "error"} 
          sx={{ mt: 1 }}
          onClose={() => setTestResult(null)}
        >
          <Typography variant="body2">
            {testResult.message}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default ClickTestComponent;
