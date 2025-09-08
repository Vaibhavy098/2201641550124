import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Launch as LaunchIcon,
  ContentCopy as ContentCopyIcon,
  Home as HomeIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import urlService from '../services/urlService';
import { Logger } from '../services/logger.js';

const RedirectPage = () => {
  const { shortcode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [urlData, setUrlData] = useState(null);
  const [error, setError] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    Logger.info('page', `Redirect page loaded for shortcode: ${shortcode}`, 'assessment-token');
    handleRedirect();
  }, [shortcode]);

  useEffect(() => {
    let timer;
    if (urlData && autoRedirect && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (urlData && autoRedirect && redirectCountdown === 0) {
      performRedirect();
    }
    
    return () => clearTimeout(timer);
  }, [urlData, autoRedirect, redirectCountdown]);

  const handleRedirect = async () => {
    setLoading(true);
    Logger.debug('page', `Processing redirect for shortcode: ${shortcode}`, 'assessment-token');

    try {
      const data = urlService.getUrlByShortcode(shortcode);
      
      if (!data) {
        const rawUrls = JSON.parse(localStorage.getItem('shortenedUrls') || '{}');
        const rawUrl = rawUrls[shortcode];
        
        if (rawUrl && new Date() > new Date(rawUrl.expiresAt)) {
          const errorMsg = `Short URL '${shortcode}' has expired on ${new Date(rawUrl.expiresAt).toLocaleString()}`;
          setError(errorMsg);
          Logger.warn('page', `Expired URL accessed: ${shortcode}`, 'assessment-token');
        } else {
          const errorMsg = 'Short URL not found';
          setError(errorMsg);
          Logger.warn('page', `URL not found: ${shortcode}`, 'assessment-token');
        }
        setLoading(false);
        return;
      }

      const location = await getUserLocation();
      const clickSource = getClickSource();
      const clickRecorded = urlService.recordClick(
        shortcode, 
        clickSource,
        location
      );
      
      if (clickRecorded) {
        Logger.info('page', `Click recorded for shortcode: ${shortcode}`, 'assessment-token');
        console.log(`✅ Click recorded:`, {
          shortcode,
          source: clickSource,
          location,
          timestamp: new Date().toISOString(),
          newClickCount: data.totalClicks + 1
        });
      } else {
        console.error(`❌ Failed to record click for shortcode: ${shortcode}`);
      }

      setUrlData(data);
      setLoading(false);
      
    } catch (error) {
      const errorMsg = `Failed to process redirect: ${error.message}`;
      setError(errorMsg);
      Logger.error('page', errorMsg, 'assessment-token');
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;
      
      const locationMap = {
        'America/New_York': 'New York, US',
        'America/Los_Angeles': 'Los Angeles, US',
        'America/Chicago': 'Chicago, US',
        'Europe/London': 'London, UK',
        'Europe/Paris': 'Paris, France',
        'Asia/Tokyo': 'Tokyo, Japan',
        'Asia/Shanghai': 'Shanghai, China',
        'Asia/Kolkata': 'Mumbai, India',
        'Australia/Sydney': 'Sydney, Australia'
      };

      return locationMap[timezone] || `${timezone} (${language})`;
    } catch (error) {
      Logger.warn('page', `Failed to determine location: ${error.message}`, 'assessment-token');
      return 'Unknown Location';
    }
  };

  // Get click source
  const getClickSource = () => {
    // Determine source of click
    const referrer = document.referrer;
    const currentHost = window.location.host;
    
    if (!referrer) {
      return 'direct';
    }
    
    try {
      const referrerUrl = new URL(referrer);
      const referrerHost = referrerUrl.host;
      
      if (referrerHost === currentHost) {
        return 'internal'; // From within the app (statistics page)
      } else if (referrerHost.includes('google')) {
        return 'google';
      } else if (referrerHost.includes('facebook')) {
        return 'facebook';
      } else if (referrerHost.includes('twitter')) {
        return 'twitter';
      } else {
        return referrerHost;
      }
    } catch {
      return 'direct';
    }
  };

  // Perform the actual redirect
  const performRedirect = () => {
    Logger.info('page', `Redirecting to: ${urlData.originalUrl}`, 'assessment-token');
    window.location.href = urlData.originalUrl;
  };

  // Copy URL to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      Logger.debug('page', `Copied URL to clipboard: ${text}`, 'assessment-token');
    } catch (error) {
      Logger.error('page', `Failed to copy URL: ${error.message}`, 'assessment-token');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Processing redirect...
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Shortcode: /{shortcode}
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          URL Not Found
        </Typography>
        <Alert severity="error" sx={{ mb: 3, maxWidth: 500 }}>
          {error}
        </Alert>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<HomeIcon />}
            variant="contained"
            onClick={() => navigate('/')}
          >
            Create New URL
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/statistics')}
          >
            View Statistics
          </Button>
        </Box>
      </Box>
    );
  }

  // Success state with redirect information
  return (
    <Box>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        {/* Redirect Information Card */}
        <Card elevation={3} sx={{ maxWidth: 600, width: '100%', mb: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              🔗 Redirecting...
            </Typography>
            
            <Typography variant="body1" color="textSecondary" paragraph>
              You're being redirected to your destination URL
            </Typography>

            {/* Auto redirect countdown */}
            {autoRedirect && (
              <Box sx={{ mb: 3 }}>
                <CircularProgress 
                  variant="determinate" 
                  value={(5 - redirectCountdown) * 20} 
                  size={60}
                />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Redirecting in {redirectCountdown} seconds
                </Typography>
              </Box>
            )}

            {/* URL Information */}
            <Box sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Short URL:
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', flex: 1 }}>
                  {urlData.shortUrl}
                </Typography>
                <Tooltip title="Copy short URL">
                  <IconButton onClick={() => copyToClipboard(urlData.shortUrl)}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Destination:
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    wordBreak: 'break-all',
                    flex: 1,
                    maxHeight: 100,
                    overflow: 'auto'
                  }}
                >
                  {urlData.originalUrl}
                </Typography>
                <Tooltip title="Copy destination URL">
                  <IconButton onClick={() => copyToClipboard(urlData.originalUrl)}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* URL Metadata */}
              <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center" mb={2}>
                <Chip 
                  icon={<ScheduleIcon />}
                  label={`Created: ${formatDate(urlData.createdAt)}`}
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  icon={<ScheduleIcon />}
                  label={`Expires: ${formatDate(urlData.expiresAt)}`}
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  label={`${urlData.totalClicks + 1} clicks`}
                  color="primary"
                  size="small"
                />
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
              <Button
                startIcon={<LaunchIcon />}
                variant="contained"
                size="large"
                onClick={performRedirect}
              >
                Continue Now
              </Button>
              <Button
                variant="outlined"
                onClick={() => setAutoRedirect(false)}
                disabled={!autoRedirect}
              >
                Cancel Auto-redirect
              </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button
                startIcon={<HomeIcon />}
                variant="text"
                onClick={() => navigate('/')}
              >
                Create Another URL
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Alert severity="info" sx={{ maxWidth: 600 }}>
          <Typography variant="body2">
            <strong>Security Notice:</strong> Always verify that the destination URL is safe before proceeding. 
            This redirect page allows you to see where you're being taken.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default RedirectPage;
