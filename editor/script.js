/* ================================================================================================= */
/* Story Editor - Tree Sidebar Manager */
/* ================================================================================================= */

// Mock data structure matching Supabase database schema
const mockStoryData = [
    {
        // Region 1
        id: 1,
        region_id: 'region-rhodes',
        name: 'Rhodes Island',
        type: 'region',
        description: 'The mobile city-state Rhodes Island, dedicated to helping the Infected',
        icon_url: '../assets/images/icon/dreambind castle.png',
        display_order: 2,
        children: [
            {
                // Arc 1
                id: 101,
                arc_id: 'arc-rhodes-main',
                region_id: 'region-rhodes',
                name: 'Main Theme',
                type: 'arc',
                description: 'The main storyline of Rhodes Island',
                image_url: '../assets/images/logo/logo.png',
                display_order: 1,
                children: [
                    {
                        // Event 1
                        id: 1001,
                        event_id: 'event-rhodes-01',
                        arc_id: 'arc-rhodes-main',
                        name: 'Awakening',
                        type: 'event',
                        description: 'The Doctor awakens from cryosleep',
                        image_url: null,
                        display_order: 1,
                        children: [
                            {
                                // Story 1
                                id: 10001,
                                story_id: 'story-rhodes-01-01',
                                event_id: 'event-rhodes-01',
                                name: 'Prologue - Emergency',
                                type: 'story',
                                description: 'The beginning of the journey',
                                display_order: 1,
                                story_content: {
                                    scenes: [],
                                    characters: ['char-amiya', 'char-doctor']
                                }
                            },
                            {
                                // Story 2
                                id: 10002,
                                story_id: 'story-rhodes-01-02',
                                event_id: 'event-rhodes-01',
                                name: 'First Mission',
                                type: 'story',
                                description: 'Meeting the operators',
                                display_order: 2,
                                story_content: {
                                    scenes: [],
                                    characters: ['char-amiya', 'char-doctor']
                                }
                            }
                        ]
                    },
                    {
                        // Event 2
                        id: 1002,
                        event_id: 'event-rhodes-02',
                        arc_id: 'arc-rhodes-main',
                        name: 'Chernobog',
                        type: 'event',
                        description: 'The tragedy at Chernobog',
                        image_url: null,
                        display_order: 2,
                        children: [
                            {
                                // Story 3
                                id: 10003,
                                story_id: 'story-rhodes-02-01',
                                event_id: 'event-rhodes-02',
                                name: 'Escape Plan',
                                type: 'story',
                                description: 'Planning the escape from Chernobog',
                                display_order: 1,
                                story_content: {
                                    scenes: [],
                                    characters: []
                                }
                            }
                        ]
                    }
                ]
            },
            {
                // Arc 2
                id: 102,
                arc_id: 'arc-rhodes-side',
                region_id: 'region-rhodes',
                name: 'Side Stories',
                type: 'arc',
                description: 'Stories of individual operators',
                image_url: null,
                display_order: 2,
                children: [
                    {
                        // Event 3
                        id: 1003,
                        event_id: 'event-rhodes-side-01',
                        arc_id: 'arc-rhodes-side',
                        name: 'Operator Records',
                        type: 'event',
                        description: 'Personal stories of operators',
                        image_url: null,
                        display_order: 1,
                        children: [
                            {
                                // Story 4
                                id: 10004,
                                story_id: 'story-rhodes-side-01-01',
                                event_id: 'event-rhodes-side-01',
                                name: 'Amiya - Leader',
                                type: 'story',
                                description: 'Amiya\'s path as a leader',
                                display_order: 1,
                                story_content: {
                                    scenes: [],
                                    characters: ['char-amiya']
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        // Region 2
        id: 2,
        region_id: 'region-lungmen',
        name: 'Lungmen',
        type: 'region',
        description: 'The prosperous mobile city of Lungmen',
        icon_url: null,
        display_order: 3,
        children: [
            {
                // Arc 3
                id: 201,
                arc_id: 'arc-lungmen-main',
                region_id: 'region-lungmen',
                name: 'Lungmen Downtown',
                type: 'arc',
                description: 'Events in Lungmen\'s city center',
                image_url: null,
                display_order: 1,
                children: [
                    {
                        // Event 4
                        id: 2001,
                        event_id: 'event-lungmen-01',
                        arc_id: 'arc-lungmen-main',
                        name: 'City Incident',
                        type: 'event',
                        description: 'A crisis in the heart of Lungmen',
                        image_url: null,
                        display_order: 1,
                        children: [
                            {
                                // Story 5
                                id: 20001,
                                story_id: 'story-lungmen-01-01',
                                event_id: 'event-lungmen-01',
                                name: 'Arrival at Lungmen',
                                type: 'story',
                                description: 'Rhodes Island arrives at Lungmen',
                                display_order: 1,
                                story_content: {
                                    scenes: [],
                                    characters: []
                                }
                            },
                            {
                                // Story 6
                                id: 20002,
                                story_id: 'story-lungmen-01-02',
                                event_id: 'event-lungmen-01',
                                name: 'Meeting Ch\'en',
                                type: 'story',
                                description: 'First encounter with the Chief of Police',
                                display_order: 2,
                                story_content: {
                                    scenes: [],
                                    characters: ['char-chen']
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        // Region 3
        id: 3,
        region_id: 'region-victoria',
        name: 'Victoria',
        type: 'region',
        description: 'The nation of Victoria and its territories',
        icon_url: null,
        display_order: 4,
        children: [
            {
                // Arc 4
                id: 301,
                arc_id: 'arc-victoria-main',
                region_id: 'region-victoria',
                name: 'Victorian Crisis',
                type: 'arc',
                description: 'The political turmoil in Victoria',
                image_url: null,
                display_order: 1,
                children: [
                    {
                        // Event 5
                        id: 3001,
                        event_id: 'event-victoria-01',
                        arc_id: 'arc-victoria-main',
                        name: 'Shadows Over Victoria',
                        type: 'event',
                        description: 'Dark forces moving in Victoria',
                        image_url: null,
                        display_order: 1,
                        children: [
                            {
                                // Story 7
                                id: 30001,
                                story_id: 'story-victoria-01-01',
                                event_id: 'event-victoria-01',
                                name: 'Investigation Begins',
                                type: 'story',
                                description: 'Starting the investigation in Victoria',
                                display_order: 1,
                                story_content: {
                                    scenes: [],
                                    characters: []
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

// Current selected item
let currentSelected = null;

/* ================================================================================================= */
/* Initialize on DOM load */
document.addEventListener('DOMContentLoaded', initializeEditor);

function initializeEditor() {
    // Setup tab switching
    setupTabSwitching();
    
    // Render the story tree
    renderStoryTree();
    
    // Setup tree interactions
    setupTreeInteractions();
    
    // Setup toolbar buttons
    setupToolbarButtons();
    
    // Setup modal
    setupModal();
}

/* ================================================================================================= */
/* Tab Switching */
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.sidebar-tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName, button);
        });
    });
}

function switchTab(tabName, clickedButton) {
    // Update button states
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedButton.classList.add('active');
    
    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const tabContent = document.querySelector(`.${tabName}_tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

/* ================================================================================================= */
/* Tree Rendering */
function renderStoryTree() {
    const treeContainer = document.getElementById('story-tree');
    treeContainer.innerHTML = '';
    
    // Sort regions by display_order before rendering
    const sortedRegions = sortByDisplayOrder([...mockStoryData]);
    
    sortedRegions.forEach(item => {
        const treeItemElement = createTreeItemElement(item);
        treeContainer.appendChild(treeItemElement);
    });
}

function createTreeItemElement(item, depth = 0) {
    const li = document.createElement('li');
    li.className = 'tree-item';
    li.setAttribute('data-id', item.id);
    li.setAttribute('data-type', item.type);
    li.setAttribute('data-name', item.name);
    li.setAttribute('data-description', item.description || '');
    
    // Store the appropriate ID field based on type
    if (item.type === 'region') li.setAttribute('data-region-id', item.region_id || '');
    if (item.type === 'arc') li.setAttribute('data-arc-id', item.arc_id || '');
    if (item.type === 'event') li.setAttribute('data-event-id', item.event_id || '');
    if (item.type === 'story') li.setAttribute('data-story-id', item.story_id || '');
    
    // Store display order and image URLs
    if (item.display_order) li.setAttribute('data-display-order', item.display_order);
    if (item.image_url) li.setAttribute('data-image-url', item.image_url);
    if (item.icon_url) li.setAttribute('data-icon-url', item.icon_url);
    
    // Create content wrapper
    const contentDiv = document.createElement('div');
    contentDiv.className = 'tree-item-content';
    
    // Create toggle button (only if has children)
    if (item.children && item.children.length > 0) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'tree-toggle';
        toggleBtn.innerHTML = '▶';
        toggleBtn.setAttribute('aria-expanded', 'false');
        contentDiv.appendChild(toggleBtn);
    } else {
        const emptySpace = document.createElement('div');
        emptySpace.className = 'tree-toggle hidden';
        contentDiv.appendChild(emptySpace);
    }
    
    // Create label
    const labelSpan = document.createElement('span');
    labelSpan.className = 'tree-item-label';
    labelSpan.textContent = item.name;
    contentDiv.appendChild(labelSpan);
    
    li.appendChild(contentDiv);
    
    // Create children container if has children
    if (item.children && item.children.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'tree-children';
        
        // Sort children by display_order before rendering
        const sortedChildren = sortByDisplayOrder([...item.children]);
        
        sortedChildren.forEach(child => {
            const childElement = createTreeItemElement(child, depth + 1);
            ul.appendChild(childElement);
        });
        
        li.appendChild(ul);
    }
    
    return li;
}

/* ================================================================================================= */
/* Tree Interactions */
function setupTreeInteractions() {
    const sidebar = document.getElementById('left-sidebar');
    
    // Event delegation for tree toggle buttons
    sidebar.addEventListener('click', (event) => {
        const toggleBtn = event.target.closest('.tree-toggle');
        const contentDiv = event.target.closest('.tree-item-content');
        
        if (toggleBtn) {
            event.stopPropagation();
            handleTreeToggle(toggleBtn);
        } else if (contentDiv) {
            event.stopPropagation();
            handleTreeItemSelect(contentDiv);
        }
    });
}

function handleTreeToggle(toggleBtn) {
    const li = toggleBtn.closest('.tree-item');
    
    if (!li) return;
    
    const isExpanded = li.classList.contains('expanded');
    
    if (isExpanded) {
        li.classList.remove('expanded');
        toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
        li.classList.add('expanded');
        toggleBtn.setAttribute('aria-expanded', 'true');
    }
}

function handleTreeItemSelect(contentDiv) {
    const li = contentDiv.closest('.tree-item');
    
    if (!li) return;
    
    // Remove previous selection
    document.querySelectorAll('.tree-item-content.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Add selection to clicked item
    contentDiv.classList.add('selected');
    currentSelected = li;
    
    // Update toolbar state based on selected type
    const selectedType = li.getAttribute('data-type');
    updateToolbarState(selectedType);
    
    // Load into editor (placeholder for future implementation)
    loadItemIntoEditor(li);
}

function loadItemIntoEditor(treeItemElement) {
    const id = treeItemElement.getAttribute('data-id');
    const type = treeItemElement.getAttribute('data-type');
    const name = treeItemElement.getAttribute('data-name');
    const description = treeItemElement.getAttribute('data-description');
    
    // Get the appropriate ID field based on type
    let specificId = id;
    if (type === 'region') specificId = treeItemElement.getAttribute('data-region-id');
    if (type === 'arc') specificId = treeItemElement.getAttribute('data-arc-id');
    if (type === 'event') specificId = treeItemElement.getAttribute('data-event-id');
    if (type === 'story') specificId = treeItemElement.getAttribute('data-story-id');
    
    const editorSection = document.getElementById('editor');
    
    // Placeholder content - will be replaced with actual editor functionality
    editorSection.innerHTML = `
        <div style="padding: var(--spacing-base); color: var(--color-text-primary);">
            <h2 style="margin-bottom: var(--spacing-sm);">${escapeHtml(name)}</h2>
            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--spacing-base);">
                Type: ${capitalizeType(type)} | ${capitalizeType(type)} ID: ${escapeHtml(specificId)}
            </p>
            ${description ? `<p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-lg);">${escapeHtml(description)}</p>` : ''}
            <hr style="border: none; border-top: 1px solid var(--color-border); margin: var(--spacing-lg) 0;">
            <p style="color: var(--color-text-tertiary); font-style: italic;">Editor content for <strong>${escapeHtml(name)}</strong> will be loaded here.</p>
            <p style="color: var(--color-text-tertiary); font-size: var(--font-size-xs); margin-top: var(--spacing-base);">This will connect to Supabase to load/save ${type} data.</p>
        </div>
    `;
}

/* ================================================================================================= */
/* Utility Functions */
function sortByDisplayOrder(items) {
    return items.sort((a, b) => {
        // If both have display_order, sort by it
        if (a.display_order !== null && a.display_order !== undefined && 
            b.display_order !== null && b.display_order !== undefined) {
            return a.display_order - b.display_order;
        }
        // Items with display_order come before items without
        if (a.display_order !== null && a.display_order !== undefined) return -1;
        if (b.display_order !== null && b.display_order !== undefined) return 1;
        // If neither has display_order, maintain original order (stable sort)
        return 0;
    });
}

function capitalizeType(type) {
    return type
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ================================================================================================= */
/* Toolbar Management */
function setupToolbarButtons() {
    const addRegionBtn = document.getElementById('add-region-btn');
    const addArcBtn = document.getElementById('add-arc-btn');
    const addEventBtn = document.getElementById('add-event-btn');
    const addStoryBtn = document.getElementById('add-story-btn');
    
    addRegionBtn.addEventListener('click', () => showAddModal('region', null));
    addArcBtn.addEventListener('click', () => {
        if (currentSelected && currentSelected.getAttribute('data-type') === 'region') {
            showAddModal('arc', currentSelected);
        }
    });
    addEventBtn.addEventListener('click', () => {
        if (currentSelected && currentSelected.getAttribute('data-type') === 'arc') {
            showAddModal('event', currentSelected);
        }
    });
    addStoryBtn.addEventListener('click', () => {
        if (!currentSelected) return;

        const selectedType = currentSelected.getAttribute('data-type');
        if (selectedType === 'event') {
            showAddModal('story', currentSelected);
            return;
        }

        // If a story is selected, add a sibling story under its parent event.
        if (selectedType === 'story') {
            const parentEvent = getParentTreeItemByType(currentSelected, 'event');
            if (parentEvent) {
                showAddModal('story', parentEvent);
            }
        }
    });
}

function updateToolbarState(selectedType) {
    const addArcBtn = document.getElementById('add-arc-btn');
    const addEventBtn = document.getElementById('add-event-btn');
    const addStoryBtn = document.getElementById('add-story-btn');
    
    // Reset all
    addArcBtn.disabled = true;
    addEventBtn.disabled = true;
    addStoryBtn.disabled = true;
    
    // Enable based on selection
    if (selectedType === 'region') {
        addArcBtn.disabled = false;
    } else if (selectedType === 'arc') {
        addEventBtn.disabled = false;
    } else if (selectedType === 'event' || selectedType === 'story') {
        addStoryBtn.disabled = false;
    }
}

function getParentTreeItemByType(treeItem, expectedType) {
    let current = treeItem.parentElement;

    while (current) {
        if (current.classList && current.classList.contains('tree-item')) {
            const type = current.getAttribute('data-type');
            if (type === expectedType) {
                return current;
            }
        }
        current = current.parentElement;
    }

    return null;
}

/* ================================================================================================= */
/* Modal Management */
function setupModal() {
    const modal = document.getElementById('add-item-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('add-item-form');
    
    closeBtn.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', handleAddItem);
    
    // Setup image upload handlers
    setupImageUploadHandlers();
}

function showAddModal(itemType, parentElement) {
    const modal = document.getElementById('add-item-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('add-item-form');
    const itemTypeInput = document.getElementById('item-type');
    const parentIdInput = document.getElementById('parent-id');
    const imageUploadGroup = document.getElementById('image-upload-group');
    const imagePreview = document.getElementById('image-preview');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    // Reset form
    form.reset();
    fileNameDisplay.textContent = '';
    imagePreview.style.display = 'none';
    
    // Reset to file upload option
    document.querySelectorAll('.image-option-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.option === 'file');
    });
    document.getElementById('file-upload-section').style.display = 'block';
    document.getElementById('url-input-section').style.display = 'none';
    
    // Set type and parent
    itemTypeInput.value = itemType;
    parentIdInput.value = parentElement ? parentElement.getAttribute('data-id') : '';
    
    // Show/hide image upload field based on item type
    if (itemType === 'region' || itemType === 'event') {
        imageUploadGroup.style.display = 'block';
    } else {
        imageUploadGroup.style.display = 'none';
    }
    
    // Update title
    modalTitle.textContent = `Add New ${capitalizeType(itemType)}`;
    
    // Show modal
    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('add-item-modal');
    modal.style.display = 'none';
}

function setupImageUploadHandlers() {
    const imageOptionBtns = document.querySelectorAll('.image-option-btn');
    const fileUploadSection = document.getElementById('file-upload-section');
    const urlInputSection = document.getElementById('url-input-section');
    const chooseFileBtn = document.getElementById('choose-file-btn');
    const fileInput = document.getElementById('item-image-file');
    const urlInput = document.getElementById('item-image-url');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    // Toggle between file and URL options
    imageOptionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const option = btn.dataset.option;
            
            // Update button states
            imageOptionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide sections
            if (option === 'file') {
                fileUploadSection.style.display = 'block';
                urlInputSection.style.display = 'none';
                urlInput.value = '';
            } else {
                fileUploadSection.style.display = 'none';
                urlInputSection.style.display = 'block';
                fileInput.value = '';
                fileNameDisplay.textContent = '';
            }
            
            // Hide preview when switching
            imagePreview.style.display = 'none';
        });
    });
    
    // File input handling
    chooseFileBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Show file name
            fileNameDisplay.textContent = `Selected: ${file.name}`;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImg.src = event.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // URL input preview
    urlInput.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
            previewImg.src = url;
            imagePreview.style.display = 'block';
            
            // Handle image load error
            previewImg.onerror = () => {
                imagePreview.style.display = 'none';
            };
        } else {
            imagePreview.style.display = 'none';
        }
    });
}

function handleAddItem(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const itemType = formData.get('type');
    const parentId = formData.get('parentId');
    const name = formData.get('name');
    const description = formData.get('description');
    let displayOrder = formData.get('displayOrder');
    
    // Auto-calculate display_order if not provided
    if (!displayOrder || displayOrder === '') {
        displayOrder = getNextDisplayOrder(itemType, parentId);
    } else {
        displayOrder = parseInt(displayOrder);
    }
    
    // Get image: either from file upload or URL input
    const fileInput = document.getElementById('item-image-file');
    const urlInput = document.getElementById('item-image-url');
    const activeOption = document.querySelector('.image-option-btn.active');
    
    if (activeOption && activeOption.dataset.option === 'file' && fileInput.files[0]) {
        // File upload: read as base64
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Generate new item with image data
            const newItem = createNewItem(itemType, name, description, displayOrder, parentId, imageData);
            
            // Add to data structure
            addItemToDataStructure(newItem, parentId);
            
            // Update UI
            finalizeAddItem(newItem);
        };
        
        reader.readAsDataURL(file);
    } else {
        // URL input or no image
        const imageUrl = urlInput.value.trim() || null;
        
        // Generate new item
        const newItem = createNewItem(itemType, name, description, displayOrder, parentId, imageUrl);
        
        // Add to data structure
        addItemToDataStructure(newItem, parentId);
        
        // Update UI
        finalizeAddItem(newItem);
    }
}

function addItemToDataStructure(newItem, parentId) {
    if (parentId) {
        addItemToParent(newItem, parentId);
    } else {
        // Add as root (region)
        mockStoryData.push(newItem);
    }
}

function finalizeAddItem(newItem) {
    // Re-render tree (event listeners already exist via delegation, no need to re-setup)
    renderStoryTree();
    
    // Clear selection and reset toolbar
    currentSelected = null;
    updateToolbarState(null);
    document.querySelectorAll('.tree-item-content.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Hide modal
    hideModal();
    
    // Show success message (you can implement a toast notification here)
    console.log('Item added successfully:', newItem);
}

function createNewItem(type, name, description, displayOrder, parentId, imageUrl) {
    // Generate IDs
    const dbId = generateDbId(type);
    const specificId = generateSpecificId(type);
    
    const item = {
        id: dbId,
        name: name,
        type: type,
        description: description || null,
        display_order: displayOrder,
        children: []
    };
    
    // Add type-specific fields
    if (type === 'region') {
        item.region_id = specificId;
        item.icon_url = imageUrl || null;
    } else if (type === 'arc') {
        item.arc_id = specificId;
        item.region_id = getParentSpecificId(parentId, 'region');
        item.image_url = null;
    } else if (type === 'event') {
        item.event_id = specificId;
        item.arc_id = getParentSpecificId(parentId, 'arc');
        item.image_url = imageUrl || null;
    } else if (type === 'story') {
        item.story_id = specificId;
        item.event_id = getParentSpecificId(parentId, 'event');
        item.story_content = { scenes: [], characters: [] };
    }
    
    return item;
}

function generateDbId(type) {
    // Get max ID from existing items of this type
    let maxId = 0;
    
    if (type === 'region') {
        maxId = Math.max(...mockStoryData.map(r => r.id), 0);
        return maxId + 1;
    } else if (type === 'arc') {
        mockStoryData.forEach(region => {
            region.children.forEach(arc => {
                maxId = Math.max(maxId, arc.id);
            });
        });
        return maxId + 1;
    } else if (type === 'event') {
        mockStoryData.forEach(region => {
            region.children.forEach(arc => {
                arc.children.forEach(event => {
                    maxId = Math.max(maxId, event.id);
                });
            });
        });
        return maxId + 1;
    } else if (type === 'story') {
        mockStoryData.forEach(region => {
            region.children.forEach(arc => {
                arc.children.forEach(event => {
                    event.children.forEach(story => {
                        maxId = Math.max(maxId, story.id);
                    });
                });
            });
        });
        return maxId + 1;
    }
    
    return maxId + 1;
}

function generateSpecificId(type) {
    // Generate a unique ID string
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${type}-${timestamp}-${random}`;
}

function getParentSpecificId(parentDbId, expectedType) {
    // Find parent and return its specific ID
    const parent = findItemById(parseInt(parentDbId));
    if (parent) {
        if (expectedType === 'region') return parent.region_id;
        if (expectedType === 'arc') return parent.arc_id;
        if (expectedType === 'event') return parent.event_id;
    }
    return null;
}

function findItemById(dbId) {
    // Recursively search for item by database ID
    for (const region of mockStoryData) {
        if (region.id === dbId) return region;
        
        for (const arc of region.children || []) {
            if (arc.id === dbId) return arc;
            
            for (const event of arc.children || []) {
                if (event.id === dbId) return event;
                
                for (const story of event.children || []) {
                    if (story.id === dbId) return story;
                }
            }
        }
    }
    return null;
}

function addItemToParent(newItem, parentDbId) {
    const parent = findItemById(parseInt(parentDbId));
    if (parent && parent.children) {
        parent.children.push(newItem);
    }
}

function getNextDisplayOrder(itemType, parentId) {
    let siblings = [];
    
    if (!parentId) {
        // Getting next display order for regions (root level)
        siblings = mockStoryData;
    } else {
        // Getting next display order for children
        const parent = findItemById(parseInt(parentId));
        if (parent && parent.children) {
            siblings = parent.children;
        }
    }
    
    // Find max display_order among siblings
    const maxOrder = siblings.reduce((max, item) => {
        const order = item.display_order;
        if (order !== null && order !== undefined && order > max) {
            return order;
        }
        return max;
    }, 0);
    
    return maxOrder + 1;
}

/* ================================================================================================= */
