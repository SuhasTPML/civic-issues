# Bengaluru Civic Issues Hub - Architecture Documentation

## Overview
A civic engagement platform that allows citizens to report and track civic issues in Bengaluru. The application features interactive maps, location-based search, and integration with OpenStreetMap and Overpass API for rich location data.

## Technology Stack

### Frontend
- **HTML5** - Semantic markup for structure
- **CSS3** - Custom styling with CSS variables and responsive design
- **Vanilla JavaScript (ES6+)** - No framework dependencies
- **Leaflet.js v1.7.1** - Interactive mapping library
- **Leaflet Control Geocoder** - Location search and geocoding
- **exifr** - GPS data extraction from images

### External APIs
- **OpenStreetMap** - Map tiles and base mapping data
- **Nominatim** - Geocoding service for address/location search
- **Overpass API** - Querying nearby POIs and geographic features

### Data Storage
- **localStorage** - Client-side storage for:
  - Civic issue drafts
  - Submitted issues (mock data)
  - User session data

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
├─────────────┬──────────────────┬────────────────────────────┤
│  Map View   │   List View      │   Report Issue Form        │
│  (Leaflet)  │   (Filters)      │   (Location Search)        │
└─────────────┴──────────────────┴────────────────────────────┘
       │              │                      │
       ▼              ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│              Application Core (main.js)                       │
├──────────────┬─────────────────┬─────────────────────────────┤
│ View Manager │  Issue Manager  │  Location Manager           │
│              │                 │  - Geocoding                │
│              │                 │  - Nearby Features Search   │
│              │                 │  - Map Interactions         │
└──────────────┴─────────────────┴─────────────────────────────┘
       │              │                      │
       ▼              ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│                   External Services                           │
├──────────────┬─────────────────┬─────────────────────────────┤
│ OpenStreetMap│  Nominatim      │  Overpass API               │
│ (Map Tiles)  │  (Geocoding)    │  (POI Data)                 │
└──────────────┴─────────────────┴─────────────────────────────┘
       │              │                      │
       └──────────────┴──────────────────────┘
                      ▼
              ┌───────────────┐
              │  localStorage │
              └───────────────┘
```

## Project Structure

```
Civic Issues/
├── src/
│   ├── index.html              # Main HTML file
│   ├── css/
│   │   └── style.css           # All application styles
│   └── js/
│       └── main.js             # All application logic
├── node_modules/               # Dependencies
├── package.json                # Project dependencies
├── server.js                   # Express development server
└── ARCHITECTURE.md            # This file
```

## Core Components

### 1. View Management System

#### Views
The application uses a single-page architecture with three main views:

- **Map View** (`#map-view`)
  - Interactive Leaflet map centered on Bengaluru (12.9716°N, 77.5946°E)
  - Displays civic issues as markers with category-specific icons
  - Popup information cards on marker click
  - Statistics display (total, published, resolved)

- **List View** (`#list-view`)
  - Filterable grid of issue cards
  - Filters: category, status, location (text search)
  - Responsive grid layout

- **Report Issue Form** (`#submit-view`)
  - Multi-field form for issue submission
  - Location search with autocomplete
  - Interactive map with draggable marker
  - Nearby features panel
  - Image upload with EXIF GPS extraction
  - Preview card before final submission

#### View Switching
```javascript
function showView(viewName)
```
- Hides all views, shows selected view
- Special handling for maps (invalidateSize)
- URL hash-based navigation (future enhancement)

### 2. Location Management System

#### Components

**a) Location Search Input**
- Real-time autocomplete with 300ms debounce
- Searches both:
  1. Nominatim geocoder (global search)
  2. Nearby features cache (local POI search)
- Minimum query length: 1 character
- Keyboard navigation support (Arrow keys, Enter, Escape)

**b) Geocoding Service**
```javascript
const geocoder = L.Control.Geocoder.nominatim()
```
- Nominatim-based geocoding
- Fallback timeout (5 seconds)
- Error handling for API failures

**c) Nearby Features System**
- Powered by Overpass API
- Auto-loads on page load (2km radius from city center)
- Updates on marker drag/map click (200m radius, debounced 500ms)
- Caches results (5-minute TTL, max 20 entries)

**Overpass Query Structure:**
```javascript
Query Types:
- amenity (restaurants, cafes, hospitals, etc.)
- shop (retail locations)
- tourism (attractions)
- leisure (parks, sports)
- healthcare (medical facilities)
- office (business locations)
- emergency (police, fire stations)
- public_transport (bus stops, metro stations)

Filters:
- Excludes: highways, buildings
- Radius: 200m-2000m (configurable)
- Limit: 30 results
```

**d) Interactive Map**
- Draggable marker for location selection
- Click-to-place marker
- Real-time coordinate display
- Auto-fetch nearby features on position change

**e) Nearby Features Panel**
- Floating sidebar on desktop
- Shows POIs near selected location
- Click to select feature
- Hover to highlight on map
- Distance calculation from marker
- Refresh button for manual updates

### 3. Issue Management System

#### Issue Data Model
```javascript
{
    id: string,              // Unique identifier
    category: string,        // Roads|Water|Waste|Power|Public Health|Others
    title: string,           // Max 100 chars
    description: string,     // Max 250 chars
    location: string,        // Coordinates "lat, lng"
    status: string,          // New|Verified|Published|Resolved
    createdAt: string,       // ISO timestamp
    image: string           // Image URL/blob
}
```

#### Form Handling
```javascript
function initFormHandling()
```
- Form validation (all fields required)
- Location validation (coordinates must be set)
- Image preview with file reader
- EXIF GPS data extraction
- Draft auto-save to localStorage
- Preview card generation

#### Image Processing
```javascript
exifr.gps(file)
```
- Extracts GPS coordinates from image EXIF data
- Auto-updates map marker location
- Auto-fills coordinate field
- Error handling for images without GPS

#### Issue Storage
- **Drafts**: `localStorage.civicIssueDrafts` (max 10)
- **Submitted**: `localStorage.civicIssues`
- **Mock Data**: Pre-populated for demo

### 4. Map Visualization

#### Main Map (Map View)
```javascript
window.mainMap = L.map('map').setView([12.9716, 77.5946], 12)
```
- Zoom level: 12 (city-wide view)
- Custom category-based markers
- Popup cards with issue details
- Dynamic marker icons based on category

#### Location Map (Form)
```javascript
locationMap = L.map('location-map').setView([12.9716, 77.5946], 13)
```
- Zoom level: 13 (neighborhood view)
- Draggable marker
- Click-to-place functionality
- Scroll wheel zoom disabled
- Nearby features overlay

#### Marker Categories & Icons
```javascript
Roads:         🚧 (red border)
Water:         💧 (blue border)
Waste:         🗑️ (purple border)
Power:         💡 (orange border)
Public Health: 🏥 (green border)
Others:        📍 (teal border)
```

### 5. Filtering & Search System

#### Category Filter
- Dropdown selection
- Filters by exact category match

#### Status Filter
- Dropdown selection
- Options: New, Verified, Published, Resolved

#### Location Filter
- Text input with real-time search
- Searches across:
  - Location field
  - Title field
  - Description field
- Case-insensitive partial matching

#### Filter Logic
```javascript
function filterIssues()
```
- Applies all active filters in sequence
- Re-renders issue list on change
- Maintains filter state during session

## Data Flow

### 1. Issue Submission Flow
```
User fills form
    ↓
Select location (via search/map/drag)
    ↓
Auto-fetch nearby features
    ↓
Upload image (optional GPS extraction)
    ↓
Form validation
    ↓
Create draft object
    ↓
Save to localStorage
    ↓
Show preview card
    ↓
[User clicks login]
    ↓
Submit to backend (future: API integration)
```

### 2. Location Search Flow
```
User types in search box (1+ chars)
    ↓
Debounce 300ms
    ↓
Parallel search:
    ├─ Nominatim geocoder (timeout: 5s)
    └─ Nearby features cache (instant)
    ↓
Combine results (nearby first)
    ↓
Render suggestions dropdown
    ↓
User selects suggestion
    ↓
Update marker position
    ↓
Update coordinates field
    ↓
Fetch nearby features for new location
```

### 3. Nearby Features Flow
```
Page load / Marker drag / Map click
    ↓
Debounce 500ms
    ↓
Check cache (5min TTL)
    ↓
If cached: return data
If not cached:
    ↓
    Build Overpass query
    ↓
    POST to Overpass API
    ↓
    Parse response
    ↓
    Filter (exclude roads/buildings)
    ↓
    Normalize data structure
    ↓
    Cache results
    ↓
Render in panel
    ↓
Update currentFeatures array (for search)
```

## State Management

### Global Variables
```javascript
// Map instances
window.mainMap          // Main map view
locationMap             // Form location map
locationMarker          // Draggable marker

// Location search
currentFeatures[]       // Nearby POIs cache
overpassCache           // Map<cacheKey, {data, timestamp}>
lastQuery               // {lat, lng, timestamp}

// UI state
selectedSuggestionIndex // Autocomplete navigation
selectedFeatureIndex    // Nearby features navigation
suggestionTimeout       // Debounce timer
fetchTimer             // Nearby fetch debounce
```

### localStorage Schema
```javascript
// Drafts
civicIssueDrafts: [
    {
        id: 'draft_timestamp',
        category, title, description,
        location, image, createdAt
    }
]

// Issues
civicIssues: [
    {
        id, category, title, description,
        location, status, createdAt, image
    }
]
```

## API Integration

### Nominatim Geocoder
- **Service**: Leaflet Control Geocoder with Nominatim backend
- **Rate Limit**: 1 request/second (enforced by debounce)
- **Timeout**: 5 seconds
- **Fallback**: Silent failure, shows nearby features only

### Overpass API
- **Endpoint**: `https://overpass-api.de/api/interpreter`
- **Method**: POST
- **Query Language**: Overpass QL
- **Timeout**: 25 seconds (API-side)
- **Rate Limit**: Self-throttled with cache
- **Response Format**: JSON with geometry

#### Query Parameters
```javascript
radius: 200-2000 (meters)
limit: 30 (results)
output: tags center
timeout: 25 (seconds)
```

### OpenStreetMap Tiles
- **URL Template**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Attribution**: Required by OSM license
- **Tile Size**: 256x256px
- **Zoom Levels**: 0-19

## Performance Optimizations

### 1. Caching Strategy
- **Overpass Results**: 5-minute TTL, 20-entry LRU cache
- **Geocoder**: Browser caches HTTP responses
- **Images**: localStorage for drafts (blob URLs)

### 2. Debouncing
- **Search Input**: 300ms delay
- **Marker Drag**: 500ms delay
- **Prevents**: API spam, UI thrashing

### 3. Lazy Loading
- **Maps**: Only initialize when view becomes active
- **Nearby Features**: Load on-demand (not on every keystroke)
- **Images**: Preview generation only on file select

### 4. Event Delegation
- Suggestions list uses single listener on container
- Nearby features list uses event delegation
- Reduces memory footprint

## Responsive Design

### Breakpoint
```css
@media (max-width: 768px)
```

### Mobile Adaptations
- **Header**: Stack vertically
- **Navigation**: Vertical menu
- **Filters**: Full-width, stacked
- **Issue Grid**: Single column
- **Location Map**: Full width (100%)
- **Nearby Panel**: Below map (static position)
- **Forms**: Touch-friendly input sizes

## Security Considerations

### Current Implementation
- ⚠️ **Client-side only** - No server validation
- ⚠️ **No authentication** - Mock SSO placeholder
- ⚠️ **No data persistence** - localStorage only
- ⚠️ **No input sanitization** - XSS vulnerable
- ⚠️ **No rate limiting** - API abuse possible

### Production Requirements
- [ ] Server-side validation
- [ ] SSO integration (OAuth/SAML)
- [ ] Database persistence
- [ ] Input sanitization (DOMPurify)
- [ ] API rate limiting
- [ ] CSRF protection
- [ ] Content Security Policy
- [ ] Image validation & scanning
- [ ] Coordinate bounds validation

## Accessibility

### Current Features
- Semantic HTML5 elements
- Keyboard navigation for autocomplete
- Focus states on interactive elements
- Alt text on images (form preview)
- ARIA labels (future enhancement)

### Improvements Needed
- [ ] Screen reader announcements
- [ ] ARIA landmarks
- [ ] Focus trap in modals
- [ ] Keyboard-only map navigation
- [ ] Color contrast validation
- [ ] Skip navigation links

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- ES6 (arrow functions, promises, async/await)
- CSS Grid & Flexbox
- localStorage API
- Fetch API
- File API
- Geolocation API (optional)

### Polyfills Needed for IE11
- Promise
- Fetch
- Object.assign
- Array.from
- URLSearchParams

## Future Enhancements

### Planned Features
1. **Backend Integration**
   - RESTful API for issue CRUD
   - Real SSO authentication
   - Database persistence
   - Admin dashboard

2. **Advanced Search**
   - Date range filtering
   - Radius-based search
   - Multi-category selection
   - Saved searches

3. **User Features**
   - User profiles
   - Issue tracking
   - Email notifications
   - Upvoting/comments

4. **Map Enhancements**
   - Clustering for dense areas
   - Heat maps
   - Custom map styles
   - Route planning

5. **Analytics**
   - Issue trends
   - Response time tracking
   - Geographic hotspots
   - Resolution metrics

## Development Setup

### Prerequisites
```bash
Node.js 14+
npm 6+
```

### Installation
```bash
npm install
```

### Running Development Server
```bash
npm start
# Server runs on http://localhost:3001
```

### Dependencies
```json
{
  "express": "^4.x",
  "nodemon": "^3.x"
}
```

## Testing Strategy

### Current Status
⚠️ No automated tests implemented

### Recommended Testing
1. **Unit Tests** (Jest)
   - Form validation
   - Filter logic
   - Data transformations

2. **Integration Tests** (Cypress)
   - View switching
   - Form submission flow
   - Map interactions

3. **E2E Tests** (Playwright)
   - Complete user journeys
   - Cross-browser testing

4. **API Tests** (Postman/Jest)
   - Overpass query validation
   - Geocoder response handling

## Deployment

### Production Build
```bash
# No build step currently
# Static files served directly
```

### Hosting Options
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront

### Environment Variables
```javascript
// Future: .env file
NOMINATIM_API_KEY=xxx
OVERPASS_API_URL=xxx
BACKEND_API_URL=xxx
```

## Contributing Guidelines

### Code Style
- Use ES6+ features
- 4-space indentation
- Semicolons required
- Single quotes for strings
- Descriptive variable names

### Commit Convention
```
type: description

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: feat, fix, docs, style, refactor, test, chore

## License
[To be determined]

## Credits
- **Maps**: OpenStreetMap contributors
- **Geocoding**: Nominatim
- **POI Data**: Overpass API
- **Map Library**: Leaflet.js
- **Fonts**: Google Fonts (Playfair Display, Roboto Slab)

---

**Last Updated**: 2025-01-07
**Version**: 1.0.0
**Status**: MVP Development
