# URL Shortener

## 📁 Project Structure

```
URL Shortener/
├── LoggingMiddleware/
│   └── log.js                    # Reusable logging middleware
└── url-shortener/                # React URL Shortener Application
    ├── src/
    │   ├── services/
    │   │   ├── logger.js         # Logging middleware (copy)
    │   │   └── urlService.js     # URL management service
    │   ├── pages/
    │   │   ├── URLShortenerPage.js    # Main URL shortening interface
    │   │   ├── StatisticsPage.js      # Analytics and statistics
    │   │   └── RedirectPage.js        # Handles shortcode redirections
    │   └── App.js                # Main application with routing
    └── package.json
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd url-shortener
npm install
```

### 2. Start the Application
```bash
npm start
```

The application will be available at: **http://localhost:3000**

## 📋 Features Implemented

### ✅ Logging Middleware
- **Reusable logging function** with API calls to evaluation service
- **Comprehensive validation** for stack, level, package, and message fields
- **Frontend-focused** with proper package validation
- **Error handling** and fallback logging
- **Convenience methods** for different log levels (debug, info, warn, error, fatal)

### ✅ URL Shortener Application

#### Core Features:
- **Multi-URL Support**: Shorten up to 5 URLs concurrently
- **Custom Shortcodes**: Optional user-defined shortcodes with validation
- **Validity Periods**: Configurable expiry times (default: 30 minutes)
- **Client-side Storage**: URLs persist in localStorage
- **Comprehensive Validation**: URL format, shortcode format, validity checks

#### Pages:

1. **URL Shortener Page** (`/`)
   - Form to input up to 5 URLs simultaneously
   - Custom shortcode and validity options
   - Real-time validation and error handling
   - Success display with copy-to-clipboard functionality

2. **Statistics Page** (`/statistics`)
   - Overview dashboard with key metrics
   - Detailed table of all shortened URLs
   - Click analytics with timestamps and sources
   - Geographical location tracking (simplified)
   - Expandable rows for detailed click data

3. **Redirect Page** (`/:shortcode`)
   - Handles shortcode redirections
   - Click tracking with source and location
   - Security preview with countdown timer
   - User-friendly error handling for invalid/expired URLs

## 🎯 Technical Highlights

### Material-UI Implementation
- **Responsive design** with Mobile-first approach
- **Consistent theming** with primary/secondary colors
- **Accessibility** with proper ARIA labels and keyboard navigation
- **User experience** focused design with loading states and feedback

### Logging Integration
- **Extensive logging** throughout the application lifecycle
- **Contextual messages** for debugging and monitoring
- **Performance tracking** for user actions
- **Error logging** with detailed stack traces

### Data Management
- **Client-side URL storage** using localStorage
- **Automatic cleanup** of expired URLs
- **Statistics computation** for analytics dashboard
- **Real-time updates** across components

### Routing & Navigation
- **React Router** implementation for SPA navigation
- **Dynamic routing** for shortcode redirections
- **Navigation breadcrumbs** and tab interface
- **Deep linking** support for all pages

## 🔧 Configuration

### Default Settings
- **Base URL**: `http://localhost:3000`
- **Default Validity**: 30 minutes
- **Max Concurrent URLs**: 5
- **Logging Token**: `assessment-token` (configurable)
- **API Endpoint**: `http://20.244.56.144/evaluation-service/logs`

### Logging Validation
- **Stack**: `frontend` (for this assessment)
- **Levels**: `debug`, `info`, `warn`, `error`, `fatal`
- **Packages**: `api`, `component`, `hook`, `page`, `state`, `style`, `auth`, `config`, `middleware`, `utils`

## 📊 Usage Examples

### Creating Short URLs
1. Navigate to the home page
2. Enter up to 5 URLs in the form
3. Optionally specify custom shortcodes
4. Set validity periods (in minutes)
5. Click "Shorten URLs" to process

### Viewing Statistics
1. Navigate to the "Statistics" tab
2. View overview metrics in dashboard cards
3. Browse detailed URL table with click data
4. Expand rows to see individual click details
5. Use detail dialog for comprehensive URL information

### Using Short URLs
1. Copy shortened URLs from results
2. Share or access shortened URLs
3. View redirect preview page with security notice
4. Automatic redirect after 5-second countdown
5. Click analytics are automatically recorded

## 🛡️ Security Features

- **URL Validation**: Ensures only valid URLs are shortened
- **Shortcode Validation**: Alphanumeric restrictions with length limits  
- **Expiry Management**: Automatic cleanup of expired URLs
- **Redirect Preview**: Security notice before external redirections
- **Input Sanitization**: Client-side validation for all user inputs

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Visual feedback during async operations
- **Error Handling**: User-friendly error messages and recovery options
- **Copy-to-Clipboard**: Easy sharing of shortened URLs
- **Visual Feedback**: Success/error notifications and status indicators
- **Accessibility**: WCAG compliant with proper contrast and navigation

## 🔍 Monitoring & Analytics

All user interactions are logged through the custom logging middleware:
- Page navigation and component lifecycle events
- URL creation and validation processes  
- Click tracking with source and location data
- Error conditions and recovery actions
- Performance metrics for optimization
