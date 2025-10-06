// Simple backend API for Civic Issues Hub using Node.js (CommonJS version)
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadDir)) {
    require('fs').mkdirSync(uploadDir, { recursive: true });
}

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'issues.json');

// Initialize data file if it doesn't exist
async function initializeDataFile() {
    const dataDir = path.join(__dirname, 'data');
    if (!require('fs').existsSync(dataDir)) {
        require('fs').mkdirSync(dataDir, { recursive: true });
    }

    try {
        await fs.access(DATA_FILE);
    } catch {
        // File doesn't exist, create it with empty array
        await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
}

// Helper function to read issues
async function readIssues() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading issues:', error);
        return [];
    }
}

// Helper function to write issues
async function writeIssues(issues) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(issues, null, 2));
    } catch (error) {
        console.error('Error writing issues:', error);
    }
}

// Routes

// Get all issues
app.get('/api/issues', async (req, res) => {
    try {
        const issues = await readIssues();
        res.json(issues);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific issue
app.get('/api/issues/:id', async (req, res) => {
    try {
        const issues = await readIssues();
        const issue = issues.find(i => i.id == req.params.id);
        
        if (issue) {
            res.json(issue);
        } else {
            res.status(404).json({ error: 'Issue not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new issue
app.post('/api/issues', upload.single('image'), async (req, res) => {
    try {
        const { category, title, description, location, user_id } = req.body;
        
        // Validate required fields
        if (!category || !title || !description || !location) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const issues = await readIssues();
        
        // Create new issue
        const newIssue = {
            id: Date.now(), // Simple ID generation for MVP
            user_id: user_id || 'anonymous',
            category,
            title,
            description,
            location,
            status: 'New', // Default status
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Add image URL if file was uploaded
        if (req.file) {
            newIssue.image_url = `/uploads/${req.file.filename}`;
        }
        
        issues.push(newIssue);
        await writeIssues(issues);
        
        res.status(201).json(newIssue);
    } catch (error) {
        console.error('Error creating issue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update an issue (for editorial dashboard)
app.put('/api/issues/:id', async (req, res) => {
    try {
        const { status, editor_notes, related_articles } = req.body;
        const issues = await readIssues();
        const issueIndex = issues.findIndex(i => i.id == req.params.id);
        
        if (issueIndex === -1) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        
        // Update only allowed fields
        if (status) issues[issueIndex].status = status;
        if (editor_notes !== undefined) issues[issueIndex].editor_notes = editor_notes;
        if (related_articles !== undefined) issues[issueIndex].related_articles = related_articles;
        issues[issueIndex].updatedAt = new Date().toISOString();
        
        await writeIssues(issues);
        res.json(issues[issueIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete an issue
app.delete('/api/issues/:id', async (req, res) => {
    try {
        const issues = await readIssues();
        const filteredIssues = issues.filter(i => i.id != req.params.id);
        
        if (filteredIssues.length === issues.length) {
            return res.status(404).json({ error: 'Issue not found' });
        }
        
        await writeIssues(filteredIssues);
        res.status(204).send(); // No content
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from src directory
app.use(express.static(path.join(__dirname, 'src')));

// Initialize data file and start server
initializeDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`API endpoints available at http://localhost:${PORT}/api/`);
    });
}).catch(err => {
    console.error('Failed to initialize data file:', err);
});