import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_OPERATORS, FACTIONS, CLASSES } from './mockOperatorData'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Search, Grid, List, Star, UserX, Filter } from 'lucide-react'
import './operator.css'

export default function OperatorListPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFaction, setSelectedFaction] = useState(null)
    const [selectedClass, setSelectedClass] = useState(null)
    const [selectedSubclass, setSelectedSubclass] = useState(null)
    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

    const BASE_URL = import.meta.env.BASE_URL || '/'

    // Filter operators
    const filteredOperators = useMemo(() => {
        let result = MOCK_OPERATORS

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            result = result.filter(op =>
                op.name.toLowerCase().includes(q) ||
                op.appellation.toLowerCase().includes(q) ||
                op.faction.name.toLowerCase().includes(q) ||
                op.class.name.toLowerCase().includes(q)
            )
        }

        // Faction filter
        if (selectedFaction) {
            result = result.filter(op => op.faction.id === selectedFaction)
        }

        // Class filter
        if (selectedClass) {
            result = result.filter(op => op.class.id === selectedClass)
        }

        // Subclass filter
        if (selectedSubclass) {
            result = result.filter(op => op.subclass && op.subclass.id === selectedSubclass)
        }

        return result
    }, [searchQuery, selectedFaction, selectedClass, selectedSubclass])

    // Get unique factions, classes and subclasses from data
    const availableFactions = useMemo(() => {
        const set = new Set(MOCK_OPERATORS.map(op => op.faction.id))
        return FACTIONS.filter(f => set.has(f.id))
    }, [])

    const availableClasses = useMemo(() => {
        const set = new Set(MOCK_OPERATORS.map(op => op.class.id))
        return CLASSES.filter(c => set.has(c.id))
    }, [])

    const availableSubclasses = useMemo(() => {
        const subclassesMap = new Map()
        MOCK_OPERATORS.forEach(op => {
            if (op.subclass) {
                if (!selectedClass || op.class.id === selectedClass) {
                    subclassesMap.set(op.subclass.id, {
                        id: op.subclass.id,
                        name: op.subclass.name
                    })
                }
            }
        })
        return Array.from(subclassesMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [selectedClass])

    const handleClassChange = (classId) => {
        setSelectedClass(classId)
        
        // If changing class, check if current selectedSubclass belongs to the new class. If not, reset it.
        if (selectedSubclass && classId) {
            const belongs = MOCK_OPERATORS.some(op => 
                op.class.id === classId && op.subclass && op.subclass.id === selectedSubclass
            )
            if (!belongs) {
                setSelectedSubclass(null)
            }
        }
    }

    const handleSubclassChange = (subclassId) => {
        if (!subclassId) {
            setSelectedSubclass(null)
            return
        }
        setSelectedSubclass(subclassId)
        
        // If a subclass is selected, automatically select the corresponding class
        const foundOp = MOCK_OPERATORS.find(op => op.subclass && op.subclass.id === subclassId)
        if (foundOp && selectedClass !== foundOp.class.id) {
            setSelectedClass(foundOp.class.id)
        }
    }

    const renderStars = (rarity) => {
        return Array.from({ length: rarity }, (_, i) => (
            <Star key={i} size={10} fill="currentColor" strokeWidth={0} />
        ))
    }

    return (
        <div className="app-wrapper">
            <Header BASE_URL={BASE_URL} />

            <div className="main-layout">
                <div className="content-area operator-page-wrapper expanded page-fade-in">
                    {/* Hero Section */}
                    <div className="operator-hero">
                        <div className="operator-hero-meta technical-text">
                            SYS.OPERATOR_DATABASE // SEC.PERSONNEL_REGISTRY
                        </div>
                        <h1 className="operator-hero-title">Operator Database</h1>
                        <p className="operator-hero-desc">
                            Cơ sở dữ liệu nhân sự Rhodes Island. Truy xuất hồ sơ operator, kỹ năng chiến đấu, lịch sử hành quân và hồ sơ cá nhân.
                        </p>
                    </div>

                    {/* Toolbar: Search + Filters + View Toggle */}
                    <div className="operator-toolbar">
                        <div className="operator-toolbar-main">
                            {/* Search */}
                            <div className="operator-search-box">
                                <Search size={16} />
                                <input
                                    id="operator-search"
                                    type="text"
                                    className="operator-search-input"
                                    placeholder="SEARCH_OPERATOR_NAME..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Mobile Filters Toggle Button */}
                            <button
                                className={`operator-mobile-filter-btn ${mobileFiltersOpen ? 'active' : ''}`}
                                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                                title="Toggle filters"
                            >
                                <Filter size={16} />
                            </button>

                            {/* View Toggle */}
                            <div className="operator-view-toggle">
                                <button
                                    className={`operator-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                    title="Grid view"
                                >
                                    <Grid size={16} />
                                </button>
                                <button
                                    className={`operator-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                    title="List view"
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Filters Panel */}
                        <div className={`operator-filters-panel ${mobileFiltersOpen ? 'open' : ''}`}>
                            {/* Faction Filter */}
                            <div className="operator-filter-group">
                                <label htmlFor="faction-select" className="operator-filter-label">Faction:</label>
                                <select
                                    id="faction-select"
                                    className="operator-select-dropdown"
                                    value={selectedFaction || ''}
                                    onChange={(e) => setSelectedFaction(e.target.value || null)}
                                >
                                    <option value="">ALL FACTIONS</option>
                                    {availableFactions.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Class Filter */}
                            <div className="operator-filter-group">
                                <label htmlFor="class-select" className="operator-filter-label">Class:</label>
                                <select
                                    id="class-select"
                                    className="operator-select-dropdown"
                                    value={selectedClass || ''}
                                    onChange={(e) => handleClassChange(e.target.value || null)}
                                >
                                    <option value="">ALL CLASSES</option>
                                    {availableClasses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subclass Filter */}
                            <div className="operator-filter-group">
                                <label htmlFor="subclass-select" className="operator-filter-label">Subclass:</label>
                                <select
                                    id="subclass-select"
                                    className="operator-select-dropdown"
                                    value={selectedSubclass || ''}
                                    onChange={(e) => handleSubclassChange(e.target.value || null)}
                                >
                                    <option value="">ALL SUBCLASSES</option>
                                    {availableSubclasses.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="operator-results-bar">
                        <span className="operator-results-count technical-text">
                            SYS.RESULTS: {filteredOperators.length} OPERATOR{filteredOperators.length !== 1 ? 'S' : ''} FOUND
                        </span>
                    </div>

                    {/* Operator Display */}
                    {filteredOperators.length === 0 ? (
                        <div className="operator-empty-state">
                            <UserX size={48} className="operator-empty-icon" />
                            <span className="operator-empty-text technical-text">
                                NO_MATCHING_RECORDS // ADJUST SEARCH PARAMETERS
                            </span>
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* Grid View */
                        <div className="operator-grid">
                            {filteredOperators.map(op => (
                                <Link
                                    key={op.id}
                                    to={`/operator/${op.id}`}
                                    className="operator-card"
                                    id={`operator-card-${op.id}`}
                                >
                                    <div className="operator-card-img-wrap">
                                        <img
                                            className="operator-card-img"
                                            src={op.portraitUrl}
                                            alt={op.name}
                                            onError={(e) => {
                                                e.target.onerror = null
                                                e.target.style.display = 'none'
                                            }}
                                        />
                                        <div className="operator-card-rarity">
                                            {renderStars(op.rarity)}
                                        </div>
                                        <div className="operator-card-class">
                                            {op.class.name}
                                        </div>
                                    </div>
                                    <div className="operator-card-info">
                                        <span className="operator-card-name">{op.name}</span>
                                        <span className="operator-card-faction">{op.faction.name}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        /* List View */
                        <div className="operator-list">
                            <div className="operator-list-header">
                                <span></span>
                                <span>Name</span>
                                <span>Faction</span>
                                <span>Class</span>
                                <span>Rarity</span>
                            </div>
                            {filteredOperators.map(op => (
                                <Link
                                    key={op.id}
                                    to={`/operator/${op.id}`}
                                    className="operator-list-item"
                                    id={`operator-list-${op.id}`}
                                >
                                    <img
                                        className="operator-list-avatar"
                                        src={op.portraitUrl}
                                        alt={op.name}
                                        onError={(e) => {
                                            e.target.onerror = null
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                    <span className="operator-list-name">{op.name}</span>
                                    <span className="operator-list-faction">{op.faction.name}</span>
                                    <span className="operator-list-class">{op.class.name}</span>
                                    <span className="operator-list-rarity">{renderStars(op.rarity)}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    )
}
