/* ================================================================================================= */
/* Supabase Client Configuration */
/* ================================================================================================= */

const SUPABASE_URL = 'https://parvlcffmaufvyaoyica.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bXR2KzMrDFAeIxr9d4BLlg_DDF2OkQv';

/**
 * Supabase REST API client for browser
 * Provides methods to interact with Supabase database tables
 */
let _authToken = null;

const SupabaseClient = {
	setAuthToken(token) {
		_authToken = token;
	},
	/**
	 * Make a GET request to Supabase REST API
	 * @param {string} table - Table name
	 * @param {Object} options - Query options
	 * @param {string} options.select - Columns to select (default: '*')
	 * @param {Array} options.filters - Array of filter objects [{column, operator, value}]
	 * @param {string} options.order - Column to order by
	 * @param {boolean} options.ascending - Order direction (default: true)
	 * @param {number} options.limit - Limit number of results
	 * @returns {Promise<Array>} - Array of records
	 */
	async get(table, options = {}) {
		const {
			select = '*',
			filters = [],
			order = null,
			ascending = true,
			limit = null
		} = options;

		let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;

		// Add filters
		filters.forEach(filter => {
			const { column, operator, value } = filter;
			if (operator === 'in') {
				// Accept value as array or comma/parentheses-delimited string
				let items = value;
				if (!Array.isArray(items)) {
					if (typeof items === 'string') {
						const trimmed = items.trim();
						if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
							items = trimmed.slice(1, -1).split(',').map(s => s.trim());
						} else {
							items = trimmed.split(',').map(s => s.trim());
						}
					} else {
						items = [String(items)];
					}
				}

				// Quote each item for Supabase IN syntax and escape single quotes
				const quoted = items.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
				url += `&${column}=in.(${encodeURIComponent(quoted)})`;
			} else {
				url += `&${column}=${operator}.${encodeURIComponent(value)}`;
			}
		});

		// Add ordering
		if (order) {
			url += `&order=${order}.${ascending ? 'asc' : 'desc'}`;
		}

		// Add limit
		if (limit) {
			url += `&limit=${limit}`;
		}

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'apikey': SUPABASE_ANON_KEY,
				'Authorization': _authToken ? `Bearer ${_authToken}` : `Bearer ${SUPABASE_ANON_KEY}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
		}

		return response.json();
	},

	/**
	 * Get a single record by ID
	 * @param {string} table - Table name
	 * @param {string} column - Column name to filter by
	 * @param {string} value - Value to match
	 * @param {string} select - Columns to select (default: '*')
	 * @returns {Promise<Object|null>} - Single record or null
	 */
	async getOne(table, column, value, select = '*') {
		const results = await this.get(table, {
			select,
			filters: [{ column, operator: 'eq', value }],
			limit: 1
		});
		return results.length > 0 ? results[0] : null;
	}
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
	module.exports = SupabaseClient;
}
