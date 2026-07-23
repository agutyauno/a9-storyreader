import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_OPERATORS, FACTIONS, CLASSES, CLASSES_MAP, SUBCLASSES_MAP, FACTIONS_MAP, getOperatorFactionIds, getHierarchicalFactions } from './mockOperatorData'
import { SupabaseAPI } from '../../../src/services/supabaseApi'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Search, Grid, List, Star, UserX, Filter, ChevronDown } from 'lucide-react'
import { getAssetUrl } from '../../../src/utils/assetUtils'
import './operator.css'

// Custom renderer for class options with PNG icons
const renderClassOption = (opt) => {
    if (!opt.value) return opt.label
    const clazz = CLASSES_MAP[opt.value]
    const iconUrl = clazz ? getAssetUrl(clazz.icon) : ''
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
    const subclass = SUBCLASSES_MAP[opt.value]
    const iconUrl = subclass ? getAssetUrl(subclass.icon) : ''
    return (
        <span className="class-option-content">
            <img
                src={iconUrl}
                alt={opt.label}
                className="class-option-img"
                onError={(e) => {
                    e.target.onerror = null;
                    const parentClassId = subclass?.classId
                    const parentClass = parentClassId ? CLASSES_MAP[parentClassId] : null
                    e.target.src = parentClass ? getAssetUrl(parentClass.icon) : '';
                }}
            />
            <span>{opt.label}</span>
        </span>
    )
}

// Custom renderer for faction options with PNG icons
const renderFactionOption = (opt) => {
    if (!opt.value) return opt.label
    const faction = FACTIONS_MAP[opt.value]
    const iconUrl = faction ? getAssetUrl(faction.icon) : ''
    return (
        <span className="class-option-content faction-option-content">
            {iconUrl && (
                <img
                    src={iconUrl}
                    alt={opt.label}
                    className="class-option-img faction-option-img"
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            )}
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
                            className={`ced-dropdown-item ${value === opt.value ? 'selected' : ''} ${opt.className || ''}`}
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
    const [operators, setOperators] = useState(MOCK_OPERATORS)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFaction, setSelectedFaction] = useState(null)
    const [selectedClass, setSelectedClass] = useState(null)
    const [selectedSubclass, setSelectedSubclass] = useState(null)
    const [selectedRarity, setSelectedRarity] = useState(null)
    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

    const BASE_URL = import.meta.env.BASE_URL || '/'

    // Fetch operators on mount
    useEffect(() => {
        async function fetchOps() {
            try {
                const data = await SupabaseAPI.getOperators()
                if (data && data.length > 0) {
                    setOperators(data)
                }
            } catch (err) {
                console.error('Failed to load operators from Supabase:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchOps()
    }, [])

    // Filter operators
    const filteredOperators = useMemo(() => {
        let result = operators

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            result = result.filter(op =>
                op.name.toLowerCase().includes(q) ||
                op.appellation.toLowerCase().includes(q) ||
                (FACTIONS_MAP[op.faction]?.name || '').toLowerCase().includes(q) ||
                (CLASSES_MAP[op.class]?.name || '').toLowerCase().includes(q)
            )
        }

        // Faction filter
        if (selectedFaction) {
            result = result.filter(op => getOperatorFactionIds(op).includes(selectedFaction))
        }

        // Class filter
        if (selectedClass) {
            result = result.filter(op => op.class === selectedClass)
        }

        // Subclass filter
        if (selectedSubclass) {
            result = result.filter(op => op.subclass === selectedSubclass)
        }

        // Rarity filter
        if (selectedRarity) {
            result = result.filter(op => op.rarity === Number(selectedRarity))
        }

        return result
    }, [operators, searchQuery, selectedFaction, selectedClass, selectedSubclass, selectedRarity])

    // Get unique factions, classes and subclasses from data
    const availableFactions = useMemo(() => {
        const activeFactionIds = new Set()
        operators.forEach(op => {
            getOperatorFactionIds(op).forEach(fId => activeFactionIds.add(fId))
        })
        const hierarchical = getHierarchicalFactions()
        return hierarchical.filter(f => activeFactionIds.has(f.id))
    }, [operators])

    const availableClasses = useMemo(() => {
        const set = new Set(operators.map(op => op.class))
        return CLASSES.filter(c => set.has(c.id))
    }, [operators])

    const availableSubclasses = useMemo(() => {
        const subclassesMap = new Map()
        operators.forEach(op => {
            if (op.subclass) {
                const sub = SUBCLASSES_MAP[op.subclass]
                const parentClass = CLASSES_MAP[op.class]
                if (sub && parentClass && (!selectedClass || op.class === selectedClass)) {
                    subclassesMap.set(op.subclass, {
                        id: sub.id,
                        name: sub.name,
                        className: parentClass.name
                    })
                }
            }
        })
        return Array.from(subclassesMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [operators, selectedClass])

    // Map datasets into option arrays for CustomSelect dropdowns
    const factionOptions = useMemo(() => availableFactions.map(f => ({
        value: f.id,
        label: f.displayName || f.name,
        className: f.parentId ? 'sub-faction-option' : 'parent-faction-option'
    })), [availableFactions])
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
            const belongs = operators.some(op =>
                op.class === classId && op.subclass === selectedSubclass
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
        const foundOp = operators.find(op => op.subclass === subclassId)
        if (foundOp && selectedClass !== foundOp.class) {
            setSelectedClass(foundOp.class)
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
                            SYS.OPERATOR_LIST
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
                                    renderOption={renderFactionOption}
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
                                            {CLASSES_MAP[op.class]?.name}
                                        </div>
                                    </div>
                                    <div className="operator-card-info">
                                        <span className="operator-card-name">{op.name}</span>
                                        <span className="operator-card-faction">{FACTIONS_MAP[op.faction]?.name}</span>
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
                                    <span className="operator-list-faction">{FACTIONS_MAP[op.faction]?.name}</span>
                                    <span className="operator-list-class">{CLASSES_MAP[op.class]?.name}</span>
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
