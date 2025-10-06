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
        const location = document.getElementById('location').value;
        const image = document.getElementById('image').files[0];
        
        // Validate required fields (simplified)
        if (!category || !title || !description || !location) {
            alert('Please fill in all required fields');
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
                        document.getElementById('location').value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
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
        
        // Add a draggable marker
        locationMarker = L.marker([12.9716, 77.5946], {draggable: true}).addTo(locationMap);
        
        const locationInput = document.getElementById('location');
        
        // Update the location input when marker is dragged
        locationMarker.on('dragend', function(event) {
            const { lat, lng } = locationMarker.getLatLng();
            locationInput.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        });
        
        // Update the marker position when the location input changes
        locationInput.addEventListener('change', function() {
            const locationValue = this.value;
            if (locationValue.includes(',')) {
                const [lat, lng] = locationValue.split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                    locationMarker.setLatLng([lat, lng]);
                    locationMap.setView([lat, lng], 15);
                }
            }
        });
        
        // Also update marker when clicking on the map
        locationMap.on('click', function(e) {
            locationMarker.setLatLng(e.latlng);
            locationInput.value = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
        });
    }
}