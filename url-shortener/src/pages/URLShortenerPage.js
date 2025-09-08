import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

import urlService from '../services/urlService';
import { Logger } from '../services/logger.js';

const URLShortenerPage = () => {
  const [urlInputs, setUrlInputs] = useState([
    { id: 1, originalUrl: '', shortcode: '', validity: '', loading: false, result: null }
  ]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [copiedUrls, setCopiedUrls] = useState(new Set());

  useEffect(() => {
    Logger.info('page', 'URL Shortener page loaded', 'assessment-token');
  }, []);

  const addUrlInput = () => {
    if (urlInputs.length < 5) {
      const newInput = {
        id: Date.now(),
        originalUrl: '',
        shortcode: '',
        validity: '',
        loading: false,
        result: null
      };
      setUrlInputs([...urlInputs, newInput]);
      Logger.debug('page', `Added new URL input row. Total: ${urlInputs.length + 1}`, 'assessment-token');
    }
  };

  const removeUrlInput = (id) => {
    if (urlInputs.length > 1) {
      setUrlInputs(urlInputs.filter(input => input.id !== id));
      Logger.debug('page', `Removed URL input row. Total: ${urlInputs.length - 1}`, 'assessment-token');
    }
  };

  const updateUrlInput = (id, field, value) => {
    setUrlInputs(urlInputs.map(input =>
      input.id === id ? { ...input, [field]: value } : input
    ));
  };

  // Validate single URL input
  const validateUrlInput = (input) => {
    const errors = [];

    // Validate URL format
    if (!input.originalUrl.trim()) {
      errors.push('URL is required');
    } else {
      try {
        new URL(input.originalUrl);
      } catch {
        errors.push('Invalid URL format');
      }
    }

    // Validate shortcode if provided
    if (input.shortcode && !/^[a-zA-Z0-9]{1,10}$/.test(input.shortcode)) {
      errors.push('Shortcode must be alphanumeric and 1-10 characters long');
    }

    // Validate validity if provided
    if (input.validity && (isNaN(input.validity) || parseInt(input.validity) <= 0)) {
      errors.push('Validity must be a positive number (minutes)');
    }

    return errors;
  };

  // Shorten a single URL
  const shortenSingleUrl = async (input) => {
    const errors = validateUrlInput(input);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const validityMinutes = input.validity ? parseInt(input.validity) : 30;
    const customShortcode = input.shortcode.trim() || null;

    Logger.info('page', `Attempting to shorten URL: ${input.originalUrl}`, 'assessment-token');
    
    return urlService.createShortUrl(input.originalUrl, customShortcode, validityMinutes);
  };

  // Handle shortening all valid URLs
  const handleShortenUrls = async () => {
    const validInputs = urlInputs.filter(input => input.originalUrl.trim());
    
    if (validInputs.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please enter at least one URL to shorten',
        severity: 'warning'
      });
      return;
    }

    Logger.info('page', `Starting to shorten ${validInputs.length} URLs`, 'assessment-token');

    // Set loading state for all inputs being processed
    setUrlInputs(currentInputs => 
      currentInputs.map(input => 
        validInputs.some(v => v.id === input.id) 
          ? { ...input, loading: true, result: null }
          : input
      )
    );

    let successCount = 0;
    let errorCount = 0;

    // Process each URL
    for (const input of validInputs) {
      try {
        const result = await shortenSingleUrl(input);
        
        // Update the specific input with result
        setUrlInputs(currentInputs =>
          currentInputs.map(currentInput =>
            currentInput.id === input.id
              ? { ...currentInput, loading: false, result, error: null }
              : currentInput
          )
        );
        
        successCount++;
        Logger.info('page', `Successfully shortened URL: ${result.shortcode}`, 'assessment-token');
        
      } catch (error) {
        // Update the specific input with error
        setUrlInputs(currentInputs =>
          currentInputs.map(currentInput =>
            currentInput.id === input.id
              ? { ...currentInput, loading: false, result: null, error: error.message }
              : currentInput
          )
        );
        
        errorCount++;
        Logger.error('page', `Failed to shorten URL: ${error.message}`, 'assessment-token');
      }
    }

    // Show summary message
    if (successCount > 0 && errorCount === 0) {
      setSnackbar({
        open: true,
        message: `Successfully shortened ${successCount} URL${successCount > 1 ? 's' : ''}!`,
        severity: 'success'
      });
    } else if (successCount > 0 && errorCount > 0) {
      setSnackbar({
        open: true,
        message: `${successCount} URL(s) shortened successfully, ${errorCount} failed.`,
        severity: 'warning'
      });
    } else {
      setSnackbar({
        open: true,
        message: `Failed to shorten ${errorCount} URL(s). Please check your inputs.`,
        severity: 'error'
      });
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = async (url, urlId) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrls(prev => new Set([...prev, urlId]));
      setTimeout(() => {
        setCopiedUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(urlId);
          return newSet;
        });
      }, 2000);
      
      Logger.debug('page', `Copied URL to clipboard: ${url}`, 'assessment-token');
    } catch (error) {
      Logger.error('page', `Failed to copy URL: ${error.message}`, 'assessment-token');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        URL Shortener
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Create up to 5 shortened URLs at once. Customize shortcodes and set validity periods as needed.
      </Typography>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Enter URLs to Shorten
        </Typography>
        
        {urlInputs.map((input, index) => (
          <Card key={input.id} elevation={1} sx={{ mb: 2, bgcolor: input.result ? 'success.light' : 'background.paper' }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={`URL ${index + 1}`}
                    placeholder="https://example.com"
                    value={input.originalUrl}
                    onChange={(e) => updateUrlInput(input.id, 'originalUrl', e.target.value)}
                    disabled={input.loading}
                    error={!!input.error}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Custom Shortcode (Optional)"
                    placeholder="abc123"
                    value={input.shortcode}
                    onChange={(e) => updateUrlInput(input.id, 'shortcode', e.target.value)}
                    disabled={input.loading}
                    helperText="Alphanumeric, 1-10 chars"
                  />
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Validity (mins)"
                    type="number"
                    placeholder="30"
                    value={input.validity}
                    onChange={(e) => updateUrlInput(input.id, 'validity', e.target.value)}
                    disabled={input.loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScheduleIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={1}>
                  <Tooltip title="Remove URL">
                    <IconButton 
                      onClick={() => removeUrlInput(input.id)}
                      disabled={urlInputs.length <= 1 || input.loading}
                      color="error"
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>

              {input.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {input.error}
                </Alert>
              )}
              {input.result && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Short URL:
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                          {input.result.shortUrl}
                        </Typography>
                        <Tooltip title={copiedUrls.has(input.result.id) ? "Copied!" : "Copy URL"}>
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(input.result.shortUrl, input.result.id)}
                            color={copiedUrls.has(input.result.id) ? "success" : "primary"}
                          >
                            {copiedUrls.has(input.result.id) ? <CheckCircleIcon /> : <ContentCopyIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">
                        Expires:
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(input.result.expiresAt)}
                      </Typography>
                      <Chip 
                        label={`${input.result.validityMinutes} minutes`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}

        <Box display="flex" gap={2} justifyContent="space-between" mt={2}>
          <Button
            startIcon={<AddIcon />}
            onClick={addUrlInput}
            disabled={urlInputs.length >= 5}
            variant="outlined"
          >
            Add URL ({urlInputs.length}/5)
          </Button>
          
          <Button
            variant="contained"
            onClick={handleShortenUrls}
            disabled={urlInputs.some(input => input.loading)}
            size="large"
          >
            {urlInputs.some(input => input.loading) ? 'Processing...' : 'Shorten URLs'}
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default URLShortenerPage;
