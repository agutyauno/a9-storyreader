/* ================================================================================================= */
/* Event Page Script */
/* ================================================================================================= */

// ============= Sample Data =============
const characterData = [
	{
		id: 1,
		name: 'Amiya',
		avatar: '../assets/images/dreambind castle.png',
		fullImage: '../assets/images/dreambind castle.png',
		description: 'Protagonist - The leader of the team'
	},
	{
		id: 2,
		name: 'Doctor',
		avatar: '../assets/images/dreambind castle.png',
		fullImage: '../assets/images/dreambind castle.png',
		description: 'Main character - Strategic advisor'
	},
	{
		id: 3,
		name: 'Exusiai',
		avatar: '../assets/images/dreambind castle.png',
		fullImage: '../assets/images/dreambind castle.png',
		description: 'Combat specialist'
	}
];

const galleryData = [
	{
		id: 1,
		title: 'Main Scene',
		image: '../assets/images/dreambind castle.png'
	},
	{
		id: 2,
		title: 'Background 1',
		image: '../assets/images/dreambind castle.png'
	},
	{
		id: 3,
		title: 'Background 2',
		image: '../assets/images/dreambind castle.png'
	}
];

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

// ============= Modal Functions =============
function openCharacterModal(character) {
	const modal = document.getElementById('character-modal');
	if (!modal) return;

	modal.querySelector('.modal-image').src = character.fullImage;
	modal.querySelector('.modal-image').alt = character.name;
	modal.querySelector('.modal-title').textContent = character.name;
	modal.querySelector('.modal-description').textContent = character.description;
	modal.classList.add('active');
	modal.setAttribute('aria-hidden', 'false');
	document.body.style.overflow = 'hidden';
}

function openGalleryModal(gallery) {
	const modal = document.getElementById('gallery-modal');
	if (!modal) return;

	modal.querySelector('.modal-image').src = gallery.image;
	modal.querySelector('.modal-image').alt = gallery.title;
	modal.querySelector('.modal-title').textContent = gallery.title;
	modal.classList.add('active');
	modal.setAttribute('aria-hidden', 'false');
	document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
	const modal = document.getElementById(modalId);
	if (modal) {
		modal.classList.remove('active');
		modal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
	}
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

// ============= Modal Event Listeners =============
function setupModalHandlers() {
	// Character modal
	const characterModal = document.getElementById('character-modal');
	if (characterModal) {
		characterModal.querySelector('.modal-close').addEventListener('click', () => {
			closeModal('character-modal');
		});

		characterModal.addEventListener('click', (e) => {
			if (e.target.getAttribute('data-action') === 'close') {
				closeModal('character-modal');
			}
		});
	}

	// Gallery modal
	const galleryModal = document.getElementById('gallery-modal');
	if (galleryModal) {
		galleryModal.querySelector('.modal-close').addEventListener('click', () => {
			closeModal('gallery-modal');
		});

		galleryModal.addEventListener('click', (e) => {
			if (e.target.getAttribute('data-action') === 'close') {
				closeModal('gallery-modal');
			}
		});
	}

	// Close modal on Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			closeModal('character-modal');
			closeModal('gallery-modal');
		}
	});
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
	// Initialize character list and gallery
	initializeCharacterList();
	initializeGallery();
	
	// Setup collapsible sections
	setupCollapsibleSections();
	
	// Setup modal handlers
	setupModalHandlers();

	// Setup sticky header
	if (document.getElementById('header-placeholder')) {
		const observer = new MutationObserver(() => {
			if (document.querySelector('header')) {
				observer.disconnect();
				setupEventStickyHeader();
			}
		});

		observer.observe(document.getElementById('header-placeholder'), {
			childList: true,
			subtree: true
		});
	} else {
		setupEventStickyHeader();
	}
});