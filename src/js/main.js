// Bengaluru Civic Issues Hub - Main JavaScript

// Global variables for location map
let locationMap;
let locationMarker;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize view switching
    initViewSwitching();
    
    // Initialize the map
    initMap();
    
    // Initialize form handling
    initFormHandling();
    
    // Initialize mock SSO
    initMockSSO();
    
    // Initialize local storage for drafts
    initLocalDrafts();
    
    // Initialize issue list
    initIssueList();
    
    // Initialize location map for form
    initLocationMap();
});

// View switching functionality
function initViewSwitching() {
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show the corresponding view
            const viewId = this.getAttribute('data-view');
            showView(viewId);
        });
    });
}

// Show specific view
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.classList.add('active');
        
        // Special handling for map view
        if (viewName === 'map') {
            setTimeout(() => {
                // Refresh map to ensure it renders properly after being hidden
                if (window.mainMap) {
                    window.mainMap.invalidateSize();
                }
            }, 100);
        } 
        // Special handling for submit view to fix location map
        else if (viewName === 'submit') {
            setTimeout(() => {
                // Initialize the location map if not already done
                initLocationMap();
                // Refresh location map to ensure it works when view becomes visible
                if (locationMap) {
                    locationMap.invalidateSize();
                }
            }, 100);
        }
    }
}

// Initialize the map
function initMap() {
    // Create the map centered on Bengaluru
    window.mainMap = L.map('map').setView([12.9716, 77.5946], 12);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(window.mainMap);
    
    // Load issues and display them on the map
    loadIssuesForMap();
}

// Load issues and display them on the map
function loadIssuesForMap() {
    // For MVP, we'll use mock data stored in localStorage
    // In a real implementation, this would be an API call
    const issues = JSON.parse(localStorage.getItem('civicIssues') || '[]');
    
    // Clear existing markers
    if (window.markersLayer) {
        window.mainMap.removeLayer(window.markersLayer);
    }
    
    // Create a layer for markers
    window.markersLayer = L.layerGroup().addTo(window.mainMap);
    
    // Add markers for each issue
    issues.forEach(issue => {
        // For demo purposes, we'll use a fixed location for each issue
        // In a real implementation, this would come from the issue data
        const lat = 12.9716 + (Math.random() - 0.5) * 0.1; // Randomize slightly
        const lng = 77.5946 + (Math.random() - 0.5) * 0.1; // Randomize slightly
        
        let icon;
        switch(issue.category) {
            case 'Roads':
                icon = L.divIcon({className: 'map-marker marker-roads', html: '🚧', iconSize: [24, 24]});
                break;
            case 'Water':
                icon = L.divIcon({className: 'map-marker marker-water', html: '💧', iconSize: [24, 24]});
                break;
            case 'Waste':
                icon = L.divIcon({className: 'map-marker marker-waste', html: '🗑️', iconSize: [24, 24]});
                break;
            case 'Power':
                icon = L.divIcon({className: 'map-marker marker-power', html: '💡', iconSize: [24, 24]});
                break;
            case 'Public Health':
                icon = L.divIcon({className: 'map-marker marker-health', html: '🏥', iconSize: [24, 24]});
                break;
            default:
                icon = L.divIcon({className: 'map-marker marker-other', html: '📍', iconSize: [24, 24]});
        }
        
        const marker = L.marker([lat, lng], {icon: icon}).addTo(window.markersLayer);
        
        // Create popup content
        const popupContent = `
            <div class="popup-content">
                <h4>${issue.title}</h4>
                <p class="category-tag">${issue.category}</p>
                <p>${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}</p>
                <p class="status-badge status-${issue.status.toLowerCase()}">Status: ${issue.status}</p>
            </div>
        `;
        
        marker.bindPopup(popupContent);
    });
    
    // Update stats display
    updateStats();
}

// Initialize form handling
function initFormHandling() {
    const form = document.getElementById('civic-issue-form');
    const previewCard = document.getElementById('preview-card');
    const loginBtn = document.getElementById('login-btn');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const category = document.getElementById('category').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const location = document.getElementById('location-coords').value; // Use coordinates field
        const image = document.getElementById('image').files[0];
        
        // Validate required fields (simplified)
        if (!category || !title || !description || !location || location.trim() === '') {
            alert('Please fill in all required fields and select a location on the map');
            return;
        }
        
        // Create a draft submission object
        const draftSubmission = {
            id: 'draft_' + Date.now(),
            category,
            title,
            description,
            location,
            image: image ? URL.createObjectURL(image) : null,
            createdAt: new Date().toISOString()
        };
        
        // Save draft to localStorage
        saveDraftToLocalStorage(draftSubmission);
        
        // Show preview card with draft data
        showPreviewCard(draftSubmission);
        
        // Hide form and show preview
        form.classList.add('hidden');
        previewCard.classList.remove('hidden');
    });
    
    // Handle preview card login button
    loginBtn.addEventListener('click', function() {
        // In a real implementation, this would trigger the SSO flow
        alert('In a real implementation, this would redirect to SSO login');
        
        // For now, just show a success message and reset form
        alert('Issue submitted successfully!');
        
        // Reset the form and show it again
        document.getElementById('civic-issue-form').reset();
        form.classList.remove('hidden');
        previewCard.classList.add('hidden');
    });
    
    // Image preview functionality
    document.getElementById('image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const previewDiv = document.getElementById('image-preview');
                previewDiv.innerHTML = `<img src="${event.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; margin-top: 10px;">`;
                
                // Extract GPS data from EXIF if available
                exifr.gps(file).then(gps => {
                    if (!gps) return;
                    const lat = gps.latitude;
                    const lng = gps.longitude;
                    if (Number.isFinite(lat) && Number.isFinite(lng) && locationMap && locationMarker) {
                        locationMarker.setLatLng([lat, lng]);
                        locationMap.setView([lat, lng], 15);
                        document.getElementById('location-coords').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    }
                }).catch(err => console.warn('No GPS data', err));
            };
            reader.readAsDataURL(file);
        }
    });
}

// Save draft to localStorage
function saveDraftToLocalStorage(draft) {
    let drafts = JSON.parse(localStorage.getItem('civicIssueDrafts') || '[]');
    
    // Remove any existing draft with the same ID
    drafts = drafts.filter(d => d.id !== draft.id);
    
    // Add the new draft
    drafts.push(draft);
    
    // Keep only the last 10 drafts
    if (drafts.length > 10) {
        drafts = drafts.slice(-10);
    }
    
    localStorage.setItem('civicIssueDrafts', JSON.stringify(drafts));
}

// Show preview card with draft data
function showPreviewCard(draft) {
    document.getElementById('preview-category').textContent = draft.category;
    document.getElementById('preview-title').textContent = draft.title;
    document.getElementById('preview-description').textContent = draft.description;
    document.getElementById('preview-location').textContent = draft.location;
    
    const previewImageContainer = document.getElementById('preview-image-container');
    if (draft.image) {
        previewImageContainer.innerHTML = `<img src="${draft.image}" alt="Issue Image" style="max-width: 100%; border-radius: 8px;">`;
    } else {
        previewImageContainer.innerHTML = '';
    }
}

// Initialize mock SSO
function initMockSSO() {
    // This would handle real SSO integration in production
    console.log('Mock SSO initialized');
}

// Initialize local drafts
function initLocalDrafts() {
    // Check for any saved drafts on page load
    const drafts = JSON.parse(localStorage.getItem('civicIssueDrafts') || '[]');
    console.log('Found', drafts.length, 'saved drafts');
    
    // Update stats display
    updateStats();
}

// Initialize issue list
function initIssueList() {
    // Mock data for demonstration
    const mockIssues = [
        {
            id: 1,
            category: 'Roads',
            title: 'Potholes on Main Street',
            description: 'Large potholes causing traffic issues and accidents',
            location: 'Koramangala, Bangalore',
            status: 'Published',
            createdAt: '2025-01-15',
            image: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Road+Issue'
        },
        {
            id: 2,
            category: 'Water',
            title: 'Water Supply Disruption',
            description: 'No water supply for past 3 days in the area',
            location: 'Indiranagar, Bangalore',
            status: 'Verified',
            createdAt: '2025-01-16',
            image: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Water+Issue'
        },
        {
            id: 3,
            category: 'Waste',
            title: 'Garbage Accumulation',
            description: 'Unmanaged waste disposal in residential area',
            location: 'Whitefield, Bangalore',
            status: 'New',
            createdAt: '2025-01-17',
            image: 'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Waste+Issue'
        }
    ];
    
    // Save mock data for demo
    localStorage.setItem('civicIssues', JSON.stringify(mockIssues));
    
    // Render the issues list
    renderIssuesList(mockIssues);
    
    // Add event listeners for filters
    document.getElementById('category-filter').addEventListener('change', filterIssues);
    document.getElementById('status-filter').addEventListener('change', filterIssues);
    document.getElementById('location-filter').addEventListener('input', filterIssues);
    
    // Update stats display
    updateStats();
}

// Render issues list
function renderIssuesList(issues) {
    const container = document.getElementById('issues-list');
    
    if (!issues || issues.length === 0) {
        container.innerHTML = '<p>No issues reported yet.</p>';
        return;
    }
    
    container.innerHTML = issues.map(issue => `
        <div class="issue-card">
            <div class="card-header">
                <span class="category-tag">${issue.category}</span>
                <span class="status-badge status-${issue.status.toLowerCase()}">${issue.status}</span>
            </div>
            <h4>${issue.title}</h4>
            <p>${issue.description}</p>
            <p><strong>Location:</strong> ${issue.location}</p>
            <p><small>Reported: ${new Date(issue.createdAt).toLocaleDateString()}</small></p>
            ${issue.image ? `<img src="${issue.image}" alt="Issue Image" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">` : ''}
        </div>
    `).join('');
}

// Filter issues based on selections
function filterIssues() {
    const category = document.getElementById('category-filter').value;
    const status = document.getElementById('status-filter').value;
    const location = document.getElementById('location-filter').value.toLowerCase();
    
    let issues = JSON.parse(localStorage.getItem('civicIssues') || '[]');
    
    // Apply filters
    if (category) {
        issues = issues.filter(issue => issue.category === category);
    }
    
    if (status) {
        issues = issues.filter(issue => issue.status === status);
    }
    
    if (location) {
        issues = issues.filter(issue => 
            issue.location.toLowerCase().includes(location) ||
            issue.title.toLowerCase().includes(location) ||
            issue.description.toLowerCase().includes(location)
        );
    }
    
    renderIssuesList(issues);
}

// Update statistics display
function updateStats() {
    const issues = JSON.parse(localStorage.getItem('civicIssues') || '[]');
    
    // Calculate stats
    const total = issues.length;
    const published = issues.filter(i => i.status === 'Published').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    
    // Update the display
    document.getElementById('total-submitted').textContent = total;
    document.getElementById('total-published').textContent = published;
    document.getElementById('total-resolved').textContent = resolved;
}

// Initialize the location map for the form
function initLocationMap() {
    // Create the location map centered on Bengaluru
    if (document.getElementById('location-map') && !locationMap) {
        locationMap = L.map('location-map', { scrollWheelZoom: false }).setView([12.9716, 77.5946], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(locationMap);
        
        // Add a draggable marker at the default Bangalore location
        const defaultLat = 12.9716;
        const defaultLng = 77.5946;
        locationMarker = L.marker([defaultLat, defaultLng], {draggable: true}).addTo(locationMap);

        const locationSearchInput = document.getElementById('location-search');
        const locationCoordsInput = document.getElementById('location-coords');
        const suggestionsContainer = document.getElementById('location-suggestions');

        // Variable to store current nearby features for searching
        let currentFeatures = [];
        let currentSearchAbort = null; // AbortController for canceling stale searches

        // Configuration constants
        const RECENT_SEARCHES_KEY = 'recentLocationSearches';
        const MAX_RECENT_SEARCHES = 5;
        const IGNORED_OSM_IDS = new Set([1339408103, 459471357]);
        const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

        // Fetch nearby features for the default Bangalore location on page load
        // Use a larger radius to get more features for searching across Bangalore
        setTimeout(() => {
            fetchAndDisplayNearbyFeatures(defaultLat, defaultLng, 2000); // 2km radius for better coverage
        }, 500);

        // Geocoding helper using direct Nominatim API
        async function geocodeCity(query, signal) {
            const params = new URLSearchParams({
                format: 'jsonv2',
                q: query,
                viewbox: '77.4602,13.1439,77.7845,12.8349',
                bounded: '1',
                countrycodes: 'in',
                addressdetails: '1',
                limit: '10'
            });

            const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
                headers: {
                    Accept: 'application/json',
                    'Accept-Language': 'en'
                },
                signal
            });

            if (!response.ok) {
                throw new Error(`Nominatim error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            return data.map((item) => ({
                name: item.display_name.split(',')[0].trim(),
                html: item.display_name,
                center: L.latLng(parseFloat(item.lat), parseFloat(item.lon)),
                raw: {
                    id: item.osm_id,
                    osm_type: item.osm_type,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon)
                },
                properties: item
            }));
        }

        // Check if a result should be ignored based on OSM ID
        function isIgnoredResult(result) {
            if (!result) {
                return false;
            }

            const raw = result.raw || {};
            const props = result.properties || {};
            const candidateIds = [raw.id, raw.osm_id, props.osm_id]
                .map((value) => Number(value))
                .filter((value) => !Number.isNaN(value));

            if (candidateIds.some((id) => IGNORED_OSM_IDS.has(id))) {
                return true;
            }

            return IGNORED_OSM_IDS.has(result.id);
        }

        // Hide suggestions function
        function hideSuggestions() {
            suggestionsContainer.classList.remove('show');
        }
        
        // Create a suggestion list item
        function createSuggestionItem(result, index) {
            const li = document.createElement('li');

            // Check if this is a nearby feature or a geocoder result
            if (result.raw && result.raw.id) {
                // This is a nearby feature result
                li.innerHTML = `
                    <span class="suggestion-name">${result.name}</span>
                    <span class="suggestion-detail">${result.raw.category || 'nearby feature'}</span>
                `;
                li.title = `Nearby ${result.raw.category || 'feature'}`;
            } else {
                // This is a geocoder result
                const locality = extractLocality(result);
                li.innerHTML = `
                    <span class="suggestion-name">${result.name}</span>
                    <span class="suggestion-detail">${locality}</span>
                `;
            }

            li.dataset.index = index;
            li.__data = result; // Store the result data for keyboard navigation

            li.addEventListener('click', () => {
                selectSuggestion(result);
            });

            return li;
        }

        // Render suggestions function with grouping
        function renderSuggestions(results) {
            // Filter out ignored results first
            const safeResults = results ? results.filter(r => !isIgnoredResult(r)) : [];

            if (!safeResults || safeResults.length === 0) {
                suggestionsContainer.innerHTML = `
                    <div class="no-results">
                        <p>No locations found in Bengaluru.</p>
                        <p class="suggestion-hint">Try 'BTM Layout', 'Koramangala', 'MG Road', or drop a pin on the map.</p>
                    </div>
                `;
                suggestionsContainer.classList.add('show');
                return;
            }

            // Group safe results by type
            const nearbyResults = safeResults.filter(r => r.raw && r.raw.id);
            const geocoderResults = safeResults.filter(r => !r.raw || !r.raw.id);

            suggestionsContainer.innerHTML = '<ul></ul>';
            const ul = suggestionsContainer.querySelector('ul');
            let index = 0;

            // Add "Nearby Features" section if any
            if (nearbyResults.length > 0) {
                const header = document.createElement('li');
                header.className = 'suggestion-header';
                header.textContent = 'Nearby Features';
                ul.appendChild(header);

                nearbyResults.forEach((result) => {
                    ul.appendChild(createSuggestionItem(result, index++));
                });
            }

            // Add "City Locations" section if any
            if (geocoderResults.length > 0) {
                const header = document.createElement('li');
                header.className = 'suggestion-header';
                header.textContent = 'Bengaluru Locations';
                ul.appendChild(header);

                geocoderResults.forEach((result) => {
                    ul.appendChild(createSuggestionItem(result, index++));
                });
            }

            // Always add "Use map location" option at the end
            const mapOption = document.createElement('li');
            mapOption.className = 'suggestion-map-option';
            mapOption.innerHTML = `
                <span class="suggestion-name">📍 Drop a pin on the map instead</span>
                <span class="suggestion-detail">Click anywhere on the map to select a location</span>
            `;
            mapOption.addEventListener('click', () => {
                hideSuggestions();
                locationSearchInput.blur();
                // Highlight the map briefly to draw attention
                const mapEl = document.getElementById('location-map');
                mapEl.style.border = '3px solid var(--primary-color)';
                mapEl.style.boxShadow = '0 0 10px var(--primary-color)';
                setTimeout(() => {
                    mapEl.style.border = '1px solid var(--border-color)';
                    mapEl.style.boxShadow = 'none';
                }, 2000);
            });
            ul.appendChild(mapOption);

            suggestionsContainer.classList.add('show');
        }
        
        // Select suggestion function
        function selectSuggestion(result) {
            // Guard against ignored results
            if (isIgnoredResult(result)) {
                console.warn('Attempted to select ignored result:', result);
                return;
            }

            let lat, lng, name, osmId;

            // Check if this is a nearby feature or a geocoder result
            if (result.raw && result.raw.id) {
                // This is a nearby feature result
                const feature = result.raw;
                lat = feature.lat;
                lng = feature.lng;
                name = feature.name;
                osmId = feature.id;
            } else {
                // This is a geocoder result
                lat = result.center.lat;
                lng = result.center.lng;
                name = result.name;
                osmId = result.raw?.id || result.properties?.osm_id || null;
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

            // Save to recent searches with osmId
            saveRecentSearch({ name, lat, lng, osmId });

            hideSuggestions();
        }
        
        // Autocomplete flow
        let suggestionTimeout;
        let selectedSuggestionIndex = -1;
        
        locationSearchInput.addEventListener('input', () => {
            const query = locationSearchInput.value.trim();
            console.log('Input event fired, query:', query);
            clearTimeout(suggestionTimeout);
            if (query.length < 3) { // Require minimum 3 characters for city-wide search
                hideSuggestions();
                selectedSuggestionIndex = -1;
                return;
            }
            suggestionTimeout = setTimeout(() => {
                // Cancel previous search if still running
                if (currentSearchAbort) {
                    console.log('Aborting previous search');
                    currentSearchAbort.abort();
                }

                // Create new abort controller
                currentSearchAbort = new AbortController();
                const signal = currentSearchAbort.signal;

                // Show loading state
                const searchStatus = document.getElementById('search-status');
                searchStatus.textContent = 'Searching Bengaluru...';
                searchStatus.classList.remove('hidden', 'error');

                console.log('Timeout fired, starting geocode for:', query);

                // Run both geocoder search and nearby features search
                Promise.race([
                    Promise.all([
                        new Promise((resolve, reject) => {
                            if (signal.aborted) {
                                reject(new DOMException('Aborted', 'AbortError'));
                                return;
                            }

                            geocodeCity(query, signal).then((results) => {
                                if (signal.aborted) {
                                    reject(new DOMException('Aborted', 'AbortError'));
                                    return;
                                }
                                console.log('Geocoder results:', results);
                                resolve(results || []);
                            }).catch(error => {
                                if (signal.aborted) {
                                    reject(new DOMException('Aborted', 'AbortError'));
                                } else {
                                    reject(error);
                                }
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
                    if (signal.aborted) {
                        console.log('Results arrived but search was aborted, ignoring');
                        return;
                    }
                    // Hide loading state
                    const searchStatus = document.getElementById('search-status');
                    searchStatus.classList.add('hidden');

                    console.log('Combined results:', { geocoderResults, nearbyResults });
                    // Combine results: prioritize nearby results first, then geocoder results
                    const combinedResults = [...nearbyResults, ...geocoderResults];
                    // Deduplicate combined results
                    const deduplicatedResults = deduplicateResults(combinedResults);
                    console.log('Total combined results:', combinedResults.length, 'After deduplication:', deduplicatedResults.length);
                    renderSuggestions(deduplicatedResults);
                    selectedSuggestionIndex = -1;
                }).catch(error => {
                    // Don't show error for aborted requests
                    if (error.name === 'AbortError') {
                        console.log('Search aborted, ignoring error');
                        return;
                    }

                    console.error('Error fetching suggestions:', error);
                    const searchStatus = document.getElementById('search-status');

                    if (error.message === 'Search timeout') {
                        searchStatus.textContent = 'Search timed out. Please try again.';
                    } else {
                        searchStatus.textContent = 'Search failed. Check your connection and try again.';
                    }

                    searchStatus.classList.add('error');
                    searchStatus.classList.remove('hidden');
                    hideSuggestions();
                });
            }, 300);
        });
        
        function saveRecentSearch(entry) {
            const { name, lat, lng, osmId } = entry;
            if (!name || Number.isNaN(lat) || Number.isNaN(lng)) {
                return;
            }

            let recent = getRecentSearches().filter((item) => item.name !== name);
            recent.unshift({ name, lat, lng, osmId: osmId ?? null, timestamp: Date.now() });
            recent = recent.slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
        }

        function getRecentSearches() {
            try {
                return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
            } catch (error) {
                console.warn('Failed to read recent searches', error);
                return [];
            }
        }

        function clearRecentSearches() {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
            hideSuggestions();
        }

        function renderRecentSearches(searches) {
            if (!searches || searches.length === 0) {
                hideSuggestions();
                return;
            }

            suggestionsContainer.innerHTML = '<ul></ul>';
            const ul = suggestionsContainer.querySelector('ul');

            const header = document.createElement('li');
            header.className = 'suggestion-header';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.innerHTML = `
                <span>Recent Searches</span>
                <button class="btn-link" type="button">Clear</button>
            `;
            const clearButton = header.querySelector('button');
            clearButton.addEventListener('click', (event) => {
                event.stopPropagation();
                clearRecentSearches();
            });
            ul.appendChild(header);

            searches.forEach((search, index) => {
                const li = document.createElement('li');
                li.dataset.index = index;
                li.innerHTML = `
                    <span class="suggestion-name">${search.name}</span>
                    <span class="suggestion-detail">${search.lat.toFixed(4)}, ${search.lng.toFixed(4)}</span>
                `;
                li.__data = {
                    name: search.name,
                    center: L.latLng(search.lat, search.lng),
                    raw: { id: search.osmId }
                };
                li.addEventListener('click', () => {
                    selectSuggestion(li.__data);
                });
                ul.appendChild(li);
            });

            suggestionsContainer.classList.add('show');
        }

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

        // Extract locality from geocoder HTML response
        function extractLocality(result) {
            if (result.html && typeof result.html === 'string') {
                // Parse HTML to get locality details
                const parts = result.html.split(',');
                if (parts.length > 1) {
                    return parts.slice(1, 3).join(',').trim();
                }
            }
            if (result.properties) {
                return result.properties.display_name || 'Bengaluru';
            }
            return 'Bengaluru';
        }

        // Function to search through nearby features
        async function searchNearbyFeatures(query, signal = null) {
            if (signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }

            // If we have current nearby features, search through them
            if (currentFeatures && currentFeatures.length > 0) {
                const queryLower = query.toLowerCase();
                const matches = currentFeatures.filter(feature =>
                    feature.name.toLowerCase().includes(queryLower) ||
                    (feature.category && feature.category.toLowerCase().includes(queryLower))
                ).map(feature => ({
                    name: feature.name,
                    center: L.latLng(feature.lat, feature.lng),
                    raw: feature // Store original feature data
                }));

                return matches;
            } else {
                return [];
            }
        }
        
        // Keyboard navigation
        locationSearchInput.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('li');

            if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestions.length === 0) {
                    // optional: trigger a search immediately using the current input
                    geocodeCity(locationSearchInput.value.trim(), new AbortController().signal)
                        .then(results => {
                            if (results && results.length > 0) {
                                renderSuggestions(results);
                            }
                        })
                        .catch(error => {
                            console.error('Search failed:', error);
                            const searchStatus = document.getElementById('search-status');
                            searchStatus.textContent = 'Search failed. Please try again.';
                            searchStatus.classList.add('error');
                            searchStatus.classList.remove('hidden');
                        });
                } else if (selectedSuggestionIndex >= 0) {
                    const result = suggestions[selectedSuggestionIndex].__data;
                    if (result) selectSuggestion(result);
                } else {
                    // pick the first result by default
                    const result = suggestions[0].__data;
                    if (result) selectSuggestion(result);
                }
                return; // stop early so Enter never falls through
            }

            if (suggestions.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestions.length;
                    updateSelectedSuggestion(suggestions);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    selectedSuggestionIndex =
                        selectedSuggestionIndex <= 0 ? suggestions.length - 1 : selectedSuggestionIndex - 1;
                    updateSelectedSuggestion(suggestions);
                    break;
                    
                case 'Escape':
                    hideSuggestions();
                    selectedSuggestionIndex = -1;
                    break;
            }
        });
        
        // Update selected suggestion display
        function updateSelectedSuggestion(suggestions) {
            suggestions.forEach((li, index) => {
                if (index === selectedSuggestionIndex) {
                    li.classList.add('selected');
                } else {
                    li.classList.remove('selected');
                }
            });
        }
        
        // Click outside to hide suggestions
        document.addEventListener('click', (e) => {
            if (!locationSearchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                hideSuggestions();
                selectedSuggestionIndex = -1;
            }
        });
        
        // Update the coordinates when marker is dragged
        locationMarker.on('dragend', function(event) {
            const { lat, lng } = locationMarker.getLatLng();
            locationCoordsInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            
            // Fetch nearby features for the new location
            debouncedFetchNearby(lat, lng);
        });
        
        // Update the marker position when coordinates are manually entered in the coords field
        locationCoordsInput.addEventListener('change', function() {
            const coordsValue = this.value;
            // Check if the input contains coordinates (lat, lng)
            if (coordsValue.includes(',')) {
                const parts = coordsValue.split(',');
                // Check if both parts are numbers (coordinates)
                const lat = parseFloat(parts[0].trim());
                const lng = parseFloat(parts[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    locationMarker.setLatLng([lat, lng]);
                    locationMap.setView([lat, lng], 15);
                    
                    // Update the coordinates display
                    locationCoordsInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    
                    // Fetch nearby features for the new location
                    debouncedFetchNearby(lat, lng);
                }
            }
        });
        
        // Also update marker when clicking on the map
        locationMap.on('click', function(e) {
            locationMarker.setLatLng(e.latlng);
            const { lat, lng } = e.latlng;
            locationCoordsInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            
            // Fetch nearby features for the new location
            debouncedFetchNearby(lat, lng);
        });
        
        // ========== OVERPASS API INTEGRATION ==========
        
        // Overpass API helper
        const overpassCache = new Map();
        let lastQuery = { lat: null, lng: null, timestamp: 0 };

        async function fetchNearbyFeatures(lat, lng, radius = 200, limit = 30) {
            // Create a cache key based on location and radius
            const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${radius}`;
            
            // Check cache first
            if (overpassCache.has(cacheKey)) {
                const cached = overpassCache.get(cacheKey);
                const now = Date.now();
                // Return cached result if it's less than 5 minutes old
                if (now - cached.timestamp < 5 * 60 * 1000) {
                    return cached.data;
                }
            }
            
            // Build Overpass query that excludes roads and buildings
            const query = `
                [out:json][timeout:25];
                (
                  node(around:${radius}, ${lat}, ${lng})["amenity"];
                  node(around:${radius}, ${lat}, ${lng})["shop"];
                  node(around:${radius}, ${lat}, ${lng})["tourism"];
                  node(around:${radius}, ${lat}, ${lng})["leisure"];
                  node(around:${radius}, ${lat}, ${lng})["healthcare"];
                  node(around:${radius}, ${lat}, ${lng})["office"];
                  node(around:${radius}, ${lat}, ${lng})["emergency"];
                  node(around:${radius}, ${lat}, ${lng})["public_transport"];
                  way(around:${radius}, ${lat}, ${lng})["amenity"];
                  way(around:${radius}, ${lat}, ${lng})["shop"];
                  way(around:${radius}, ${lat}, ${lng})["tourism"];
                  way(around:${radius}, ${lat}, ${lng})["leisure"];
                  way(around:${radius}, ${lat}, ${lng})["healthcare"];
                  way(around:${radius}, ${lat}, ${lng})["office"];
                  way(around:${radius}, ${lat}, ${lng})["emergency"];
                  way(around:${radius}, ${lat}, ${lng})["public_transport"];
                  relation(around:${radius}, ${lat}, ${lng})["amenity"];
                  relation(around:${radius}, ${lat}, ${lng})["shop"];
                  relation(around:${radius}, ${lat}, ${lng})["tourism"];
                  relation(around:${radius}, ${lat}, ${lng})["leisure"];
                  relation(around:${radius}, ${lat}, ${lng})["healthcare"];
                  relation(around:${radius}, ${lat}, ${lng})["office"];
                  relation(around:${radius}, ${lat}, ${lng})["emergency"];
                  relation(around:${radius}, ${lat}, ${lng})["public_transport"];
                );
                out tags center ${limit};`;
            
            try {
                const response = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `data=${encodeURIComponent(query)}`
                });
                
                if (!response.ok) {
                    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Normalize the response
                const normalizedResults = data.elements
                    .map((element) => {
                        if (element.tags.highway || element.tags.building) {
                            return null;
                        }

                        if (IGNORED_OSM_IDS.has(element.id)) {
                            return null;
                        }

                        return {
                            id: element.id,
                            type: element.type,
                            lat: element.center ? element.center.lat : element.lat,
                            lng: element.center ? element.center.lon : element.lon,
                            name: element.tags.name || `${element.type} #${element.id}`,
                            category:
                                element.tags.amenity ||
                                element.tags.shop ||
                                element.tags.tourism ||
                                element.tags.leisure ||
                                element.tags.healthcare ||
                                element.tags.office ||
                                element.tags.emergency ||
                                element.tags.public_transport ||
                                'other',
                            rawTags: element.tags
                        };
                    })
                    .filter((feature) => feature !== null);
                
                // Cache the results
                overpassCache.set(cacheKey, {
                    data: normalizedResults,
                    timestamp: Date.now()
                });
                
                // Clean up old cache entries (keep only last 20)
                if (overpassCache.size > 20) {
                    const keys = Array.from(overpassCache.keys());
                    for (let i = 0; i < keys.length - 10; i++) {
                        overpassCache.delete(keys[i]);
                    }
                }
                
                return normalizedResults.slice(0, limit); // Limit results after filtering
            } catch (error) {
                console.error('Error fetching from Overpass API:', error);
                throw error;
            }
        }
        
        // Debounced function to fetch nearby features
        let fetchTimer;
        function debouncedFetchNearby(lat, lng) {
            clearTimeout(fetchTimer);
            fetchTimer = setTimeout(() => {
                fetchAndDisplayNearbyFeatures(lat, lng);
            }, 500); // 500ms delay
        }
        
        // Function to fetch and display nearby features
        async function fetchAndDisplayNearbyFeatures(lat, lng, radius = 200) {
            // Update the last query to prevent duplicate requests
            lastQuery = { lat, lng, timestamp: Date.now() };

            // Show loading state
            document.getElementById('nearby-loading').classList.remove('hidden');
            document.getElementById('nearby-error').classList.add('hidden');
            document.getElementById('nearby-features-list').innerHTML = '';

            try {
                const features = await fetchNearbyFeatures(lat, lng, radius);
                
                // Hide loading, show results
                document.getElementById('nearby-loading').classList.add('hidden');
                
                if (features.length === 0) {
                    const noResults = document.createElement('div');
                    noResults.textContent = 'No nearby features found.';
                    noResults.style.padding = '10px';
                    noResults.style.color = 'var(--secondary-color)';
                    document.getElementById('nearby-features-content').appendChild(noResults);
                    return;
                }
                
                // Display features in the list
                renderNearbyFeatures(features);
            } catch (error) {
                // Show error message
                document.getElementById('nearby-loading').classList.add('hidden');
                const errorMsg = document.getElementById('nearby-error');
                errorMsg.textContent = `Error: ${error.message || 'Failed to fetch nearby features. Please try again.'}`;
                errorMsg.classList.remove('hidden');
            }
        }
        
        
        // Variable to track selected feature index for keyboard navigation
        let selectedFeatureIndex = -1;
        
        // Function to handle keyboard navigation in the features list
        function handleFeatureListNavigation(e) {
            const list = document.getElementById('nearby-features-list');
            const items = list.querySelectorAll('.nearby-feature-item');
            
            if (items.length === 0) return;
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedFeatureIndex = (selectedFeatureIndex + 1) % items.length;
                    updateSelectedFeature(items);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    selectedFeatureIndex = selectedFeatureIndex <= 0 ? items.length - 1 : selectedFeatureIndex - 1;
                    updateSelectedFeature(items);
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (selectedFeatureIndex >= 0 && items[selectedFeatureIndex]) {
                        const featureId = items[selectedFeatureIndex].dataset.id;
                        const features = Array.from(items).map(item => {
                            // We need to find the actual feature data, which we don't have stored directly
                            // This is a limitation - we'll need to store feature data differently
                            // For now, we'll just use a temporary approach
                            const pos = locationMarker.getLatLng();
                            // This is a simplified approach - in a full implementation, we would
                            // have stored the features in a variable accessible to this function
                        });
                        // Using the stored feature data to select it
                        const featureData = getFeatureDataById(featureId);
                        if (featureData) {
                            selectNearbyFeature(featureData);
                        }
                    }
                    break;
                    
                case 'Escape':
                    // Clear selection
                    items.forEach(item => item.classList.remove('selected'));
                    selectedFeatureIndex = -1;
                    list.blur();
                    break;
            }
        }
        
        // Function to update the selected feature display
        function updateSelectedFeature(items) {
            // Remove selected class from all items
            items.forEach(item => item.classList.remove('selected'));
            
            // Add selected class to the current item
            if (selectedFeatureIndex >= 0 && items[selectedFeatureIndex]) {
                items[selectedFeatureIndex].classList.add('selected');
                
                // Scroll the selected item into view
                items[selectedFeatureIndex].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }
        }
        
        // Helper function to get feature data by ID
        // currentFeatures is declared at the top of initLocationMap for global access

        // Updated render function to store features
        function renderNearbyFeatures(features) {
            // Filter out ignored OSM IDs
            const filteredFeatures = features.filter(f => !IGNORED_OSM_IDS.has(f.id));
            currentFeatures = filteredFeatures; // Store filtered features for search

            const list = document.getElementById('nearby-features-list');
            list.innerHTML = '';

            filteredFeatures.forEach((feature, index) => {
                const li = document.createElement('li');
                li.className = 'nearby-feature-item';
                li.dataset.id = feature.id;
                li.dataset.type = feature.type;
                li.dataset.index = index; // For keyboard navigation
                li.__featureData = feature; // Store the feature data directly on the element
                
                // Calculate distance (simplified)
                const markerPos = locationMarker.getLatLng();
                const featurePos = L.latLng(feature.lat, feature.lng);
                const distance = markerPos.distanceTo(featurePos);
                const distanceText = distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`;
                
                li.innerHTML = `
                    <span class="feature-name">${feature.name}</span>
                    <span class="feature-type">${feature.category} • ${distanceText}</span>
                `;
                
                // Click handler to select the feature
                li.addEventListener('click', () => {
                    selectNearbyFeature(feature);
                    // Clear the selected state from all items
                    document.querySelectorAll('.nearby-feature-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    // Add selected state to this item
                    li.classList.add('selected');
                    selectedFeatureIndex = index; // Update the keyboard index
                });
                
                // Hover handler to highlight on the map
                li.addEventListener('mouseenter', () => {
                    highlightFeatureOnMap(feature);
                });
                
                li.addEventListener('mouseleave', () => {
                    removeFeatureHighlight();
                });
                
                list.appendChild(li);
            });
            
            // Add keyboard navigation to the list container
            list.addEventListener('keydown', handleFeatureListNavigation);
            list.setAttribute('tabindex', '0'); // Make the list focusable for keyboard events
        }
        
        // Helper function to get feature data by ID
        function getFeatureDataById(id) {
            return currentFeatures.find(feature => feature.id == id);
        }
        
        // Function to select a nearby feature
        function selectNearbyFeature(feature) {
            locationMarker.setLatLng([feature.lat, feature.lng]);
            locationMap.setView([feature.lat, feature.lng], 17); // Zoom in slightly
            document.getElementById('location-search').value = feature.name;
            document.getElementById('location-coords').value = `${feature.lat.toFixed(6)}, ${feature.lng.toFixed(6)}`;
            
            // Remove highlight from all list items
            document.querySelectorAll('.nearby-feature-item').forEach(item => {
                item.classList.remove('selected');
            });
        }
        
        // Variables to track map feature highlights
        let highlightedFeature;
        
        // Function to highlight a feature on the map
        function highlightFeatureOnMap(feature) {
            // Remove any existing highlight
            removeFeatureHighlight();
            
            // Add a temporary marker or circle to highlight the feature
            highlightedFeature = L.circle([feature.lat, feature.lng], {
                radius: 10,
                color: '#0091ac',
                fillColor: '#0091ac',
                fillOpacity: 0.7
            }).addTo(locationMap);
        }
        
        // Function to remove feature highlight
        function removeFeatureHighlight() {
            if (highlightedFeature) {
                locationMap.removeLayer(highlightedFeature);
                highlightedFeature = null;
            }
        }
        
        // Add event listener to the refresh button
        document.getElementById('refresh-nearby').addEventListener('click', () => {
            const pos = locationMarker.getLatLng();
            fetchAndDisplayNearbyFeatures(pos.lat, pos.lng);
        });
        
        // Add event listener to the load more button
        document.getElementById('load-more-nearby').addEventListener('click', () => {
            // For now, we'll just increase the radius and refetch
            const pos = locationMarker.getLatLng();
            fetchAndDisplayNearbyFeatures(pos.lat, pos.lng, 400); // Double the radius
        });
        
        // Set up the marker drag event to fetch nearby features
        locationMarker.on('dragend', function(event) {
            const { lat, lng } = locationMarker.getLatLng();
            locationCoordsInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            
            // Debounced fetch to avoid flooding the API
            debouncedFetchNearby(lat, lng);
        });
        
        // Also fetch when clicking on the map
        locationMap.on('click', function(e) {
            locationMarker.setLatLng(e.latlng);
            const { lat, lng } = e.latlng;
            locationCoordsInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            
            // Debounced fetch to avoid flooding the API
            debouncedFetchNearby(lat, lng);
        });
    }
}