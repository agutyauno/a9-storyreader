/* ================================================================================================= */
/* Supabase Client Configuration */
/* ================================================================================================= */
/**
 * Supabase REST API client for browser
 * Provides methods to interact with Supabase database tables
 */
let _authToken = null;

// Compatibility proxy: prefer window.supabaseClient (SDK) when available,
// otherwise fall back to the original REST-based implementation.
const SupabaseClient = {
	setAuthToken(token) {
		_authToken = token;
		// If SDK is present, set its session (best-effort)
		try {
			if (typeof window !== 'undefined' && window.supabaseClient && window.supabaseClient.auth && typeof window.supabaseClient.auth.setSession === 'function') {
				window.supabaseClient.auth.setSession({ access_token: token }).catch(() => {});
			}
		} catch (e) { /* ignore */ }
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

		// If SDK client is available, use it
		if (typeof window !== 'undefined' && window.supabaseClient) {
			try {
				let q = window.supabaseClient.from(table).select(select);
				// apply filters
				for (const f of filters) {
					const { column, operator, value } = f;
					if (operator === 'eq') q = q.eq(column, value);
					else if (operator === 'neq') q = q.neq(column, value);
					else if (operator === 'lt') q = q.lt(column, value);
					else if (operator === 'lte') q = q.lte(column, value);
					else if (operator === 'gt') q = q.gt(column, value);
					else if (operator === 'gte') q = q.gte(column, value);
					else if (operator === 'like') q = q.like(column, value);
					else if (operator === 'in') {
						const vals = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',').map(s => s.trim()) : [String(value)]);
						q = q.in(column, vals);
					} else {
						// fallback to eq
						q = q.eq(column, value);
					}
				}
				if (order) q = q.order(order, { ascending: !!ascending });
				if (limit) q = q.limit(limit);
				const { data, error } = await q;
				if (error) throw error;
				return data || [];
			} catch (e) {
				console.warn('SupabaseClient.proxy.get: SDK query failed, falling back to REST', e);
				// continue to REST fallback
			}
		}

		// REST fallback (original behavior)
		let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;

		// Add filters
		filters.forEach(filter => {
			const { column, operator, value } = filter;
			if (operator === 'in') {
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
				const quoted = items.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
				url += `&${column}=in.(${encodeURIComponent(quoted)})`;
			} else {
				url += `&${column}=${operator}.${encodeURIComponent(value)}`;
			}
		});

		if (order) {
			url += `&order=${order}.${ascending ? 'asc' : 'desc'}`;
		}
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
		// Prefer SDK when available
		if (typeof window !== 'undefined' && window.supabaseClient) {
			try {
				const { data, error } = await window.supabaseClient.from(table).select(select).eq(column, value).limit(1);
				if (error) throw error;
				return Array.isArray(data) && data.length > 0 ? data[0] : null;
			} catch (e) {
				console.warn('SupabaseClient.proxy.getOne: SDK query failed, falling back to REST', e);
				// fallback to REST
			}
		}
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
