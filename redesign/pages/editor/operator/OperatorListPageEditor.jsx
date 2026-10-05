import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import NotificationToast from '../components/NotificationToast'
import { SupabaseAPI } from '../../../../src/services/supabaseApi'
import {
    CLASSES, CLASSES_MAP, SUBCLASSES_MAP, FACTIONS_MAP,
    getOperatorFactionIds, getHierarchicalFactions
} from '../../operator/operatorMapping'
import {
    Plus, Search, Grid, List, Star, Trash2, Edit3, BookOpen,
    ArrowLeft, LogOut, UserX, Loader2, ExternalLink, Filter, ChevronDown,
    Eye, EyeOff, Check
} from 'lucide-react'
import { useAuth } from '../../../../src/contexts/AuthContext'
import { getAssetUrl } from '../../../../src/utils/assetUtils'
import '../../operator/operator.css'
import './operatorEditorPages.css'

const FALLBACK_AVATAR = '/assets/images/character/blank.png'

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

// Reusable Swiss-Brutalist Custom Select Component with Portal rendering to prevent clipping
function CustomSelect({ id, value, onChange, options, placeholder, renderOption }) {
    const [isOpen, setIsOpen] = useState(false)
    const [menuStyle, setMenuStyle] = useState({})
    const toggleRef = useRef(null)
    const menuRef = useRef(null)

    // Calculate position in viewport
    const updatePosition = useCallback(() => {
        if (!toggleRef.current) return
        const rect = toggleRef.current.getBoundingClientRect()

        // If button is off-screen, close menu
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
            setIsOpen(false)
            return
        }

        const menuMaxHeight = 260
        const spaceBelow = window.innerHeight - rect.bottom
        const openUpwards = spaceBelow < menuMaxHeight && rect.top > menuMaxHeight

        setMenuStyle({
            position: 'fixed',
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            top: openUpwards ? 'auto' : `${rect.bottom + 4}px`,
            bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : 'auto',
            zIndex: 999999,
            maxHeight: `${menuMaxHeight}px`
        })
    }, [])

    useEffect(() => {
        if (!isOpen) return

        updatePosition()

        const handleScroll = (event) => {
            // Allow user to scroll inside the dropdown menu itself
            if (menuRef.current && menuRef.current.contains(event.target)) {
                return
            }
            updatePosition()
        }

        const handleClickOutside = (event) => {
            if (
                toggleRef.current && !toggleRef.current.contains(event.target) &&
                menuRef.current && !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false)
            }
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('resize', updatePosition)
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('scroll', handleScroll, true)
            window.removeEventListener('resize', updatePosition)
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, updatePosition])

    const handleSelect = (val) => {
        onChange(val)
        setIsOpen(false)
    }

    const selectedOption = options.find(o => o.value === value)

    return (
        <div className="ced-dropdown" id={id}>
            <button
                ref={toggleRef}
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

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="ced-dropdown-menu ced-dropdown-portal-menu"
                    style={menuStyle}
                >
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
                </div>,
                document.body
            )}
        </div>
    )
}

export default function OperatorListPageEditor() {
    const navigate = useNavigate()
    const { logout } = useAuth()

    const [operators, setOperators] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedFaction, setSelectedFaction] = useState(null)
    const [selectedClass, setSelectedClass] = useState(null)
    const [selectedSubclass, setSelectedSubclass] = useState(null)
    const [selectedRarity, setSelectedRarity] = useState(null)
    const [viewMode, setViewMode] = useState('grid')
    const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'published' | 'draft'
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
    const location = useLocation()
    const [notification, setNotification] = useState({ message: '', type: 'success' })

    const showToast = (message, type = 'success') => {
        setNotification({ message, type })
    }

    // Catch toast message from redirect location state
    useEffect(() => {
        if (location.state?.toastMessage) {
            showToast(location.state.toastMessage, location.state.toastType || 'success')
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

    const loadOperators = async () => {
        setLoading(true)
        try {
            const data = await SupabaseAPI.getOperators({ includeDrafts: true })
            setOperators(data || [])
        } catch (err) {
            console.error('Failed to load operators:', err)
            showToast('Không thể tải danh sách cán viên: ' + err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadOperators()
    }, [])

    const handleDelete = async (operator) => {
        const confirmMsg = `Bạn có chắc muốn xoá vĩnh viễn cán viên "${operator.name}" (${operator.operator_id}) cùng tất cả skins, thoại và kí sự liên quan?`
        if (window.confirm(confirmMsg)) {
            try {
                await SupabaseAPI.deleteOperator(operator.operator_id)
                showToast(`Đã xoá cán viên ${operator.name} thành công.`, 'success')
                loadOperators()
            } catch (err) {
                console.error('Delete failed:', err)
                showToast('Xoá cán viên thất bại: ' + err.message, 'error')
            }
        }
    }

    const handleToggleStatus = async (operator, e) => {
        e?.stopPropagation()
        const currentStatus = operator.status || 'published'
        const newStatus = currentStatus === 'published' ? 'draft' : 'published'
        try {
            await SupabaseAPI.toggleOperatorStatus(operator.operator_id, newStatus)
            setOperators(prev => prev.map(op =>
                op.operator_id === operator.operator_id ? { ...op, status: newStatus } : op
            ))
            showToast(`Đã chuyển "${operator.name}" sang ${newStatus === 'published' ? 'Đã xuất bản' : 'Bản nháp'}.`, 'success')
        } catch (err) {
            console.error('Toggle status failed:', err)
            showToast('Thay đổi trạng thái thất bại: ' + err.message, 'error')
        }
    }

    // Filter operators
    const filteredOperators = useMemo(() => {
        let result = operators

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            result = result.filter(op => {
                const opName = (op.name || '').toLowerCase()
                const opAppellation = (op.appellation || '').toLowerCase()
                const opId = (op.operator_id || op.id || '').toLowerCase()
                const fIds = getOperatorFactionIds(op)
                const factionMatches = fIds.some(fId => (FACTIONS_MAP[fId]?.name || '').toLowerCase().includes(q))
                const classMatches = (CLASSES_MAP[op.class || op.class_id]?.name || '').toLowerCase().includes(q)

                return opName.includes(q) || opAppellation.includes(q) || opId.includes(q) || factionMatches || classMatches
            })
        }

        // Faction filter
        if (selectedFaction) {
            result = result.filter(op => getOperatorFactionIds(op).includes(selectedFaction))
        }

        // Class filter
        if (selectedClass) {
            result = result.filter(op => (op.class === selectedClass || op.class_id === selectedClass))
        }

        // Subclass filter
        if (selectedSubclass) {
            result = result.filter(op => (op.subclass === selectedSubclass || op.sub_class_id === selectedSubclass))
        }

        // Rarity filter
        if (selectedRarity) {
            result = result.filter(op => op.rarity === Number(selectedRarity))
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(op => (op.status || 'published') === statusFilter)
        }

        return result
    }, [operators, searchQuery, selectedFaction, selectedClass, selectedSubclass, selectedRarity, statusFilter])

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
        const set = new Set(operators.map(op => op.class || op.class_id))
        return CLASSES.filter(c => set.has(c.id))
    }, [operators])

    const availableSubclasses = useMemo(() => {
        const subclassesMap = new Map()
        operators.forEach(op => {
            const subId = op.subclass || op.sub_class_id
            const classId = op.class || op.class_id
            if (subId) {
                const sub = SUBCLASSES_MAP[subId]
                const parentClass = CLASSES_MAP[classId]
                if (sub && parentClass && (!selectedClass || classId === selectedClass)) {
                    subclassesMap.set(subId, {
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
                (op.class === classId || op.class_id === classId) &&
                (op.subclass === selectedSubclass || op.sub_class_id === selectedSubclass)
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
        const foundOp = operators.find(op => (op.subclass === subclassId || op.sub_class_id === subclassId))
        const opClass = foundOp?.class || foundOp?.class_id
        if (opClass && selectedClass !== opClass) {
            setSelectedClass(opClass)
        }
    }

    const renderStars = (rarity) => {
        return Array.from({ length: rarity || 5 }, (_, i) => (
            <Star key={i} size={10} fill="currentColor" strokeWidth={0} />
        ))
    }

    return (
        <div className="op-editor-container">
            {/* Top Bar / Header */}
            <header className="op-editor-header">
                <div className="op-editor-header-left">
                    <button
                        onClick={() => navigate('/editor')}
                        className="brutalist-icon-btn"
                        title="Quay lại Hub"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <h1 className="op-compact-title technical-text">
                        OPERATOR_REGISTRY
                        <span className="op-count-badge">[{operators.length}]</span>
                    </h1>
                </div>

                <div className="op-editor-header-right">
                    <button
                        className="brutalist-btn secondary technical-text"
                        onClick={() => navigate('/editor/operator/records')}
                        title="Soạn thảo kịch bản kí sự cán viên"
                    >
                        <BookOpen size={14} />
                        <span>kí sự CÁN VIÊN</span>
                    </button>

                    <button
                        className="brutalist-btn primary technical-text"
                        onClick={() => navigate('/editor/operator/new')}
                        title="Thêm hồ sơ cán viên mới"
                    >
                        <Plus size={15} />
                        <span>THÊM CÁN VIÊN</span>
                    </button>

                    <button
                        onClick={async () => {
                            await logout()
                            navigate('/login')
                        }}
                        className="brutalist-icon-btn danger"
                        title="Đăng xuất"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Notification Toast */}
            {notification.message && (
                <div className={`notification-toast ${notification.type} show`} style={{ position: 'fixed', top: '70px', right: '20px', zIndex: 9999 }}>
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Content Area */}
            <main className="content-area operator-page-wrapper expanded" style={{ padding: '1.25rem 2rem' }}>

                {/* Toolbar */}
                <div className="operator-toolbar" style={{ marginBottom: '1.5rem' }}>
                    <div className="operator-toolbar-main">
                        <div className="operator-search-box">
                            <Search size={16} />
                            <input
                                id="operator-search"
                                type="text"
                                className="operator-search-input"
                                placeholder="Tìm theo tên, danh hiệu, mã cán viên..."
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

                        {/* Status Filter Group */}
                        <div className="operator-status-filter-group technical-text">
                            <button
                                className={`op-status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('all')}
                            >
                                TẤT CẢ ({operators.length})
                            </button>
                            <button
                                className={`op-status-filter-btn ${statusFilter === 'published' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('published')}
                            >
                                XUẤT BẢN ({operators.filter(o => o.status !== 'draft').length})
                            </button>
                            <button
                                className={`op-status-filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('draft')}
                            >
                                BẢN NHÁP ({operators.filter(o => o.status === 'draft').length})
                            </button>
                        </div>

                        <div className="operator-view-toggle">
                            <button
                                className={`operator-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Lưới"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                className={`operator-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="Danh sách"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

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

                {/* Operator List View */}
                {loading ? (
                    <div className="operator-empty-state">
                        <Loader2 size={36} className="spin-animate" />
                        <span className="operator-empty-text technical-text" style={{ marginTop: '1rem' }}>
                            FETCHING_OPERATORS_DATABASE...
                        </span>
                    </div>
                ) : filteredOperators.length === 0 ? (
                    <div className="operator-empty-state">
                        <UserX size={48} className="operator-empty-icon" />
                        <span className="operator-empty-text technical-text">
                            {searchQuery || selectedFaction || selectedClass || selectedSubclass || selectedRarity
                                ? 'KHÔNG TÌM THẤY CÁN VIÊN PHÙ HỢP // THỬ THAY ĐỔI BỘ LỌC'
                                : 'CHƯA CÓ CÁN VIÊN NÀO TRONG HỆ THỐNG'}
                        </span>
                        {!searchQuery && !selectedFaction && !selectedClass && !selectedSubclass && !selectedRarity && (
                            <button
                                className="op-btn op-btn-primary"
                                style={{ marginTop: '1.25rem' }}
                                onClick={() => navigate('/editor/operator/new')}
                            >
                                <Plus size={16} />
                                <span>Thêm Cán Viên Đầu Tiên</span>
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid Mode */
                    <div className="operator-grid">
                        {filteredOperators.map(op => {
                            const imgSrc = getAssetUrl(op.avatar_url || FALLBACK_AVATAR)
                            const classInfo = CLASSES_MAP[op.class_id || op.class]
                            const subclassInfo = SUBCLASSES_MAP[op.sub_class_id || op.subclass]
                            const classIcon = classInfo?.icon ? getAssetUrl(classInfo.icon) : ''
                            const subclassIcon = subclassInfo?.icon ? getAssetUrl(subclassInfo.icon) : ''
                            const factionInfo = FACTIONS_MAP[op.factions?.[0] || op.faction]
                            const badgeTitle = subclassInfo
                                ? `${classInfo?.name || op.class_id || ''} // ${subclassInfo.name}`
                                : (classInfo?.name || op.class_id || '')

                            return (
                                <div key={op.operator_id} className="operator-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div
                                        className="operator-card-img-wrap"
                                        onClick={() => navigate(`/editor/operator/${op.operator_id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img
                                            className="operator-card-img"
                                            src={imgSrc}
                                            alt={op.name}
                                            onError={(e) => {
                                                e.target.onerror = null
                                                e.target.src = getAssetUrl(FALLBACK_AVATAR)
                                            }}
                                        />
                                        <div className={`operator-card-status-badge ${op.status === 'draft' ? 'draft' : 'published'}`}>
                                            {op.status === 'draft' ? 'DRAFT' : 'PUB'}
                                        </div>
                                        <div className="operator-card-rarity">
                                            {renderStars(op.rarity)}
                                        </div>
                                        {(classIcon || subclassIcon) ? (
                                            <div className="operator-card-badges" title={badgeTitle}>
                                                {classIcon && (
                                                    <img
                                                        src={classIcon}
                                                        alt={classInfo?.name || ''}
                                                        className="operator-card-badge-icon"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                )}
                                                {classIcon && subclassIcon && (
                                                    <span className="operator-card-badges-divider" />
                                                )}
                                                {subclassIcon && (
                                                    <img
                                                        src={subclassIcon}
                                                        alt={subclassInfo?.name || ''}
                                                        className="operator-card-badge-icon"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="operator-card-class">
                                                {classInfo?.name || op.class_id || 'UNKNOWN'}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className="operator-card-info"
                                        onClick={() => navigate(`/editor/operator/${op.operator_id}`)}
                                        style={{ cursor: 'pointer', flex: 1 }}
                                    >
                                        <span className="operator-card-name">{op.name}</span>
                                        <span className="operator-card-faction">{factionInfo?.name || op.appellation || 'Rhodes Island'}</span>
                                    </div>

                                    {/* Admin Action Buttons */}
                                    <div className="operator-card-admin-bar">
                                        <button
                                            className={`operator-card-admin-btn status-btn ${op.status === 'draft' ? 'is-draft' : 'is-published'}`}
                                            onClick={(e) => handleToggleStatus(op, e)}
                                            title={op.status === 'draft' ? 'Bản nháp - Bấm để xuất bản' : 'Đã xuất bản - Bấm để chuyển về bản nháp'}
                                        >
                                            {op.status === 'draft' ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>

                                        <button
                                            className="operator-card-admin-btn"
                                            onClick={() => navigate(`/editor/operator/${op.operator_id}`)}
                                            title="Chỉnh sửa hồ sơ chi tiết"
                                        >
                                            <Edit3 size={13} />
                                        </button>

                                        <button
                                            className="operator-card-admin-btn"
                                            onClick={() => navigate(`/editor/operator/records?operatorId=${op.operator_id}`)}
                                            title="Viết kịch bản kí sự cán viên"
                                        >
                                            <BookOpen size={13} />
                                        </button>

                                        <button
                                            className="operator-card-admin-btn danger"
                                            onClick={() => handleDelete(op)}
                                            title="Xoá cán viên"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    /* List Mode */
                    <div className="operator-list">
                        <div className="operator-list-header">
                            <span>Mã</span>
                            <span>Cán Viên</span>
                            <span>Trạng Thái</span>
                            <span>Phe Phái</span>
                            <span>Class</span>
                            <span>Độ Hiếm</span>
                            <span>Thao Tác</span>
                        </div>
                        {filteredOperators.map(op => {
                            const imgSrc = getAssetUrl(op.avatar_url || FALLBACK_AVATAR)
                            const classInfo = CLASSES_MAP[op.class_id || op.class]
                            const factionInfo = FACTIONS_MAP[op.factions?.[0] || op.faction]

                            return (
                                <div key={op.operator_id} className="operator-list-item" style={{ cursor: 'default' }}>
                                    <span className="technical-text" style={{ fontSize: '0.75rem', color: '#888' }}>
                                        {op.operator_id}
                                    </span>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <img
                                            className="operator-list-avatar"
                                            src={imgSrc}
                                            alt={op.name}
                                            onError={(e) => {
                                                e.target.onerror = null
                                                e.target.src = getAssetUrl(FALLBACK_AVATAR)
                                            }}
                                        />
                                        <span className="operator-list-name">{op.name}</span>
                                    </div>

                                    <div>
                                        <span className={`operator-status-pill ${op.status === 'draft' ? 'draft' : 'published'}`}>
                                            {op.status === 'draft' ? 'BẢN NHÁP' : 'XUẤT BẢN'}
                                        </span>
                                    </div>

                                    <span className="operator-list-faction">{factionInfo?.name || op.factions?.[0] || '-'}</span>
                                    <span className="operator-list-class">{classInfo?.name || op.class_id || '-'}</span>
                                    <span className="operator-list-rarity">{renderStars(op.rarity)}</span>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={`operator-card-admin-btn status-btn ${op.status === 'draft' ? 'is-draft' : 'is-published'}`}
                                            onClick={(e) => handleToggleStatus(op, e)}
                                            title={op.status === 'draft' ? 'Bản nháp - Bấm để xuất bản' : 'Đã xuất bản - Bấm để chuyển về bản nháp'}
                                        >
                                            {op.status === 'draft' ? <EyeOff size={13} /> : <Eye size={13} />}
                                        </button>
                                        <button
                                            className="operator-card-admin-btn"
                                            onClick={() => navigate(`/editor/operator/${op.operator_id}`)}
                                            title="Sửa hồ sơ"
                                        >
                                            <Edit3 size={13} />
                                            <span>Sửa</span>
                                        </button>
                                        <button
                                            className="operator-card-admin-btn"
                                            onClick={() => navigate(`/editor/operator/records?operatorId=${op.operator_id}`)}
                                            title="Viết kí sự"
                                        >
                                            <BookOpen size={13} />
                                            <span>kí sự</span>
                                        </button>
                                        <button
                                            className="operator-card-admin-btn danger"
                                            onClick={() => handleDelete(op)}
                                            title="Xoá"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            <NotificationToast
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ message: '', type: 'success' })}
            />
        </div>
    )
}
