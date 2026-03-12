// repo-viewer-template/viewer.js
let allProjects = [];

async function loadProjects() {
    try {
        const response = await fetch('repo-index.json');
        if (!response.ok) {
            throw new Error('Failed to load repo-index.json');
        }
        allProjects = await response.json();
        // Sort by date descending
        allProjects.sort((a, b) => new Date(b.date) - new Date(a.date));
        renderProjects(allProjects);
    } catch (error) {
        console.error('Error loading projects:', error);
        const grid = document.getElementById('project-grid');
        grid.innerHTML = `
            <div class="empty-state">
                <p>No projects found or repo-index.json is missing.</p>
                <p style="font-size: 0.875rem;">Publish your first report to see it here.</p>
            </div>
        `;
    }
}

function renderProjects(projects) {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '';
    
    if (projects.length === 0) {
        grid.innerHTML = '<div class="empty-state">No projects match your search.</div>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <h2>${project.title}</h2>
            <div class="meta">
                <div class="meta-row">
                    <span class="meta-label">Researcher</span>
                    <span>${project.researcher || 'Anonymous'}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Date</span>
                    <span>${new Date(project.date).toLocaleDateString()}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Persona</span>
                    <span>${project.persona}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Product</span>
                    <span>${project.product || 'N/A'}</span>
                </div>
            </div>
            <div class="links">
                <a href="${project.findingsHtml}" class="btn btn-primary">View Report</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('search').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    const filtered = allProjects.filter(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        p.persona.toLowerCase().includes(searchTerm) ||
        (p.product && p.product.toLowerCase().includes(searchTerm)) ||
        (p.researcher && p.researcher.toLowerCase().includes(searchTerm))
    );
    renderProjects(filtered);
});

loadProjects();
