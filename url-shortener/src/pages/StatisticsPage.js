import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Button,
  Collapse,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Link as LinkIcon,
  LocationOn as LocationOnIcon,
  Source as SourceIcon
} from '@mui/icons-material';

import urlService from '../services/urlService';
import { Logger } from '../services/logger.js';

const StatisticsPage = () => {
  const [urls, setUrls] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    Logger.info('page', 'Statistics page loaded', 'assessment-token');
    loadStatistics();
  }, []);

  // Auto-refresh statistics when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        Logger.debug('page', 'Page became visible, refreshing statistics', 'assessment-token');
        loadStatistics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-refresh every 10 seconds when page is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        Logger.debug('page', 'Auto-refreshing statistics', 'assessment-token');
        loadStatistics();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Load URL statistics
  const loadStatistics = async () => {
    setLoading(true);
    Logger.debug('page', 'Loading URL statistics', 'assessment-token');
    
    try {
      // Get all URLs WITHOUT cleaning up expired ones
      // This allows users to see expired URLs in the statistics
      const allUrls = urlService.getAllUrls();
      const stats = urlService.getStatistics();
      
      // Sort URLs by creation date (newest first)
      const sortedUrls = allUrls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setUrls(sortedUrls);
      setStatistics(stats);
      
      Logger.info('page', `Loaded ${allUrls.length} URLs and statistics`, 'assessment-token');
    } catch (error) {
      Logger.error('page', `Failed to load statistics: ${error.message}`, 'assessment-token');
    } finally {
      setLoading(false);
    }
  };

  // Manual cleanup function for expired URLs
  const cleanupExpiredUrls = async () => {
    Logger.info('page', 'Manually cleaning up expired URLs', 'assessment-token');
    const cleanedCount = urlService.cleanupExpiredUrls();
    if (cleanedCount > 0) {
      Logger.info('page', `Cleaned ${cleanedCount} expired URLs`, 'assessment-token');
      // Reload statistics after cleanup
      await loadStatistics();
    }
  };

  // Toggle expanded row for click details
  const toggleExpandedRow = (urlId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(urlId)) {
      newExpandedRows.delete(urlId);
    } else {
      newExpandedRows.add(urlId);
    }
    setExpandedRows(newExpandedRows);
    Logger.debug('page', `Toggled row expansion for URL: ${urlId}`, 'assessment-token');
  };

  // Open detail dialog
  const openDetailDialog = (url) => {
    setSelectedUrl(url);
    setDetailDialogOpen(true);
    Logger.debug('page', `Opened detail dialog for URL: ${url.shortcode}`, 'assessment-token');
  };

  // Copy URL to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      Logger.debug('page', `Copied to clipboard: ${text}`, 'assessment-token');
    } catch (error) {
      Logger.error('page', `Failed to copy to clipboard: ${error.message}`, 'assessment-token');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status chip for URL
  const getStatusChip = (url) => {
    const now = new Date();
    const expiresAt = new Date(url.expiresAt);
    
    if (expiresAt <= now) {
      return <Chip label="Expired" color="error" size="small" />;
    } else {
      const timeLeft = expiresAt - now;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hoursLeft > 0) {
        return <Chip label={`Active (${hoursLeft}h ${minutesLeft}m left)`} color="success" size="small" />;
      } else {
        return <Chip label={`Active (${minutesLeft}m left)`} color="warning" size="small" />;
      }
    }
  };

  // Render click details for expanded row
  const renderClickDetails = (clicks) => {
    if (clicks.length === 0) {
      return (
        <Alert severity="info">
          No clicks recorded for this URL yet.
        </Alert>
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Click Details ({clicks.length} total)
        </Typography>
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clicks.slice(0, 10).map((click, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(click.timestamp)}</TableCell>
                  <TableCell>
                    <Chip label={click.source} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{click.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {clicks.length > 10 && (
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Showing first 10 of {clicks.length} clicks
              </Typography>
            </Box>
          )}
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            URL Statistics
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View analytics and click data for all your shortened URLs. Auto-refreshes every 10 seconds.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadStatistics}
            variant="contained"
            disabled={loading}
            size="large"
          >
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </Button>
          <Button
            onClick={cleanupExpiredUrls}
            variant="outlined"
            disabled={loading}
            color="error"
          >
            Clean Expired
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}


      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <LinkIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total URLs
                  </Typography>
                  <Typography variant="h4">
                    {statistics.totalUrls || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ScheduleIcon color="success" />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active URLs
                  </Typography>
                  <Typography variant="h4">
                    {statistics.activeUrls || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUpIcon color="secondary" />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Clicks
                  </Typography>
                  <Typography variant="h4">
                    {statistics.totalClicks || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ScheduleIcon color="error" />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Expired URLs
                  </Typography>
                  <Typography variant="h4">
                    {statistics.expiredUrls || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* URLs Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Short URL</TableCell>
                <TableCell>Original URL</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Clicks</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {urls.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Alert severity="info">
                      No URLs found. Create some shortened URLs to see statistics here.
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                urls.map((url) => (
                  <React.Fragment key={url.id}>
                    <TableRow hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            /{url.shortcode}
                          </Typography>
                          <Tooltip title="Copy short URL">
                            <IconButton 
                              size="small" 
                              onClick={() => copyToClipboard(url.shortUrl)}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Tooltip title={url.originalUrl}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 200, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {url.originalUrl}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusChip(url)}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(url.createdAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(url.expiresAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={url.totalClicks}
                          color={url.totalClicks > 0 ? "primary" : "default"}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View details">
                            <IconButton 
                              size="small" 
                              onClick={() => openDetailDialog(url)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={expandedRows.has(url.id) ? "Hide clicks" : "Show clicks"}>
                            <IconButton 
                              size="small" 
                              onClick={() => toggleExpandedRow(url.id)}
                              disabled={url.totalClicks === 0}
                            >
                              {expandedRows.has(url.id) ? 
                                <ExpandLessIcon fontSize="small" /> : 
                                <ExpandMoreIcon fontSize="small" />
                              }
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded row for click details */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={expandedRows.has(url.id)} timeout="auto" unmountOnExit>
                          {renderClickDetails(url.clicks)}
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          URL Details: /{selectedUrl?.shortcode}
        </DialogTitle>
        <DialogContent>
          {selectedUrl && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Original URL:</Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {selectedUrl.originalUrl}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Short URL:</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedUrl.shortUrl}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(selectedUrl.shortUrl)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Status:</Typography>
                  {getStatusChip(selectedUrl)}
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Created:</Typography>
                  <Typography variant="body2">{formatDate(selectedUrl.createdAt)}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Expires:</Typography>
                  <Typography variant="body2">{formatDate(selectedUrl.expiresAt)}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Validity:</Typography>
                  <Typography variant="body2">{selectedUrl.validityMinutes} minutes</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>Total Clicks:</Typography>
                  <Typography variant="body2">{selectedUrl.totalClicks}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Click History */}
              <Typography variant="h6" gutterBottom>
                Click History
              </Typography>
              {selectedUrl.clicks.length === 0 ? (
                <Alert severity="info">
                  No clicks recorded yet.
                </Alert>
              ) : (
                <List>
                  {selectedUrl.clicks.slice(0, 20).map((click, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="body2">
                              {formatDate(click.timestamp)}
                            </Typography>
                            <Chip label={click.source} size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOnIcon fontSize="small" />
                            <Typography variant="body2">{click.location}</Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                  {selectedUrl.clicks.length > 20 && (
                    <ListItem>
                      <ListItemText>
                        <Typography variant="body2" color="textSecondary" align="center">
                          ... and {selectedUrl.clicks.length - 20} more clicks
                        </Typography>
                      </ListItemText>
                    </ListItem>
                  )}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StatisticsPage;
