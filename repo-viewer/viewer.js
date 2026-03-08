// repo-viewer/viewer.js
async function loadProjects() {
    try {
        const response = await fetch('repo-index.json');
        if (!response.ok) {
            throw new Error('Failed to load repo-index.json');
        }
        const projects = await response.json();
        renderProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function renderProjects(projects) {
    const grid = document.getElementById('project-grid');
    grid.innerHTML = '';
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <h2>${project.title}</h2>
            <div class="meta">
                <p>Researcher: ${project.researcher}</p>
                <p>Date: ${project.date}</p>
                <p>Persona: ${project.persona}</p>
                <p>Product: ${project.product || 'N/A'}</p>
            </div>
            <div class="links">
                <a href="${project.findingsHtml}">View Report</a>
                ${project.publishedUrl ? `<a href="${project.publishedUrl}">External Link</a>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

document.getElementById('search').addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    // Re-render filtered projects
});

loadProjects();
