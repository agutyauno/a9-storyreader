/* ================================================================================================= */
/* Region Page Script */
/* ================================================================================================= */

// ============= Initialization =============
document.addEventListener('DOMContentLoaded', () => {
	loadRegionData();
});

// ============= Get Region ID from URL =============
function getRegionIdFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('region');
}

// ============= Load Region Data from Supabase =============
async function loadRegionData() {
	const regionId = getRegionIdFromURL();
	if (!regionId) {
		console.error('No region ID in URL');
		return;
	}

	try {
		// Fetch region info
		const region = await SupabaseAPI.getRegion(regionId);
		if (region) {
			updateRegionInfo(region);
		}

		// Fetch arcs for this region
		const arcs = await SupabaseAPI.getArcsByRegion(regionId);
		await renderArcs(arcs);

		// Setup sticky header after content is loaded
		setupRegionStickyHeader();
	} catch (error) {
		console.error('Error loading region data:', error);
		const container = document.getElementById('event_selection-panel');
		if (container) {
			container.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải dữ liệu.</p>';
		}
	}
}

// ============= Update Region Info =============
function updateRegionInfo(region) {
	const infoTitle = document.querySelector('.info-title');
	const infoDescription = document.querySelector('.info-description');
	const stickyTitle = document.querySelector('.region-sticky-title');

	if (infoTitle) infoTitle.textContent = region.name;
	if (infoDescription) infoDescription.textContent = region.description || '';
	if (stickyTitle) stickyTitle.textContent = region.name;

	// Update page title
	document.title = `${region.name} - Arknights Story Reader VN`;
}

// ============= Render Arcs and Events =============
async function renderArcs(arcs) {
	const container = document.getElementById('event_selection-panel');
	if (!container) return;

	if (arcs.length === 0) {
		container.innerHTML = '<p class="no-data">Chưa có dữ liệu cho khu vực này.</p>';
		return;
	}

	const regionId = getRegionIdFromURL();
	let html = '';

	for (const arc of arcs) {
		// Fetch events for this arc
		const events = await SupabaseAPI.getEventsByArc(arc.arc_id);
		
		// Fetch suggestion for this arc
		const suggestion = await SupabaseAPI.getSuggestion(arc.arc_id);

		html += `
			<article class="arc-section">
				<div class="arc-header">
					<div class="arc-info">
						<h3 class="arc-name">${arc.name || ''}</h3>
					</div>
					<p class="arc-description">${arc.description || ''}</p>
				</div>
				<div class="arc-items">
					${renderEvents(events, suggestion, regionId)}
				</div>
			</article>
		`;
	}

	container.innerHTML = html;
}

// ============= Render Events with Suggestion =============
function renderEvents(events, suggestion, regionId) {
	if (events.length === 0) {
		return '<p class="no-data">Chưa có sự kiện.</p>';
	}

	let html = '';
	let suggestionInserted = false;
	const regionParam = regionId ? `&region=${encodeURIComponent(regionId)}` : '';

	events.forEach((event, index) => {
		// Insert suggestion at the specified position
		if (suggestion && !suggestionInserted && suggestion.position <= index) {
			html += `
				<div class="arc-suggestion">
					<a href="../event_page/index.html?event=${suggestion.target_event_id}${regionParam}" class="suggestion-text">
						Gợi ý: Đọc tiếp tại đây...
					</a>
				</div>
			`;
			suggestionInserted = true;
		}

		html += `
			<a class="selection-panel-item" href="../event_page/index.html?event=${event.event_id}${regionParam}">
				<img src="${event.image_url || '../assets/images/icon/default.png'}" alt="${event.name}">
				<div class="selection-content">
					<p class="event_name name">${event.name}</p>
					<p class="event_description description">${event.description || ''}</p>
				</div>
			</a>
		`;
	});

	// Insert suggestion at the end if not yet inserted and position is after all events
	if (suggestion && !suggestionInserted) {
		html += `
			<div class="arc-suggestion">
				<a href="../event_page/index.html?event=${suggestion.target_event_id}${regionParam}" class="suggestion-text">
					Gợi ý: Đọc tiếp tại đây...
				</a>
			</div>
		`;
	}

	return html;
}

// ============= Sticky Header =============
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

