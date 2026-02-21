/* ================================================================================================= */
/* Region Page Script */
/* ================================================================================================= */

function setupRegionStickyHeader() {
	const infoSection = document.getElementById('info');
	const stickyHeader = document.getElementById('region-sticky-header');
	const stickyTitle = stickyHeader ? stickyHeader.querySelector('.region-sticky-title') : null;
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
		document.body.classList.toggle('region-sticky-active', shouldShow);
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

document.addEventListener('DOMContentLoaded', () => {
	if (document.getElementById('header-placeholder')) {
		const observer = new MutationObserver(() => {
			if (document.querySelector('header')) {
				observer.disconnect();
				setupRegionStickyHeader();
			}
		});

		observer.observe(document.getElementById('header-placeholder'), {
			childList: true,
			subtree: true
		});
	} else {
		setupRegionStickyHeader();
	}
});
