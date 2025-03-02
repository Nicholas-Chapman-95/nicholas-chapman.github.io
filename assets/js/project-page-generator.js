/**
 * Project Page Generator
 * This script generates individual HTML pages for each project
 * 
 * Run this script with Node.js whenever you update your projects
 */

import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked'; // You'll need to install this: npm install marked

async function generateProjectPages() {
  try {
    // Paths (adjust if needed)
    const projectsDir = './html5up-read-only/projects';
    const outputDir = './html5up-read-only/project-pages';
    const templatePath = './html5up-read-only/project-template.html';
    
    // Create output directory if it doesn't exist
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    // Read template
    const template = await fs.readFile(templatePath, 'utf8');
    
    // Read project list
    const projectListData = await fs.readFile(path.join(projectsDir, 'project_list.json'), 'utf8');
    const projectList = JSON.parse(projectListData);
    
    // Process each project
    for (const project of projectList) {
      const filename = project.filename;
      const projectData = await fs.readFile(path.join(projectsDir, filename), 'utf8');
      
      let projectInfo = {};
      let content = '';
      
      // Parse project data based on file type
      if (filename.endsWith('.json')) {
        projectInfo = JSON.parse(projectData);
        
        // Generate content from JSON details
        if (projectInfo.details) {
          content = `<p>${projectInfo.description}</p>`;
          
          if (projectInfo.details.technologies) {
            content += `<h3>Technologies</h3><ul>`;
            projectInfo.details.technologies.forEach(tech => {
              content += `<li>${tech}</li>`;
            });
            content += `</ul>`;
          }
          
          if (projectInfo.details.keyFeatures) {
            content += `<h3>Key Features</h3><ul>`;
            projectInfo.details.keyFeatures.forEach(feature => {
              content += `<li>${feature}</li>`;
            });
            content += `</ul>`;
          }
          
          if (projectInfo.details.impact) {
            content += `<h3>Impact</h3><p>${projectInfo.details.impact}</p>`;
          }
        }
      } else if (filename.endsWith('.md')) {
        // Parse markdown frontmatter
        const frontmatterMatch = projectData.match(/---\s+([\s\S]*?)\s+---/);
        
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          
          const titleMatch = frontmatter.match(/title:\s*(.*)/);
          const imageMatch = frontmatter.match(/image:\s*(.*)/);
          const linkMatch = frontmatter.match(/link:\s*(.*)/);
          const descMatch = frontmatter.match(/description:\s*(.*)/);
          
          projectInfo = {
            title: titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/, '').replace(/-/g, ' '),
            image: imageMatch ? imageMatch[1].trim() : 'images/placeholder.jpg',
            link: linkMatch ? linkMatch[1].trim() : `#`,
            description: descMatch ? descMatch[1].trim() : 'No description available'
          };
          
          // Convert markdown content to HTML (excluding frontmatter)
          const markdownContent = projectData.replace(/---\s+[\s\S]*?\s+---/, '').trim();
          content = marked(markdownContent);
        }
      } else if (filename.endsWith('.html')) {
        // Parse HTML metadata from comments
        const titleMatch = projectData.match(/<title>(.*?)<\/title>/);
        const imageMatch = projectData.match(/<!-- image: (.*?) -->/);
        const linkMatch = projectData.match(/<!-- link: (.*?) -->/);
        const descMatch = projectData.match(/<!-- description: (.*?) -->/);
        
        projectInfo = {
          title: titleMatch ? titleMatch[1] : filename.replace(/\.html$/, '').replace(/-/g, ' '),
          image: imageMatch ? imageMatch[1] : 'images/placeholder.jpg',
          link: linkMatch ? linkMatch[1] : `#`,
          description: descMatch ? descMatch[1] : 'No description available'
        };
        
        // Extract HTML content (body content)
        const bodyMatch = projectData.match(/<body>([\s\S]*?)<\/body>/);
        if (bodyMatch) {
          content = bodyMatch[1];
        }
      }
      
      // Skip if we couldn't parse the project
      if (!projectInfo.title) {
        console.log(`Skipping ${filename}: Could not parse project info`);
        continue;
      }
      
      // Generate page HTML
      let pageHtml = template
        .replace(/{{PROJECT_TITLE}}/g, projectInfo.title)
        .replace(/{{PROJECT_IMAGE}}/g, projectInfo.image)
        .replace(/{{PROJECT_CONTENT}}/g, content || `<p>${projectInfo.description}</p>`);
      
      // Write the page file
      const outputFilename = path.join(outputDir, filename.replace(/\.(json|md|html)$/, '.html'));
      await fs.writeFile(outputFilename, pageHtml);
      
      console.log(`Generated page for ${projectInfo.title}: ${outputFilename}`);
    }
    
    console.log('Project pages generated successfully!');
  } catch (error) {
    console.error('Error generating project pages:', error);
  }
}

// Run the generator
generateProjectPages();