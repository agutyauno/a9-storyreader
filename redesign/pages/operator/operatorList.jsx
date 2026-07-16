import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_OPERATORS, FACTIONS, CLASSES } from './mockOperatorData'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Search, Grid, List, Star, UserX, Filter, ChevronDown } from 'lucide-react'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import './operator.css'

// Custom renderer for class options with PNG icons
const renderClassOption = (opt) => {
    if (!opt.value) return opt.label
    const className = opt.value.charAt(0).toUpperCase() + opt.value.slice(1)
    const iconUrl = getAssetUrl(`/assets/images/icon/class/${className}.png`)
    return (
        <span className="class-option-content">
            <img
                src={iconUrl}
                alt={opt.label}
                className="class-option-img"
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
            <span>{opt.label}</span>
        </span>
    )
}

// Custom renderer for subclass options with PNG icons
const renderSubclassOption = (opt) => {
    if (!opt.value) return opt.label
    const cleanSubclass = opt.subclassName.replace(/\s+/g, '_')
    const cleanClass = opt.className.replace(/\s+/g, '_')
    const filename = `${cleanSubclass}_${cleanClass}.png`
    const iconUrl = getAssetUrl(`/assets/images/icon/class/${filename}`)
    return (
        <span className="class-option-content">
            <img
                src={iconUrl}
                alt={opt.label}
                className="class-option-img"
                onError={(e) => {
                    e.target.onerror = null;
                    const fallbackName = opt.className.replace(/\s+/g, '_')
                    e.target.src = getAssetUrl(`/assets/images/icon/class/${fallbackName}.png`);
                }}
            />
            <span>{opt.label}</span>
        </span>
    )
}

// Custom renderer for rarity options with star icons
const renderRarityOption = (opt) => {
    if (!opt.value) return opt.label
    const stars = Number(opt.value)
    return (
        <span className="rarity-option-content">
            <span className="rarity-number">{stars}</span>
            <span className="rarity-stars">
                {Array.from({ length: stars }, (_, i) => (
                    <Star key={i} size={8} fill="var(--color-ochre)" strokeWidth={0} />
                ))}
            </span>
        </span>
    )
}

// Reusable Swiss-Brutalist Custom Select Component
function CustomSelect({ id, value, onChange, options, placeholder, renderOption }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (val) => {
        onChange(val)
        setIsOpen(false)
    }

    const selectedOption = options.find(o => o.value === value)

    return (
        <div className="ced-dropdown" ref={dropdownRef} id={id}>
            <button
                type="button"
                className={`ced-dropdown-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="ced-dropdown-value">
                    {selectedOption ? (
                        renderOption ? renderOption(selectedOption) : selectedOption.label
                    ) : (
                        placeholder
                    )}
                </span>
                <ChevronDown size={14} className="ced-dropdown-caret" />
            </button>

            {isOpen && (
                <div className="ced-dropdown-menu">
                    <div
                        className={`ced-dropdown-item ${!value ? 'selected' : ''}`}
                        onClick={() => handleSelect(null)}
                    >
                        {placeholder}
                    </div>
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`ced-dropdown-item ${value === opt.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            {renderOption ? renderOption(opt) : opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function OperatorListPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFaction, setSelectedFaction] = useState(null)
    const [selectedClass, setSelectedClass] = useState(null)
    const [selectedSubclass, setSelectedSubclass] = useState(null)
    const [selectedRarity, setSelectedRarity] = useState(null)
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

        // Rarity filter
        if (selectedRarity) {
            result = result.filter(op => op.rarity === Number(selectedRarity))
        }

        return result
    }, [searchQuery, selectedFaction, selectedClass, selectedSubclass, selectedRarity])

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
                        name: op.subclass.name,
                        className: op.class.name
                    })
                }
            }
        })
        return Array.from(subclassesMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [selectedClass])

    // Map datasets into option arrays for CustomSelect dropdowns
    const factionOptions = useMemo(() => availableFactions.map(f => ({ value: f.id, label: f.name })), [availableFactions])
    const classOptions = useMemo(() => availableClasses.map(c => ({ value: c.id, label: c.name })), [availableClasses])
    const subclassOptions = useMemo(() => availableSubclasses.map(s => ({
        value: s.id,
        label: s.name,
        subclassName: s.name,
        className: s.className
    })), [availableSubclasses])
    const rarityOptions = useMemo(() => [
        { value: 6, label: '6' },
        { value: 5, label: '5' },
        { value: 4, label: '4' },
        { value: 3, label: '3' },
        { value: 2, label: '2' },
        { value: 1, label: '1' }
    ], [])

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
                        <h1 className="operator-hero-title">Danh sách cán viên</h1>
                        <p className="operator-hero-desc">
                            Cơ sở dữ liệu nhân sự Rhodes Island. Truy xuất hồ sơ cán viên, kỹ năng chiến đấu và hồ sơ cá nhân.
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
                                    placeholder="Tìm kiếm"
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
                                <span className="operator-filter-label">Faction:</span>
                                <CustomSelect
                                    id="faction-select-dropdown"
                                    value={selectedFaction}
                                    onChange={setSelectedFaction}
                                    options={factionOptions}
                                    placeholder="ALL FACTIONS"
                                />
                            </div>

                            {/* Class Filter */}
                            <div className="operator-filter-group">
                                <span className="operator-filter-label">Class:</span>
                                <CustomSelect
                                    id="class-select-dropdown"
                                    value={selectedClass}
                                    onChange={handleClassChange}
                                    options={classOptions}
                                    placeholder="ALL CLASSES"
                                    renderOption={renderClassOption}
                                />
                            </div>

                            {/* Subclass Filter */}
                            <div className="operator-filter-group">
                                <span className="operator-filter-label">Subclass:</span>
                                <CustomSelect
                                    id="subclass-select-dropdown"
                                    value={selectedSubclass}
                                    onChange={handleSubclassChange}
                                    options={subclassOptions}
                                    placeholder="ALL SUBCLASSES"
                                    renderOption={renderSubclassOption}
                                />
                            </div>

                            {/* Rarity Filter */}
                            <div className="operator-filter-group">
                                <span className="operator-filter-label">Rarity:</span>
                                <CustomSelect
                                    id="rarity-select-dropdown"
                                    value={selectedRarity}
                                    onChange={setSelectedRarity}
                                    options={rarityOptions}
                                    placeholder="ALL RARITIES"
                                    renderOption={renderRarityOption}
                                />
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
