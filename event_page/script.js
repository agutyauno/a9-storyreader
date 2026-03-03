/* ================================================================================================= */
/* Event Page Script */
/* ================================================================================================= */

// ============= Data Storage =============
let characterData = [];
let galleryData = [];

// ============= Get Event ID from URL =============
function getEventIdFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('event');
}

// ============= Load Event Data from Supabase =============
async function loadEventData() {
	const eventId = getEventIdFromURL();
	if (!eventId) {
		console.error('No event ID in URL');
		return;
	}

	try {
		// Fetch event info
		const event = await SupabaseAPI.getEvent(eventId);
		if (event) {
			updateEventInfo(event);
		}

		// Fetch stories, characters, and gallery in parallel
		const [stories, characters, gallery] = await Promise.all([
			SupabaseAPI.getStoriesByEvent(eventId),
			SupabaseAPI.getCharactersByEvent(eventId),
			SupabaseAPI.getGalleryByEvent(eventId)
		]);

		// Store data for modal usage
		characterData = characters.map(c => ({
			id: c.character_id,
			name: c.name,
			avatar: c.avatar_url,
			fullImage: c.image_url,
			description: c.description
		}));

		galleryData = gallery.map(g => ({
			id: g.gallery_id,
			title: g.title,
			image: g.image_url
		}));

		// Render content
		renderStories(stories);
		initializeCharacterList();
		initializeGallery();

		// Setup sticky header after content is loaded
		setupEventStickyHeader();
	} catch (error) {
		console.error('Error loading event data:', error);
		const container = document.getElementById('story_selection-panel');
		if (container) {
			container.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải dữ liệu.</p>';
		}
	}
}

// ============= Update Event Info =============
function updateEventInfo(event) {
	const infoTitle = document.querySelector('.info-title');
	const infoDescription = document.querySelector('.info-description');
	const stickyTitle = document.querySelector('.event-sticky-title');

	if (infoTitle) infoTitle.textContent = event.name;
	if (infoDescription) infoDescription.textContent = event.description || '';
	if (stickyTitle) stickyTitle.textContent = event.name;

	// Update page title
	document.title = `${event.name} - Arknights Story Reader VN`;
}

// ============= Render Stories =============
function renderStories(stories) {
	const container = document.getElementById('story_selection-panel');
	if (!container) return;

	if (stories.length === 0) {
		container.innerHTML = '<p class="no-data">Chưa có truyện cho sự kiện này.</p>';
		return;
	}

	container.innerHTML = stories.map(story => `
		<a href="../story_page/index.html?story=${story.story_id}" class="selection-panel-item">
			${story.name}
		</a>
	`).join('');
}

// ============= Initialize Sections =============
function initializeCharacterList() {
	const characterContainer = document.getElementById('character_list');
	if (!characterContainer) return;

	characterContainer.innerHTML = characterData.map(char => `
		<div class="character-card" data-character-id="${char.id}">
			<img src="${char.avatar}" alt="${char.name}" class="character-avatar">
			<p class="character-name">${char.name}</p>
		</div>
	`).join('');

	// Add click handlers
	document.querySelectorAll('.character-card').forEach(card => {
		card.addEventListener('click', function() {
			const characterId = this.getAttribute('data-character-id');
			const character = characterData.find(c => c.id == characterId);
			if (character) {
				openCharacterModal(character);
			}
		});
	});
}

function initializeGallery() {
	const galleryContainer = document.getElementById('gallery');
	if (!galleryContainer) return;

	galleryContainer.innerHTML = galleryData.map(item => `
		<div class="gallery-item" data-gallery-id="${item.id}">
			<img src="${item.image}" alt="${item.title}" class="gallery-image">
			<div class="gallery-label">${item.title}</div>
		</div>
	`).join('');

	// Add click handlers
	document.querySelectorAll('.gallery-item').forEach(item => {
		item.addEventListener('click', function() {
			const galleryId = this.getAttribute('data-gallery-id');
			const gallery = galleryData.find(g => g.id == galleryId);
			if (gallery) {
				openGalleryModal(gallery);
			}
		});
	});
}

// ============= Modal Functions (Using Global Modal System) =============
function openCharacterModal(character) {
	openModal('character-modal', {
		image: character.fullImage,
		imageAlt: character.name,
		title: character.name,
		description: character.description
	}, {
		imageSelector: '.modal-image',
		titleSelector: '.modal-title',
		descriptionSelector: '.modal-description'
	});
}

function openGalleryModal(gallery) {
	openModal('gallery-modal', {
		image: gallery.image,
		imageAlt: gallery.title,
		title: gallery.title
	}, {
		imageSelector: '.modal-image',
		titleSelector: '.modal-title'
	});
}

// ============= Collapsible Functionality =============
function setupCollapsibleSections() {
	document.querySelectorAll('.collapsible-header').forEach(header => {
		header.addEventListener('click', function() {
			const section = this.getAttribute('data-section');
			const content = document.querySelector(`#${section}_list, #${section}`);
			const button = this.querySelector('.toggle-btn');
			
			if (!content) return;

			content.classList.toggle('collapsed');
			button.setAttribute('aria-expanded', !content.classList.contains('collapsed'));
		});
	});
}

// ============= Modal Event Listeners (Using Global Modal System) =============
function setupModalHandlersForEvent() {
	// Use global setupModalHandlers function
	setupModalHandlers(['character-modal', 'gallery-modal']);
}

// ============= Sticky Header =============
function setupEventStickyHeader() {
	const infoSection = document.getElementById('info');
	const stickyHeader = document.getElementById('event-sticky-header');
	const stickyTitle = stickyHeader ? stickyHeader.querySelector('.event-sticky-title') : null;
	const infoTitle = document.querySelector('.info-title');

	if (!infoSection || !stickyHeader || !stickyTitle) {
		return;
	}

	if (infoTitle && infoTitle.textContent) {
		stickyTitle.textContent = infoTitle.textContent.trim();
	}

	let headerHeight = 0;

	const updateHeaderHeight = () => {
		const globalHeader = document.querySelector('header');
		headerHeight = globalHeader ? globalHeader.offsetHeight : 0;
	};

	const updateStickyState = () => {
		const infoBottom = infoSection.offsetTop + infoSection.offsetHeight;
		const shouldShow = window.scrollY >= (infoBottom - headerHeight);
		document.body.classList.toggle('event-sticky-active', shouldShow);
		stickyHeader.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
	};

	updateHeaderHeight();
	updateStickyState();

	let ticking = false;
	window.addEventListener('scroll', () => {
		if (ticking) {
			return;
		}
		ticking = true;
		window.requestAnimationFrame(() => {
			updateStickyState();
			ticking = false;
		});
	});

	window.addEventListener('resize', () => {
		updateHeaderHeight();
		updateStickyState();
	});
}

// ============= Initialization =============

document.addEventListener('DOMContentLoaded', () => {
	// Load event data from Supabase
	loadEventData();
	
	// Setup collapsible sections
	setupCollapsibleSections();
	
	// Setup modal handlers
	setupModalHandlersForEvent();
});