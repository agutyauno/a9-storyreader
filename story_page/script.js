/* ================================================================================================= */
/* Story Page Script */
/* ================================================================================================= */

// ============= Sticky Header =============
function setupStoryStickyHeader() {
	const infoSection = document.getElementById('info');
	const stickyHeader = document.getElementById('story-sticky-header');
	const stickyTitle = stickyHeader ? stickyHeader.querySelector('.story-sticky-title') : null;
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
		document.body.classList.toggle('story-sticky-active', shouldShow);
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
	setupStoryStickyHeader();
	setupBackgroundParallax();
	setupChapterSidebar();
});

// ============= Chapter Sidebar =============
function setupChapterSidebar() {
	const sidebar = document.getElementById('chapter-sidebar');
	const overlay = document.getElementById('sidebar-overlay');
	const toggleBtn = document.getElementById('sidebar-toggle');
	const stickyToggle = document.querySelector('.sticky-toggle');

	if (!sidebar || !overlay || !toggleBtn) return;

	// Open sidebar
	const openSidebar = () => {
		sidebar.classList.add('active');
		overlay.classList.add('active');
		document.body.style.overflow = 'hidden';
	};

	toggleBtn.addEventListener('click', openSidebar);
	if (stickyToggle) {
		stickyToggle.addEventListener('click', openSidebar);
	}

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
			
			const topValue = progress * maxTop + 30;
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