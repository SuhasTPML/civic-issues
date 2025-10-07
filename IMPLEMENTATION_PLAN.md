# Full-City Search UX - Implementation Plan

## Overview
Enhance the location search to provide a seamless, city-wide search experience for Bengaluru with improved performance, better UX, and API compliance.

## Goals
1. Enable searching across entire Bengaluru (not just nearby features)
2. Provide fast, relevant suggestions with proper scoping
3. Improve map and panel synchronization
4. Add graceful fallbacks and error handling
5. Implement backend proxy for API compliance
6. Enhance keyboard and touch interactions
7. Add search history and shortcuts

---

## Phase 1: Scope Nominatim to Bengaluru

### Changes Required

#### 1.1 Update Geocoder Configuration
**File**: `src/js/main.js:430-435`

**Current**:
```javascript
const geocoder = L.Control.Geocoder.nominatim();
```

**New**:
```javascript
const geocoder = L.Control.Geocoder.nominatim({
    geocodingQueryParams: {
        // Bengaluru bounding box
        viewbox: '77.4602,12.8349,77.7845,13.1439', // SW_lng,SW_lat,NE_lng,NE_lat
        bounded: 1, // Restrict results to viewbox
        countrycodes: 'in', // Restrict to India
        addressdetails: 1, // Get detailed address info
        limit: 10 // Max results per query
    }
});
```

#### 1.2 Increase Input Threshold
**File**: `src/js/main.js:512`

**Current**:
```javascript
if (query.length < 1) {
```

**New**:
```javascript
if (query.length < 3) { // Require minimum 3 characters
    hideSuggestions();
    selectedSuggestionIndex = -1;
    return;
}
```

#### 1.3 Add Loading State
**File**: `src/index.html:92`

**Add after suggestions container**:
```html
<div id="location-suggestions" class="location-suggestions"></div>
<div id="search-status" class="search-status hidden"></div>
```

**File**: `src/js/main.js:519` (in timeout callback)

**Add**:
```javascript
suggestionTimeout = setTimeout(() => {
    // Show loading state
    document.getElementById('search-status').textContent = 'Searching Bengaluru...';
    document.getElementById('search-status').classList.remove('hidden');

    console.log('Timeout fired, starting geocode for:', query);
    // ... rest of code
});
```

#### 1.4 Add "No Results" Messaging
**File**: `src/js/main.js:451` (in renderSuggestions)

**Update**:
```javascript
function renderSuggestions(results) {
    // Hide loading
    document.getElementById('search-status').classList.add('hidden');

    if (!results || results.length === 0) {
        suggestionsContainer.innerHTML = `
            <div class="no-results">
                <p>No locations found.</p>
                <p class="suggestion-hint">Try 'BTM Layout', 'Koramangala', or drop a pin on the map.</p>
            </div>
        `;
        suggestionsContainer.classList.add('show');
        return;
    }

    // ... rest of rendering code
}
```

**File**: `src/css/style.css` (add styles)

```css
.search-status {
    padding: 8px 12px;
    font-size: 0.9rem;
    color: var(--secondary-color);
    background: #f0f9ff;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    margin-top: 5px;
}

.no-results {
    padding: 15px;
    text-align: center;
}

.no-results p {
    margin: 5px 0;
    color: var(--secondary-color);
}

.suggestion-hint {
    font-size: 0.85rem;
    font-style: italic;
}
```

---

## Phase 2: Cancel Stale Lookups

### Changes Required

#### 2.1 Add AbortController
**File**: `src/js/main.js:430` (at initLocationMap top)

**Add**:
```javascript
// Variable to store current nearby features for searching
let currentFeatures = [];
let currentSearchAbort = null; // Add abort controller
```

#### 2.2 Implement Abortable Fetch
**File**: `src/js/main.js:519-555`

**Replace Promise.all with abortable version**:
```javascript
suggestionTimeout = setTimeout(() => {
    // Cancel previous search if still running
    if (currentSearchAbort) {
        currentSearchAbort.abort();
    }

    // Create new abort controller
    currentSearchAbort = new AbortController();
    const signal = currentSearchAbort.signal;

    // Show loading state
    document.getElementById('search-status').textContent = 'Searching Bengaluru...';
    document.getElementById('search-status').classList.remove('hidden');

    console.log('Timeout fired, starting geocode for:', query);

    // Run both geocoder search and nearby features search
    Promise.race([
        Promise.all([
            new Promise((resolve, reject) => {
                if (signal.aborted) {
                    reject(new DOMException('Aborted', 'AbortError'));
                    return;
                }

                console.log('Calling geocoder.geocode...');
                geocoder.geocode(query, (results) => {
                    if (signal.aborted) {
                        reject(new DOMException('Aborted', 'AbortError'));
                        return;
                    }
                    console.log('Geocoder callback fired, results:', results);
                    resolve(results || []);
                });

                // Abort listener
                signal.addEventListener('abort', () => {
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            }),
            // Always search nearby features (they might already be loaded)
            searchNearbyFeatures(query, signal)
        ]),
        // Timeout after 5 seconds
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Search timeout')), 5000)
        )
    ]).then(([geocoderResults, nearbyResults]) => {
        if (signal.aborted) return; // Don't render if aborted

        // Hide loading
        document.getElementById('search-status').classList.add('hidden');

        console.log('Combined results:', { geocoderResults, nearbyResults });
        // Combine and deduplicate results
        const combinedResults = deduplicateResults([...nearbyResults, ...geocoderResults]);
        console.log('Total combined results:', combinedResults.length);
        renderSuggestions(combinedResults);
        selectedSuggestionIndex = -1;
    }).catch(error => {
        if (error.name === 'AbortError') {
            console.log('Search aborted');
            return;
        }
        console.error('Error fetching suggestions:', error);
        document.getElementById('search-status').textContent =
            'Search failed. Check your connection and try again.';
        hideSuggestions();
    });
}, 300);
```

#### 2.3 Update searchNearbyFeatures to Accept Signal
**File**: `src/js/main.js:558`

```javascript
function searchNearbyFeatures(query, signal = null) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }

        console.log('Searching nearby features, currentFeatures:', currentFeatures);
        // ... rest of function
    });
}
```

---

## Phase 3: Deduplicate Results

### Changes Required

#### 3.1 Add Deduplication Function
**File**: `src/js/main.js:558` (before searchNearbyFeatures)

**Add**:
```javascript
// Deduplicate results by comparing name and location
function deduplicateResults(results) {
    const seen = new Map();
    const deduplicated = [];

    results.forEach(result => {
        // Create unique key from name and approximate coordinates
        const lat = result.center?.lat || result.raw?.lat || 0;
        const lng = result.center?.lng || result.raw?.lng || 0;
        const key = `${result.name.toLowerCase()}_${lat.toFixed(3)}_${lng.toFixed(3)}`;

        if (!seen.has(key)) {
            seen.set(key, true);
            deduplicated.push(result);
        }
    });

    return deduplicated;
}
```

#### 3.2 Group Results by Type
**File**: `src/js/main.js:451` (update renderSuggestions)

```javascript
function renderSuggestions(results) {
    // Hide loading
    document.getElementById('search-status').classList.add('hidden');

    if (!results || results.length === 0) {
        // ... no results handling
        return;
    }

    // Group results
    const nearbyResults = results.filter(r => r.raw && r.raw.id);
    const geocoderResults = results.filter(r => !r.raw || !r.raw.id);

    suggestionsContainer.innerHTML = '<ul></ul>';
    const ul = suggestionsContainer.querySelector('ul');

    // Add "Nearby Features" section if any
    if (nearbyResults.length > 0) {
        const header = document.createElement('li');
        header.className = 'suggestion-header';
        header.textContent = 'Nearby Features';
        ul.appendChild(header);

        nearbyResults.forEach((result, index) => {
            ul.appendChild(createSuggestionItem(result, index));
        });
    }

    // Add "City Search" section if any
    if (geocoderResults.length > 0) {
        const header = document.createElement('li');
        header.className = 'suggestion-header';
        header.textContent = 'Bengaluru Locations';
        ul.appendChild(header);

        geocoderResults.forEach((result, index) => {
            ul.appendChild(createSuggestionItem(result, nearbyResults.length + index));
        });
    }

    suggestionsContainer.classList.add('show');
}

function createSuggestionItem(result, index) {
    const li = document.createElement('li');

    // Check if this is a nearby feature or a geocoder result
    if (result.raw && result.raw.id) {
        // This is a nearby feature result
        li.innerHTML = `
            <span class="suggestion-name">${result.name}</span>
            <span class="suggestion-detail">${result.raw.category || 'nearby'}</span>
        `;
        li.title = `Click to select this nearby ${result.raw.category || 'feature'}`;
    } else {
        // This is a geocoder result
        const detail = result.html || result.name;
        li.innerHTML = `
            <span class="suggestion-name">${result.name}</span>
            <span class="suggestion-detail">${extractLocality(detail)}</span>
        `;
    }

    li.dataset.index = index;
    li.__data = result;

    li.addEventListener('click', () => {
        selectSuggestion(result);
    });

    return li;
}

// Extract locality from HTML response
function extractLocality(html) {
    if (typeof html === 'string' && html.includes(',')) {
        const parts = html.split(',');
        return parts.slice(1, 3).join(',').trim() || 'Bengaluru';
    }
    return 'Bengaluru';
}
```

**File**: `src/css/style.css`

```css
.suggestion-header {
    padding: 8px 10px !important;
    font-weight: bold;
    font-size: 0.85rem;
    color: var(--secondary-color);
    background-color: #f8fafc;
    cursor: default !important;
    border-bottom: 1px solid var(--border-color);
}

.suggestion-header:hover {
    background-color: #f8fafc !important;
}

.suggestion-name {
    display: block;
    font-weight: 500;
}

.suggestion-detail {
    display: block;
    font-size: 0.85rem;
    color: var(--secondary-color);
    margin-top: 2px;
}
```

---

## Phase 4: Refresh Nearby Panel on Selection

### Changes Required

#### 4.1 Update selectSuggestion
**File**: `src/js/main.js:487`

**Add after coordinate update**:
```javascript
function selectSuggestion(result) {
    let lat, lng, name;

    // Check if this is a nearby feature or a geocoder result
    if (result.raw && result.raw.id) {
        const feature = result.raw;
        lat = feature.lat;
        lng = feature.lng;
        name = feature.name;
    } else {
        lat = result.center.lat;
        lng = result.center.lng;
        name = result.name;
    }

    // Update the marker and map
    locationMarker.setLatLng([lat, lng]);
    locationMap.setView([lat, lng], 16);

    // Update the search input with the selected location name
    locationSearchInput.value = name;

    // Update the coordinates field with the coordinates
    locationCoordsInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    // Refresh nearby features for the selected location
    fetchAndDisplayNearbyFeatures(lat, lng);

    // Show selection confirmation
    showSelectionConfirmation(name, lat, lng);

    hideSuggestions();
}
```

#### 4.2 Add Selection Confirmation Banner
**File**: `src/index.html:92` (after search status)

```html
<div id="selection-confirmation" class="selection-confirmation hidden">
    <div class="confirmation-content">
        <span id="confirmation-text"></span>
        <button id="clear-selection" class="btn-link">Change</button>
    </div>
</div>
```

**File**: `src/js/main.js` (add helper function)

```javascript
function showSelectionConfirmation(name, lat, lng) {
    const confirmationEl = document.getElementById('selection-confirmation');
    const textEl = document.getElementById('confirmation-text');

    textEl.textContent = `Selected: ${name}`;
    confirmationEl.classList.remove('hidden');

    // Clear button handler
    document.getElementById('clear-selection').onclick = () => {
        locationSearchInput.value = '';
        locationSearchInput.focus();
        confirmationEl.classList.add('hidden');
    };
}
```

**File**: `src/css/style.css`

```css
.selection-confirmation {
    margin-top: 10px;
    padding: 10px 12px;
    background: #e0f7fa;
    border: 1px solid #00838f;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.confirmation-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 10px;
}

.btn-link {
    background: none;
    border: none;
    color: var(--primary-color);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
}

.btn-link:hover {
    color: #007a8e;
}
```

---

## Phase 5: Drop Pin Fallback

### Changes Required

#### 5.1 Add "Use Map" Option in Suggestions
**File**: `src/js/main.js:451` (in renderSuggestions, at end)

```javascript
function renderSuggestions(results) {
    // ... existing code

    // Always add "Use map location" option at the end
    const mapOption = document.createElement('li');
    mapOption.className = 'suggestion-map-option';
    mapOption.innerHTML = `
        <span class="suggestion-name">📍 Drop a pin on the map instead</span>
        <span class="suggestion-detail">Click on the map to select a location</span>
    `;
    mapOption.addEventListener('click', () => {
        hideSuggestions();
        locationSearchInput.blur();
        // Optionally highlight the map briefly
        document.getElementById('location-map').style.border = '2px solid var(--primary-color)';
        setTimeout(() => {
            document.getElementById('location-map').style.border = '1px solid var(--border-color)';
        }, 2000);
    });
    ul.appendChild(mapOption);

    suggestionsContainer.classList.add('show');
}
```

**File**: `src/css/style.css`

```css
.suggestion-map-option {
    border-top: 2px solid var(--border-color) !important;
    background-color: #fef9e7 !important;
}

.suggestion-map-option:hover {
    background-color: #fcf3cf !important;
}
```

---

## Phase 6: Recent Searches

### Changes Required

#### 6.1 Add Recent Searches Storage
**File**: `src/js/main.js:430`

```javascript
// Variable to store current nearby features for searching
let currentFeatures = [];
let currentSearchAbort = null;
const RECENT_SEARCHES_KEY = 'recentLocationSearches';
const MAX_RECENT_SEARCHES = 5;
```

#### 6.2 Save Searches on Selection
**File**: `src/js/main.js:487` (in selectSuggestion)

```javascript
function selectSuggestion(result) {
    // ... existing code

    // Save to recent searches
    saveRecentSearch({
        name: name,
        lat: lat,
        lng: lng,
        timestamp: Date.now()
    });

    hideSuggestions();
}

function saveRecentSearch(search) {
    let recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');

    // Remove duplicates
    recent = recent.filter(r => r.name !== search.name);

    // Add to front
    recent.unshift(search);

    // Keep only last N searches
    recent = recent.slice(0, MAX_RECENT_SEARCHES);

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

function getRecentSearches() {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
}

function clearRecentSearches() {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
}
```

#### 6.3 Show Recent Searches on Focus
**File**: `src/js/main.js:508` (add focus handler)

```javascript
locationSearchInput.addEventListener('focus', () => {
    const query = locationSearchInput.value.trim();

    // If empty, show recent searches
    if (query.length === 0) {
        const recent = getRecentSearches();
        if (recent.length > 0) {
            renderRecentSearches(recent);
        }
    }
});

function renderRecentSearches(searches) {
    suggestionsContainer.innerHTML = '<ul></ul>';
    const ul = suggestionsContainer.querySelector('ul');

    // Header with clear button
    const header = document.createElement('li');
    header.className = 'suggestion-header';
    header.innerHTML = `
        <span>Recent Searches</span>
        <button class="btn-link" onclick="clearRecentSearches(); hideSuggestions();">Clear</button>
    `;
    ul.appendChild(header);

    searches.forEach((search, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="suggestion-name">🕐 ${search.name}</span>
            <span class="suggestion-detail">${search.lat.toFixed(4)}, ${search.lng.toFixed(4)}</span>
        `;
        li.__data = {
            name: search.name,
            center: { lat: search.lat, lng: search.lng }
        };
        li.addEventListener('click', () => {
            selectSuggestion(li.__data);
        });
        ul.appendChild(li);
    });

    suggestionsContainer.classList.add('show');
}
```

---

## Phase 7: Backend Proxy (Optional but Recommended)

### Changes Required

#### 7.1 Create Proxy Server
**File**: `server.js` (update existing server)

```javascript
const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const NodeCache = require('node-cache'); // npm install node-cache

const app = express();
const port = 3001;

// Cache for API responses (TTL: 5 minutes)
const apiCache = new NodeCache({ stdTTL: 300 });

// Rate limiting map
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 1000; // 1 second

app.use(express.static('src'));
app.use(express.json());

// Nominatim proxy
app.get('/api/geocode', async (req, res) => {
    const { q, viewbox, bounded, countrycodes, limit } = req.query;

    // Check cache
    const cacheKey = `geocode_${q}_${viewbox}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }

    // Rate limiting
    const now = Date.now();
    const lastCall = rateLimitMap.get('nominatim') || 0;
    if (now - lastCall < RATE_LIMIT_WINDOW) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    rateLimitMap.set('nominatim', now);

    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', q);
        url.searchParams.set('format', 'json');
        if (viewbox) url.searchParams.set('viewbox', viewbox);
        if (bounded) url.searchParams.set('bounded', bounded);
        if (countrycodes) url.searchParams.set('countrycodes', countrycodes);
        if (limit) url.searchParams.set('limit', limit);

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'BengaluruCivicIssuesHub/1.0 (civic-issues@example.com)'
            }
        });

        const data = await response.json();

        // Cache the response
        apiCache.set(cacheKey, data);

        res.json(data);
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: 'Geocoding failed' });
    }
});

// Overpass proxy
app.post('/api/overpass', async (req, res) => {
    const { query } = req.body;

    // Check cache
    const cacheKey = `overpass_${Buffer.from(query).toString('base64').substring(0, 50)}`;
    const cached = apiCache.get(cacheKey);
    if (cached) {
        return res.json(cached);
    }

    // Rate limiting
    const now = Date.now();
    const lastCall = rateLimitMap.get('overpass') || 0;
    if (now - lastCall < RATE_LIMIT_WINDOW) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    rateLimitMap.set('overpass', now);

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'BengaluruCivicIssuesHub/1.0 (civic-issues@example.com)'
            },
            body: `data=${encodeURIComponent(query)}`
        });

        const data = await response.json();

        // Cache the response
        apiCache.set(cacheKey, data);

        res.json(data);
    } catch (error) {
        console.error('Overpass error:', error);
        res.status(500).json({ error: 'Overpass query failed' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

#### 7.2 Update Frontend to Use Proxy
**File**: `src/js/main.js:533` (update geocoder call)

This would require creating a custom geocoder that calls the proxy instead of using the built-in Nominatim geocoder.

#### 7.3 Update Overpass Calls
**File**: `src/js/main.js:747`

```javascript
const response = await fetch('/api/overpass', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
});
```

---

## Implementation Timeline

### Week 1: Core Search Improvements
- [ ] Phase 1: Scope Nominatim to Bengaluru (2 days)
- [ ] Phase 2: Cancel stale lookups (2 days)
- [ ] Phase 3: Deduplicate results (1 day)

### Week 2: UX Enhancements
- [ ] Phase 4: Refresh nearby panel (1 day)
- [ ] Phase 5: Drop pin fallback (1 day)
- [ ] Phase 6: Recent searches (2 days)

### Week 3: Backend & Testing
- [ ] Phase 7: Backend proxy (3 days)
- [ ] Testing & bug fixes (2 days)

---

## Testing Checklist

### Functional Tests
- [ ] Search with 1, 2, 3+ characters
- [ ] Fast typing (cancel previous requests)
- [ ] Select from different result groups
- [ ] Keyboard navigation (arrows, enter, escape)
- [ ] Touch interactions on mobile
- [ ] Recent searches save/load/clear
- [ ] Drop pin fallback
- [ ] Network failure handling
- [ ] Empty results handling

### Location Tests
- [ ] Search central Bengaluru (MG Road, Cubbon Park)
- [ ] Search outer areas (Whitefield, Electronic City)
- [ ] Search neighborhoods (BTM Layout, Koramangala)
- [ ] Search landmarks (Vidhan Soudha, Lalbagh)
- [ ] Verify results are within Bengaluru bounds

### Performance Tests
- [ ] Search response time < 1s
- [ ] Autocomplete debounce works
- [ ] Cache reduces API calls
- [ ] Abort controller cancels properly
- [ ] UI remains responsive during search

### Accessibility Tests
- [ ] Keyboard-only navigation
- [ ] Screen reader announcements
- [ ] Focus management
- [ ] Error messages readable

---

## Success Metrics

1. **Search Coverage**: 95%+ of Bengaluru addresses findable
2. **Response Time**: < 1 second for autocomplete
3. **Accuracy**: Top 3 results relevant for 90%+ searches
4. **API Compliance**: Proper User-Agent, rate limiting
5. **User Satisfaction**: Reduced "drop pin" usage by 50%+

---

## Rollback Plan

If issues arise:
1. Feature flag to disable new search
2. Revert to nearby-only search
3. Keep existing map interaction intact
4. Communicate changes to users

---

## Future Enhancements

- [ ] Popular landmarks/wards as quick picks
- [ ] Search analytics (track most searched)
- [ ] Autocomplete from ward/zone boundaries
- [ ] Multi-language support (Kannada)
- [ ] Voice search integration
- [ ] Offline mode with cached data

---

**Document Version**: 1.0
**Created**: 2025-01-07
**Status**: Ready for Implementation
