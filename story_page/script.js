/* ================================================================================================= */
/* Story Page Script */
/* ================================================================================================= */

// ============= Initialization =============
document.addEventListener('DOMContentLoaded', () => {
	setupHeaderTitleUpdate();
	setupBackgroundParallax();
	setupChapterSidebar();
	setupImageModals();
	setupBackToTop();
	setupDecisionChoice();
	setupBGM();
	setupSFX();
});

// ============= Header Title Update =============
function setupHeaderTitleUpdate() {
	const infoSection = document.getElementById('info');
	const headerName = document.querySelector('.header-name');
	const infoTitle = document.querySelector('.info-title');

	if (!infoSection || !headerName || !infoTitle) {
		return;
	}

	const originalTitle = headerName.textContent.trim();
	const storyTitle = infoTitle.textContent.trim();
	let headerHeight = 0;
	let isShowingStoryTitle = false;

	const updateHeaderHeight = () => {
		const globalHeader = document.querySelector('header');
		headerHeight = globalHeader ? globalHeader.offsetHeight : 0;
	};

	const updateHeaderTitle = () => {
		const infoBottom = infoSection.offsetTop + infoSection.offsetHeight;
		const shouldShowStoryTitle = window.scrollY >= (infoBottom - headerHeight);
		
		if (shouldShowStoryTitle !== isShowingStoryTitle) {
			isShowingStoryTitle = shouldShowStoryTitle;
			headerName.textContent = shouldShowStoryTitle ? storyTitle : originalTitle;
		}
	};

	updateHeaderHeight();
	updateHeaderTitle();

	let ticking = false;
	window.addEventListener('scroll', () => {
		if (ticking) {
			return;
		}
		ticking = true;
		window.requestAnimationFrame(() => {
			updateHeaderTitle();
			ticking = false;
		});
	});

	window.addEventListener('resize', () => {
		updateHeaderHeight();
		updateHeaderTitle();
	});
}

// ============= Decision Choice System =============
function setupDecisionChoice() {
	// Find all decision groups
	const decisionGroups = document.querySelectorAll('.decision-group');
	
	decisionGroups.forEach(group => {
		const groupId = group.getAttribute('data-choice-group');
		const decisions = group.querySelectorAll('.decision');
		
		// Get all response dialogues for this group
		const responses = document.querySelectorAll(`.choice-response[data-choice-group="${groupId}"]`);
		
		// Add click handler to each decision
		decisions.forEach(decision => {
			decision.addEventListener('click', () => {
				const choiceValue = decision.getAttribute('data-choice-value');
				
				// Remove selected from other decisions
				decisions.forEach(otherDecision => {
					if (otherDecision !== decision) {
						otherDecision.classList.remove('selected');
					}
				});
				
				// Mark current decision as selected
				decision.classList.add('selected');
				
				// Show corresponding response and hide others
				responses.forEach(response => {
					const responseValue = response.getAttribute('data-choice-response');
					if (responseValue === choiceValue) {
						response.classList.add('active');
					} else {
						response.classList.remove('active');
					}
				});
			});
		});
		
		// Auto-select first choice (choice 1) by default
		const firstDecision = decisions[0];
		if (firstDecision) {
			firstDecision.click();
		}
	});
}

// ============= BGM Setup =============
function setupBGM() {
	// Initialize UI bindings
	if (window.bgmManager && window.bgmManager.initUI()) {
		// Setup scroll-based BGM triggers
		// Elements with data-bgm-id attribute will trigger BGM changes when scrolled into view
		window.bgmManager.setupScrollTriggers({
			selector: '[data-bgm-id]',
			threshold: 0.5,
			rootMargin: '0px 0px 0% 0px'
		});
		
		// Auto-play requires user interaction first (browser policy)
		// The user needs to click the play button to start music
	}
}

// ============= SFX Setup =============
function setupSFX() {
	// Initialize SFX manager with scroll triggers
	if (window.sfxManager) {
		window.sfxManager.init();
	}
}

// ============= Chapter Sidebar =============
function setupChapterSidebar() {
	const sidebar = document.getElementById('chapter-sidebar');
	const overlay = document.getElementById('sidebar-overlay');
	const toggleBtn = document.getElementById('sidebar-toggle');

	if (!sidebar || !overlay || !toggleBtn) return;

	// Open sidebar
	const openSidebar = () => {
		sidebar.classList.add('active');
		overlay.classList.add('active');
	};

	toggleBtn.addEventListener('click', openSidebar);

	// Close sidebar
	const closeSidebar = () => {
		sidebar.classList.remove('active');
		overlay.classList.remove('active');
		document.body.style.overflow = '';
	};

	overlay.addEventListener('click', closeSidebar);

	// Close on Escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && sidebar.classList.contains('active')) {
			closeSidebar();
		}
	});
}

// ============= Background Parallax =============
function setupBackgroundParallax() {
	const dialogueSections = document.querySelectorAll('.dialogue-section');
	
	const updateBackgroundPosition = () => {
		dialogueSections.forEach(section => {
			const wrapper = section.querySelector('.background-wrapper');
			if (!wrapper) return;
			
			const rect = section.getBoundingClientRect();
			const wrapperHeight = wrapper.offsetHeight;
			const viewportHeight = window.innerHeight;
			
			// Tính toán vị trí top để căn giữa màn hình
			// Khi section ở đầu viewport: top = 0
			// Khi cuộn xuống: dần chuyển sang căn giữa
			const maxTop = Math.max(0, (viewportHeight - wrapperHeight) / 2);
			
			// Tính progress dựa trên vị trí section trong viewport
			// 0 = section ở đầu viewport, 1 = đã cuộn xuống đủ
			const scrollThreshold = wrapperHeight / 20; // Khoảng cách cuộn để đạt căn giữa
			const progress = Math.min(1, Math.max(0, -rect.top / scrollThreshold));
			
			const topValue = progress * maxTop + 50;
			wrapper.style.top = `${topValue}px`;
		});
	};
	
	// Cập nhật khi scroll
	let ticking = false;
	window.addEventListener('scroll', () => {
		if (ticking) return;
		ticking = true;
		window.requestAnimationFrame(() => {
			updateBackgroundPosition();
			ticking = false;
		});
	});
	
	// Cập nhật khi resize
	window.addEventListener('resize', updateBackgroundPosition);
	
	// Cập nhật lần đầu
	updateBackgroundPosition();
}

// ============= Image Modals =============
function setupImageModals() {
// Setup modal handlers
setupModalHandlers(['character-modal', 'background-modal']);

// Handle character avatar clicks
document.querySelectorAll('.character_avt').forEach(avatar => {
avatar.addEventListener('click', (e) => {
const imageSrc = avatar.getAttribute('src');
// Skip blank avatars
if (!imageSrc || imageSrc.includes('blank.png')) {
return;
}

// Get full size character image
// Replace _avatar.webp with full image path if needed
const fullImageSrc = imageSrc.replace('_avatar.webp', '.png').replace('_avatar.png', '.png');

const modal = document.getElementById('character-modal');
const modalImage = modal.querySelector('.modal-image');
modalImage.src = fullImageSrc;
modalImage.alt = 'Character Full Image';

modal.classList.add('active');
modal.setAttribute('aria-hidden', 'false');
document.body.style.overflow = 'hidden';
});
});

// Handle expand icon clicks for background image
document.querySelectorAll('.background-wrapper .expand-icon').forEach(expandIcon => {
expandIcon.addEventListener('click', (e) => {
const wrapper = expandIcon.closest('.background-wrapper');
const backgroundImage = wrapper.querySelector('.background-image');
if (!backgroundImage) return;

const imageSrc = backgroundImage.getAttribute('src');
const modal = document.getElementById('background-modal');
const modalImage = modal.querySelector('.modal-image');
modalImage.src = imageSrc;
modalImage.alt = 'Background Image';

modal.classList.add('active');
modal.setAttribute('aria-hidden', 'false');
document.body.style.overflow = 'hidden';
});
});

// Close modals on click
['character-modal', 'background-modal'].forEach(modalId => {
const modal = document.getElementById(modalId);
if (!modal) return;

// Close when clicking outside the image
modal.addEventListener('click', (e) => {
if (e.target === modal) {
modal.classList.remove('active');
modal.setAttribute('aria-hidden', 'true');
document.body.style.overflow = '';
}
});
});
}

// ============= Back to Top Button =============
function setupBackToTop() {
	const backToTopBtn = document.getElementById('back-to-top');
	if (!backToTopBtn) return;

	// Show/hide button based on scroll position
	const toggleVisibility = () => {
		if (window.scrollY > 300) {
			backToTopBtn.classList.add('visible');
		} else {
			backToTopBtn.classList.remove('visible');
		}
	};

	let ticking = false;
	window.addEventListener('scroll', () => {
		if (ticking) return;
		ticking = true;
		window.requestAnimationFrame(() => {
			toggleVisibility();
			ticking = false;
		});
	});

	// Scroll to top on click
	backToTopBtn.addEventListener('click', () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	});

	// Initial check
	toggleVisibility();
}
