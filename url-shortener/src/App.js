import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useLocation, useNavigate } from 'react-router-dom';

import URLShortenerPage from './pages/URLShortenerPage';
import StatisticsPage from './pages/StatisticsPage';
import RedirectPage from './pages/RedirectPage';
import { Logger } from './services/logger.js';
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function NavigationTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleChange = (event, newValue) => {
    navigate(newValue);
    Logger.debug('component', `Navigation changed to: ${newValue}`, 'assessment-token');
  };

  if (location.pathname !== '/' && location.pathname !== '/statistics') {
    return null;
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs 
        value={location.pathname === '/statistics' ? '/statistics' : '/'} 
        onChange={handleChange}
        aria-label="URL Shortener Navigation"
        centered
      >
        <Tab label="URL Shortener" value="/" />
        <Tab label="Statistics" value="/statistics" />
      </Tabs>
    </Box>
  );
}

function App() {
  useEffect(() => {
    Logger.info('component', 'URL Shortener App initialized', 'assessment-token');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <AppBar position="static" elevation={0}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                🔗 URL Shortener
              </Typography>
            </Toolbar>
          </AppBar>

          <NavigationTabs />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              <Route path="/" element={<URLShortenerPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/:shortcode" element={<RedirectPage />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
