import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_OPERATORS, OPERATOR_CLASSES, FACTIONS, getClassById, getFactionById } from '../utils/mockOperatorData';
import styles from '../styles/OperatorPage.module.css';

export default function OperatorListPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterFaction, setFilterFaction] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Update page title
    React.useEffect(() => {
        document.title = 'Operators - Civilight Eterna Database';
    }, []);

    // Filtered operators
    const filteredOperators = useMemo(() => {
        return MOCK_OPERATORS.filter(op => {
            // Search by name
            if (searchQuery && !op.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // Filter by class
            if (filterClass && op.class !== filterClass) {
                return false;
            }
            // Filter by faction
            if (filterFaction && !op.factions.includes(filterFaction)) {
                return false;
            }
            return true;
        });
    }, [searchQuery, filterClass, filterFaction]);

    // Collect unique factions from operators for filter dropdown
    const availableFactions = useMemo(() => {
        const factionIds = new Set();
        MOCK_OPERATORS.forEach(op => op.factions.forEach(f => factionIds.add(f)));
        return [...factionIds].map(id => getFactionById(id)).filter(Boolean);
    }, []);

    return (
        <div className={styles.listPage}>
            <div className={styles.listHeader}>
                <h1 className={styles.listTitle}>Operators</h1>
            </div>

            {/* ─── Controls ────────────────────────────────────────────── */}
            <div className={styles.controls}>
                <input
                    type="text"
                    className={styles.searchBar}
                    placeholder="Tìm kiếm Operator theo tên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <select
                    className={styles.filterSelect}
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                >
                    <option value="">Tất cả Class</option>
                    {OPERATOR_CLASSES.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>

                <select
                    className={styles.filterSelect}
                    value={filterFaction}
                    onChange={(e) => setFilterFaction(e.target.value)}
                >
                    <option value="">Tất cả Faction</option>
                    {availableFactions.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        ▦
                    </button>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {/* ─── Operator Display ────────────────────────────────────── */}
            {filteredOperators.length === 0 ? (
                <div className={styles.emptyState}>
                    Không tìm thấy Operator nào phù hợp.
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className={styles.operatorGrid}>
                    {filteredOperators.map(op => {
                        const cls = getClassById(op.class);
                        const faction = getFactionById(op.factions[0]);
                        return (
                            <Link
                                key={op.operator_id}
                                to={`/operators/${op.operator_id}`}
                                className={styles.operatorCard}
                            >
                                <img
                                    src={op.avatar_url}
                                    alt={op.name}
                                    className={styles.cardAvatar}
                                    onError={(e) => { e.target.src = '/assets/images/character/blank.png'; }}
                                />
                                <p className={styles.cardName}>{op.name}</p>
                                <div className={styles.cardMeta}>
                                    {cls && <img src={cls.icon} alt={cls.name} className={styles.cardMetaIcon} title={cls.name} />}
                                    {faction && <img src={faction.icon} alt={faction.name} className={styles.cardMetaIcon} title={faction.name} />}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <div className={styles.operatorList}>
                    {filteredOperators.map(op => {
                        const cls = getClassById(op.class);
                        const faction = getFactionById(op.factions[0]);
                        return (
                            <Link
                                key={op.operator_id}
                                to={`/operators/${op.operator_id}`}
                                className={styles.operatorRow}
                            >
                                <img
                                    src={op.avatar_url}
                                    alt={op.name}
                                    className={styles.rowAvatar}
                                    onError={(e) => { e.target.src = '/assets/images/character/blank.png'; }}
                                />
                                <span className={styles.rowName}>{op.name}</span>
                                <div className={styles.rowMeta}>
                                    {cls && <img src={cls.icon} alt={cls.name} className={styles.rowMetaIcon} title={cls.name} />}
                                    {faction && (
                                        <>
                                            <img src={faction.icon} alt={faction.name} className={styles.rowMetaIcon} title={faction.name} />
                                            <span className={styles.rowFaction}>{faction.name}</span>
                                        </>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
