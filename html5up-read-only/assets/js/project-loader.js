/**
 * Project Loader
 * This script loads individual project files from the projects directory
 * and displays them in the project container.
 */

document.addEventListener('DOMContentLoaded', function() {
    loadProjects();
});

async function loadProjects() {
    const projectContainer = document.getElementById('project-container');
    
    if (!projectContainer) {
        console.error('Project container not found in the DOM');
        return;
    }
    
    // Show loading indicator
    projectContainer.innerHTML = '<p>Loading projects...</p>';
    
    try {
        // Fetch the project list
        const response = await fetch('projects/project_list.json');
        if (!response.ok) {
            throw new Error(`Failed to load project list: ${response.status} ${response.statusText}`);
        }
        
        const projectList = await response.json();
        
        // Sort projects by order (if specified) or by name
        projectList.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            } else if (a.order !== undefined) {
                return -1;
            } else if (b.order !== undefined) {
                return 1;
            } else {
                return a.filename.localeCompare(b.filename);
            }
        });
        
        // Clear loading message
        projectContainer.innerHTML = '';
        
        // Load each project
        const projectPromises = projectList.map(project => loadProject(project.filename));
        const projects = await Promise.all(projectPromises);
        
        // Filter out null projects (failed to load)
        const validProjects = projects.filter(project => project !== null);
        
        // Add each project to the container
        validProjects.forEach(project => {
            const article = createProjectArticle(project);
            projectContainer.appendChild(article);
        });
        
        // If no projects were loaded, show a message
        if (validProjects.length === 0) {
            projectContainer.innerHTML = '<p>No projects found.</p>';
        }
        
        // Log success message
        console.log(`Successfully loaded ${validProjects.length} projects`);
    } catch (error) {
        console.error('Error loading projects:', error);
        projectContainer.innerHTML = `<p>Error loading projects: ${error.message}</p>`;
    }
}

async function loadProject(filename) {
    try {
        const response = await fetch(`projects/${filename}`);
        if (!response.ok) {
            console.error(`Failed to load project file: ${filename}`);
            return null;
        }
        
        const text = await response.text();
        
        // Parse the project file based on its extension
        let project;
        if (filename.endsWith('.json')) {
            project = JSON.parse(text);
        } else if (filename.endsWith('.html')) {
            // For HTML files, extract metadata from comments
            // Added import for parseHtmlProject
            import('./html-parser').then(module => {
                project = module.parseHtmlProject(text, filename);
            });
        } else if (filename.endsWith('.md')) {
            // For markdown files, extract frontmatter
            // Added import for parseMarkdownProject
            import('./markdown-parser').then(module => {
                project = module.parseMarkdownProject(text, filename);
            });
        } else {
            console.error(`Unsupported project file format: ${filename}`);
            return null;
        }
        
        // Override the link to point to our generated project page
        const pageFilename = filename.replace(/\.(json|md|html)$/, '.html');
        project.link = `project-pages/${pageFilename}`;
        
        return project;
    } catch (error) {
        console.error(`Error loading project ${filename}:`, error);
        return null;
    }
}
function parseHtmlProject(html, filename) {
    // Simple parser for HTML files with metadata in comments
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const imageMatch = html.match(/<!-- image: (.*?) -->/);
    const linkMatch = html.match(/<!-- link: (.*?) -->/);
    const descMatch = html.match(/<!-- description: (.*?) -->/);
    
    return {
        title: titleMatch ? titleMatch[1] : filename.replace(/\.html$/, '').replace(/-/g, ' '),
        image: imageMatch ? imageMatch[1] : 'images/placeholder.jpg',
        link: linkMatch ? linkMatch[1] : `projects/${filename}`,
        description: descMatch ? descMatch[1] : 'No description available'
    };
}

function parseMarkdownProject(markdown, filename) {
    // Simple parser for markdown files with frontmatter
    const frontmatterMatch = markdown.match(/---\s+([\s\S]*?)\s+---/);
    
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        
        const titleMatch = frontmatter.match(/title:\s*(.*)/);
        const imageMatch = frontmatter.match(/image:\s*(.*)/);
        const linkMatch = frontmatter.match(/link:\s*(.*)/);
        const descMatch = frontmatter.match(/description:\s*(.*)/);
        
        return {
            title: titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/, '').replace(/-/g, ' '),
            image: imageMatch ? imageMatch[1].trim() : 'images/placeholder.jpg',
            link: linkMatch ? linkMatch[1].trim() : `projects/${filename}`,
            description: descMatch ? descMatch[1].trim() : 'No description available'
        };
    } else {
        // No frontmatter found, use filename as title
        return {
            title: filename.replace(/\.md$/, '').replace(/-/g, ' '),
            image: 'images/placeholder.jpg',
            link: `projects/${filename}`,
            description: 'No description available'
        };
    }
}

function createProjectArticle(project) {
    const article = document.createElement('article');
    
    // Add a class to the article for styling
    article.className = 'project-item';
    
    // Create the HTML structure for the project
    article.innerHTML = `
        <a href="${project.link}" class="image">
            <img src="${project.image}" alt="${project.title}" />
        </a>
        <div class="inner">
            <h4>${project.title}</h4>
            <p>${project.description}</p>
        </div>
    `;
    
    return article;
}

