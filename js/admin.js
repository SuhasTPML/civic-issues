// Admin Dashboard JavaScript

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize view switching
    initViewSwitching();
    
    // Load issues
    loadIssues();
    
    // Load stats
    loadStats();
    
    // Initialize modal
    initModal();
    
    // Add event listeners for filters
    document.getElementById('status-filter-admin').addEventListener('change', loadIssues);
    document.getElementById('category-filter-admin').addEventListener('change', loadIssues);
    document.getElementById('refresh-issues').addEventListener('click', loadIssues);
});

// View switching functionality for admin
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
            showAdminView(viewId);
        });
    });
}

// Show specific admin view
function showAdminView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) {
        selectedView.classList.add('active');
    }
}

// Load issues from the API
async function loadIssues() {
    try {
        // For MVP, we'll use mock data stored in localStorage
        // In a real implementation, this would be an API call
        const issues = JSON.parse(localStorage.getItem('civicIssues') || '[]');
        
        // Apply filters if any
        const statusFilter = document.getElementById('status-filter-admin').value;
        const categoryFilter = document.getElementById('category-filter-admin').value;
        
        let filteredIssues = issues;
        
        if (statusFilter) {
            filteredIssues = filteredIssues.filter(issue => issue.status === statusFilter);
        }
        
        if (categoryFilter) {
            filteredIssues = filteredIssues.filter(issue => issue.category === categoryFilter);
        }
        
        renderIssuesTable(filteredIssues);
    } catch (error) {
        console.error('Error loading issues:', error);
        alert('Error loading issues');
    }
}

// Render issues in the table
function renderIssuesTable(issues) {
    const tbody = document.getElementById('issues-tbody');
    
    if (!issues || issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No issues found</td></tr>';
        return;
    }
    
    tbody.innerHTML = issues.map(issue => `
        <tr>
            <td>${issue.id}</td>
            <td>${issue.category}</td>
            <td>${issue.title}</td>
            <td>${issue.description.substring(0, 50)}${issue.description.length > 50 ? '...' : ''}</td>
            <td>${issue.location}</td>
            <td><span class="status-badge status-${issue.status.toLowerCase()}">${issue.status}</span></td>
            <td>${new Date(issue.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-view" onclick="viewIssue(${issue.id})">View</button>
                    <button class="action-btn btn-edit" onclick="editIssue(${issue.id})">Edit</button>
                    <button class="action-btn btn-delete" onclick="deleteIssue(${issue.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load statistics
async function loadStats() {
    try {
        // For MVP, we'll use mock data stored in localStorage
        const issues = JSON.parse(localStorage.getItem('civicIssues') || '[]');
        
        // Calculate stats
        const total = issues.length;
        const newCount = issues.filter(i => i.status === 'New').length;
        const publishedCount = issues.filter(i => i.status === 'Published').length;
        const resolvedCount = issues.filter(i => i.status === 'Resolved').length;
        
        // Update the display
        document.getElementById('total-issues-count').textContent = total;
        document.getElementById('new-issues-count').textContent = newCount;
        document.getElementById('published-issues-count').textContent = publishedCount;
        document.getElementById('resolved-issues-count').textContent = resolvedCount;
        
        // Draw category chart
        drawCategoryChart(issues);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Draw category chart
function drawCategoryChart(issues) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Count issues by category
    const categoryCounts = {};
    issues.forEach(issue => {
        categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
    });
    
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    
    // Destroy existing chart if it exists
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    // Create new chart
    window.categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Issues',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 205, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 205, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Issues by Category'
                }
            }
        }
    });
}

// Initialize modal functionality
function initModal() {
    const modal = document.getElementById('issue-modal');
    const span = document.getElementsByClassName('close')[0];
    
    // Close modal when clicking on the 'x'
    span.onclick = function() {
        modal.style.display = 'none';
    }
    
    // Close modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
    
    // Add event listeners to modal action buttons
    document.getElementById('verify-issue').addEventListener('click', function() {
        updateIssueStatus(window.currentIssueId, 'Verified');
    });
    
    document.getElementById('publish-issue').addEventListener('click', function() {
        updateIssueStatus(window.currentIssueId, 'Published');
    });
    
    document.getElementById('reject-issue').addEventListener('click', function() {
        updateIssueStatus(window.currentIssueId, 'Rejected');
    });
    
    document.getElementById('resolve-issue').addEventListener('click', function() {
        updateIssueStatus(window.currentIssueId, 'Resolved');
    });
}

// View issue details in modal
function viewIssue(issueId) {
    // For MVP, we'll get the issue from localStorage
    const issues = JSON.parse(localStorage.getItem('civicIssues') || '[]');
    const issue = issues.find(i => i.id == issueId);
    
    if (!issue) {
        alert('Issue not found');
        return;
    }
    
    // Store the current issue ID for use in actions
    window.currentIssueId = issueId;
    
    // Display issue details in modal
    const detailsDiv = document.getElementById('issue-details');
    detailsDiv.innerHTML = `
        <h3>${issue.title}</h3>
        <p><strong>Category:</strong> <span class="category-tag">${issue.category}</span></p>
        <p><strong>Status:</strong> <span class="status-badge status-${issue.status.toLowerCase()}">${issue.status}</span></p>
        <p><strong>Location:</strong> ${issue.location}</p>
        <p><strong>Description:</strong> ${issue.description}</p>
        <p><strong>Reported:</strong> ${new Date(issue.createdAt).toLocaleString()}</p>
        ${issue.image ? `<img src="${issue.image}" alt="Issue Image">` : ''}
        <div class="form-group">
            <label for="editor-notes">Editor Notes:</label>
            <textarea id="editor-notes" placeholder="Add notes about this issue">${issue.editor_notes || ''}</textarea>
        </div>
        <div class="form-group">
            <label for="related-articles">Related Articles (comma separated URLs):</label>
            <input type="text" id="related-articles" placeholder="https://example.com/article" value="${(issue.related_articles || []).join(', ')}">
        </div>
    `;
    
    // Show the modal
    document.getElementById('issue-modal').style.display = 'block';
}

// Edit issue (opens the same modal as view but for editing)
function editIssue(issueId) {
    // For MVP, we'll just call the view function which also allows editing
    viewIssue(issueId);
}

// Delete issue
async function deleteIssue(issueId) {
    if (!confirm('Are you sure you want to delete this issue?')) {
        return;
    }
    
    try {
        // For MVP, we'll update localStorage
        let issues = JSON.parse(localStorage.getItem('civicIssues') || '[]');
        issues = issues.filter(issue => issue.id != issueId);
        localStorage.setItem('civicIssues', JSON.stringify(issues));
        
        // Reload the issues table
        loadIssues();
        
        // Update stats
        loadStats();
        
        alert('Issue deleted successfully');
    } catch (error) {
        console.error('Error deleting issue:', error);
        alert('Error deleting issue');
    }
}

// Update issue status
async function updateIssueStatus(issueId, newStatus) {
    try {
        // Get editor notes and related articles from the modal
        const editorNotes = document.getElementById('editor-notes')?.value || '';
        const relatedArticlesInput = document.getElementById('related-articles')?.value || '';
        const relatedArticles = relatedArticlesInput ? relatedArticlesInput.split(',').map(url => url.trim()) : [];
        
        // For MVP, we'll update localStorage
        let issues = JSON.parse(localStorage.getItem('civicIssues') || '[]');
        const issueIndex = issues.findIndex(issue => issue.id == issueId);
        
        if (issueIndex !== -1) {
            issues[issueIndex].status = newStatus;
            issues[issueIndex].editor_notes = editorNotes;
            issues[issueIndex].related_articles = relatedArticles;
            issues[issueIndex].updatedAt = new Date().toISOString();
            
            localStorage.setItem('civicIssues', JSON.stringify(issues));
            
            // Close the modal
            document.getElementById('issue-modal').style.display = 'none';
            
            // Reload the issues table
            loadIssues();
            
            // Update stats
            loadStats();
            
            alert(`Issue status updated to ${newStatus}`);
        } else {
            alert('Issue not found');
        }
    } catch (error) {
        console.error('Error updating issue status:', error);
        alert('Error updating issue status');
    }
}