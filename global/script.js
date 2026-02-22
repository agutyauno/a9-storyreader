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

// ============= Modal System =============
/**
 * Opens a modal with the provided content
 * @param {string} modalId - The ID of the modal element
 * @param {Object} content - Content object with properties to display
 * @param {Object} config - Configuration for which elements to update
 */
function openModal(modalId, content = {}, config = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.warn(`Modal with id "${modalId}" not found`);
        return;
    }

    // Update modal image if provided
    if (content.image && config.imageSelector) {
        const imageElement = modal.querySelector(config.imageSelector || '.modal-image');
        if (imageElement) {
            imageElement.src = content.image;
            if (content.imageAlt) {
                imageElement.alt = content.imageAlt;
            }
        }
    }

    // Update modal title if provided
    if (content.title && config.titleSelector) {
        const titleElement = modal.querySelector(config.titleSelector || '.modal-title');
        if (titleElement) {
            titleElement.textContent = content.title;
        }
    }

    // Update modal description if provided
    if (content.description && config.descriptionSelector) {
        const descriptionElement = modal.querySelector(config.descriptionSelector || '.modal-description');
        if (descriptionElement) {
            descriptionElement.textContent = content.description;
        }
    }

    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

/**
 * Closes a modal
 * @param {string} modalId - The ID of the modal element to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

/**
 * Sets up modal event handlers for close buttons and escape key
 * @param {Array<string>} modalIds - Array of modal IDs to set up handlers for
 */
function setupModalHandlers(modalIds = []) {
    modalIds.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Close button handler
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeModal(modalId);
            });
        }

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target.getAttribute('data-action') === 'close' || e.target === modal) {
                closeModal(modalId);
            }
        });
    });

    // Close any modal on Escape key (only set up once)
    if (modalIds.length > 0 && !window._modalEscapeHandlerSet) {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modalIds.forEach(modalId => closeModal(modalId));
            }
        });
        window._modalEscapeHandlerSet = true;
    }
}

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
