/* ================================================================================================= */
/* Global JavaScript - Shared across all pages */
/* ================================================================================================= */

// Load header and footer automatically
async function loadHeaderFooter() {
    try {
        // Determine the relative path based on current directory
        const currentPath = window.location.pathname;
        const depth = (currentPath.match(/\//g) || []).length - 1;
        const relativePath = '../'.repeat(depth);
        
        // Load header
        const headerResponse = await fetch(relativePath + 'global/header.html');
        const headerContent = await headerResponse.text();
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = headerContent;
        }
        
        // Load footer
        const footerResponse = await fetch(relativePath + 'global/footer.html');
        const footerContent = await footerResponse.text();
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = footerContent;
        }
    } catch (error) {
        console.error('Error loading header/footer:', error);
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', loadHeaderFooter);

// Tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked button
            button.classList.add('active');
        });
    });
});
