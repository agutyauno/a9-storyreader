/* ================================================================================================= */
/* Home Page Script */
/* ================================================================================================= */

document.addEventListener('DOMContentLoaded', () => {
	loadRegions();
	setupTabs();
});

// ============= Load Regions from Supabase =============
async function loadRegions() {
	const regionsList = document.getElementById('regions-list');
	if (!regionsList) return;

	try {
		const regions = await SupabaseAPI.getRegions();

		if (regions.length === 0) {
			regionsList.innerHTML = '<p class="no-data">Chưa có dữ liệu khu vực.</p>';
			return;
		}

		regionsList.innerHTML = regions.map(region => `
			<a class="selection-panel-item" href="../region_page/index.html?region=${region.region_id}">
				<img src="${region.icon_url || '../assets/images/icon/default.png'}" alt="${region.name}">
				<div class="selection-content">
					<p class="region_name name">${region.name}</p>
					<p class="region_description description">${region.description || ''}</p>
				</div>
			</a>
		`).join('');
	} catch (error) {
		console.error('Error loading regions:', error);
		regionsList.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải dữ liệu.</p>';
	}
}

// ============= Tab Functionality =============
function setupTabs() {
	const tabButtons = document.querySelectorAll('.tab-button');
	const tabContents = document.querySelectorAll('.tab-content');

	tabButtons.forEach(button => {
		button.addEventListener('click', () => {
			const targetTab = button.getAttribute('data-tab');

			// Remove active from all buttons and contents
			tabButtons.forEach(btn => btn.classList.remove('active'));
			tabContents.forEach(content => content.classList.remove('active'));

			// Add active to clicked button and corresponding content
			button.classList.add('active');
			const targetContent = document.getElementById(targetTab);
			if (targetContent) {
				targetContent.classList.add('active');
			}
		});
	});
}
