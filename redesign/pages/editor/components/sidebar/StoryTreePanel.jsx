import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronRight, ChevronDown, Layers, BookOpen, Bookmark, FileText, Loader, Trash2, Edit, Eye, EyeOff, Search, X, RotateCw } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import { EditorCache } from '../../../../../src/services/editorCache';
import ConfirmModal from '../modals/ConfirmModal';
import '../editorComponents.css';

const TYPE_ICON = {
    region: <Layers size={13} />,
    arc: <BookOpen size={13} />,
    event: <Bookmark size={13} />,
    story: <FileText size={13} />,
};

function getNodeStoryStats(node) {
    let total = 0;
    let pub = 0;
    let draft = 0;
    function traverse(children) {
        for (const c of children || []) {
            if (c.type === 'story') {
                total++;
                if (c.status === 'draft') draft++;
                else pub++;
            }
            if (c.children) traverse(c.children);
        }
    }
    traverse(node.children);
    return { total, pub, draft };
}

function getStoryCounts(tree) {
    let total = 0;
    let pub = 0;
    let draft = 0;
    function traverse(nodes) {
        for (const n of nodes || []) {
            if (n.type === 'story') {
                total++;
                if (n.status === 'draft') draft++;
                else pub++;
            }
            if (n.children) traverse(n.children);
        }
    }
    traverse(tree);
    return { total, pub, draft };
}

function filterTree(nodes, filterStatus, searchQuery = '') {
    const query = searchQuery.trim().toLowerCase();
    if (filterStatus === 'all' && !query) return nodes;

    function filterNode(node) {
        if (node.type === 'story') {
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'draft' && node.status === 'draft') ||
                (filterStatus === 'published' && node.status !== 'draft');
            const matchesSearch = !query ||
                (node.name || '').toLowerCase().includes(query) ||
                (node.story_id || node.id || '').toLowerCase().includes(query);
            return matchesStatus && matchesSearch ? { ...node, children: [] } : null;
        }

        const filteredChildren = (node.children || [])
            .map(child => filterNode(child))
            .filter(Boolean);

        const matchesSearch = query && (
            (node.name || '').toLowerCase().includes(query) ||
            (node.id || '').toLowerCase().includes(query)
        );

        if (filteredChildren.length > 0 || matchesSearch) {
            return {
                ...node,
                children: filteredChildren
            };
        }

        return null;
    }

    return nodes.map(filterNode).filter(Boolean);
}

function TreeNode({
    node,
    depth = 0,
    selectedId,
    expandedMap,
    onToggle,
    onSelect,
    onAdd,
    onDelete,
    onEdit,
    onToggleStatus,
    onBulkToggleEvent
}) {
    const isOpen = expandedMap[node.id] !== undefined ? expandedMap[node.id] : (depth < 2);
    const hasChildren = node.children?.length > 0;
    const isSelected = selectedId === node.id;
    const eventStats = node.type === 'event' ? getNodeStoryStats(node) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
                className={`redesign-tree-node ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${6 + depth * 10}px` }}
                onClick={() => onSelect(node)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {hasChildren ? (
                        <span
                            className="redesign-tree-chevron"
                            onClick={(e) => { e.stopPropagation(); onToggle(node.id, isOpen); }}
                        >
                            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                    ) : (
                        <span style={{ width: 4, flexShrink: 0 }} />
                    )}

                    <span style={{ color: isSelected ? '#FFF' : '#D84315', display: 'flex', flexShrink: 0 }}>
                        {TYPE_ICON[node.type]}
                    </span>

                    <span
                        style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.82rem'
                        }}
                        title={node.name}
                    >
                        {node.name}
                    </span>

                    {/* Story Status Badge */}
                    {node.type === 'story' && (
                        <span
                            className={`tree-status-badge ${node.status === 'draft' ? 'draft' : 'pub'}`}
                            title={node.status === 'draft' ? "Bản nháp (Đang ẩn)" : "Đã xuất bản (Công khai)"}
                        >
                            {node.status === 'draft' ? 'DRAFT' : 'PUB'}
                        </span>
                    )}

                    {/* Event / Chapter Summary Badge - Compact & Clean */}
                    {node.type === 'event' && eventStats && (
                        eventStats.total === 0 ? (
                            <span className="tree-event-meta empty" title="Chưa có màn nào">0</span>
                        ) : eventStats.pub === 0 ? (
                            <span
                                className="tree-event-meta all-draft"
                                title={`Chưa có màn nào xuất bản (${eventStats.draft} màn nháp) - Đang ẩn khỏi độc giả`}
                            >
                                0/{eventStats.total}
                            </span>
                        ) : eventStats.draft > 0 ? (
                            <span
                                className="tree-event-meta mixed"
                                title={`Đang biên tập: ${eventStats.pub}/${eventStats.total} đã xuất bản (${eventStats.draft} bản nháp)`}
                            >
                                {eventStats.pub}/{eventStats.total}
                            </span>
                        ) : (
                            <span
                                className="tree-event-meta all-pub"
                                title={`Toàn bộ ${eventStats.total}/${eventStats.total} màn đã xuất bản`}
                            >
                                {eventStats.total}/{eventStats.total}
                            </span>
                        )
                    )}
                </div>

                <div className="redesign-tree-actions" onClick={e => e.stopPropagation()}>
                    {/* Quick Story Status Toggle */}
                    {node.type === 'story' && (
                        <button
                            className="redesign-tree-btn"
                            title={node.status === 'draft' ? "Bấm để Xuất Bản ngay (Public)" : "Bấm để chuyển thành Bản Nháp (Draft)"}
                            onClick={() => onToggleStatus(node)}
                        >
                            {node.status === 'draft' ? (
                                <Eye size={13} style={{ color: '#BA8530' }} />
                            ) : (
                                <EyeOff size={13} style={{ color: '#81c784' }} />
                            )}
                        </button>
                    )}

                    {/* Bulk Event Status Toggle */}
                    {node.type === 'event' && eventStats && eventStats.total > 0 && (
                        <button
                            className="redesign-tree-btn"
                            title={eventStats.draft > 0 ? `Xuất bản tất cả (${eventStats.draft} bản nháp)` : "Chuyển toàn bộ chương thành bản nháp"}
                            onClick={() => onBulkToggleEvent(node, eventStats.draft > 0 ? 'published' : 'draft')}
                        >
                            {eventStats.draft > 0 ? (
                                <Eye size={13} style={{ color: '#BA8530' }} />
                            ) : (
                                <EyeOff size={13} style={{ color: '#81c784' }} />
                            )}
                        </button>
                    )}

                    {node.type !== 'story' && (
                        <button
                            className="redesign-tree-btn"
                            title={`Thêm ${{ region: 'Arc', arc: 'Event', event: 'Story' }[node.type]}`}
                            onClick={() => onAdd(node)}
                        >
                            <Plus size={13} />
                        </button>
                    )}
                    <button
                        className="redesign-tree-btn danger"
                        title="Xoá"
                        onClick={() => onDelete(node)}
                    >
                        <Trash2 size={13} />
                    </button>
                    <button
                        className="redesign-tree-btn"
                        title="Chỉnh sửa"
                        onClick={() => onEdit(node)}
                    >
                        <Edit size={12} />
                    </button>
                </div>
            </div>

            {isOpen && hasChildren && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            expandedMap={expandedMap}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            onAdd={onAdd}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onToggleStatus={onToggleStatus}
                            onBulkToggleEvent={onBulkToggleEvent}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function StoryTreePanel({
    onStorySelect,
    onAddItem,
    onEditItem,
    currentStoryId,
    selectedEntityId,
    showNotification,
    reloadRef
}) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [internalSelectedId, setInternalSelectedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
    const [searchQuery, setSearchQuery] = useState('');

    const activeSelectedId = selectedEntityId || currentStoryId || internalSelectedId;

    const [expandedMap, setExpandedMap] = useState(() => {
        try {
            const saved = localStorage.getItem('story_tree_expanded');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: () => { } });

    useEffect(() => {
        loadTree();
    }, []);

    const [isReloading, setIsReloading] = useState(false);

    const loadTree = async (force = false) => {
        if (force) setIsReloading(true);
        else if (tree.length === 0) setLoading(true);

        try {
            const data = await EditorCache.getStoryTree({ force });
            setTree(data || []);
            if (force) {
                showNotification?.('Đã làm mới danh mục cốt truyện từ máy chủ', 'success');
            }
        } catch (err) {
            console.error('Failed to load story tree:', err);
            showNotification?.('Tải danh mục cốt truyện thất bại', 'error');
        } finally {
            setLoading(false);
            setIsReloading(false);
        }
    };

    useEffect(() => {
        loadTree(false);
    }, []);

    // Reactive cache updates from other components
    useEffect(() => {
        const handleCacheUpdate = (e) => {
            if (e.detail?.type === 'storyTree' || e.detail?.type === 'all') {
                loadTree(false);
            }
        };
        window.addEventListener('cedEditorCacheUpdated', handleCacheUpdate);
        return () => {
            window.removeEventListener('cedEditorCacheUpdated', handleCacheUpdate);
        };
    }, []);

    useEffect(() => {
        if (reloadRef) {
            reloadRef.current = () => loadTree(true);
        }
    }, [reloadRef]);

    const counts = useMemo(() => getStoryCounts(tree), [tree]);

    const filteredTree = useMemo(() => {
        return filterTree(tree, statusFilter, searchQuery);
    }, [tree, statusFilter, searchQuery]);

    // When filtering by draft or search query, auto-expand all matching branches
    const activeExpandedMap = useMemo(() => {
        if (statusFilter !== 'all' || searchQuery.trim()) {
            const map = {};
            function expandAll(nodes) {
                for (const n of nodes || []) {
                    map[n.id] = true;
                    if (n.children) expandAll(n.children);
                }
            }
            expandAll(filteredTree);
            return map;
        }
        return expandedMap;
    }, [statusFilter, searchQuery, filteredTree, expandedMap]);

    const handleToggle = (id, currentOpen) => {
        setExpandedMap(prev => {
            const next = { ...prev, [id]: !currentOpen };
            try { localStorage.setItem('story_tree_expanded', JSON.stringify(next)); } catch (e) { }
            return next;
        });
    };

    const handleSelect = (node) => {
        if (!selectedEntityId && !currentStoryId) {
            setInternalSelectedId(node.id);
        }
        if (node.type === 'story') {
            onStorySelect(node.story_id || node.id, node);
        } else {
            onStorySelect(null, node);
        }
    };

    const handleToggleStoryStatus = async (node) => {
        const nextStatus = node.status === 'draft' ? 'published' : 'draft';
        try {
            await SupabaseAPI.toggleStoryStatus(node.story_id || node.id, nextStatus);
            EditorCache.invalidateStoryTree();
            showNotification?.(
                `Đã chuyển "${node.name}" sang ${nextStatus === 'published' ? 'ĐÃ XUẤT BẢN' : 'BẢN NHÁP'}.`,
                'success'
            );
            await loadTree(false);
        } catch (err) {
            console.error('Toggle story status error:', err);
            showNotification?.(`Lỗi đổi trạng thái: ${err.message}`, 'error');
        }
    };

    const handleBulkToggleEvent = (eventNode, targetStatus) => {
        const stories = (eventNode.children || []).filter(c => c.type === 'story');
        const targetStories = stories.filter(s => s.status !== targetStatus);
        if (targetStories.length === 0) return;

        const actionText = targetStatus === 'published' ? 'XUẤT BẢN' : 'CHUYỂN THÀNH BẢN NHÁP';
        setConfirmData({
            title: `${actionText} TOÀN BỘ CHƯƠNG`,
            message: `Bạn có chắc muốn ${actionText.toLowerCase()} tất cả ${targetStories.length} màn kịch bản trong "${eventNode.name}"?`,
            onConfirm: async () => {
                setConfirmOpen(false);
                setLoading(true);
                try {
                    await Promise.all(
                        targetStories.map(s => SupabaseAPI.toggleStoryStatus(s.story_id || s.id, targetStatus))
                    );
                    EditorCache.invalidateStoryTree();
                    showNotification?.(`Đã ${actionText.toLowerCase()} ${targetStories.length} màn kịch bản!`, 'success');
                    await loadTree(false);
                } catch (err) {
                    console.error('Bulk toggle event status error:', err);
                    showNotification?.(`Lỗi: ${err.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
        setConfirmOpen(true);
    };

    const handleAdd = (parentNode) => {
        const nextType = { region: 'arc', arc: 'event', event: 'story' }[parentNode.type];
        if (!nextType) return;
        const defaultOrder = (parentNode.children?.length || 0) + 1;
        onAddItem(nextType, parentNode, loadTree, defaultOrder);
    };

    const handleEdit = (node) => {
        onEditItem(node, loadTree);
    };

    const handleDelete = (node) => {
        const typeLabels = { region: 'Region', arc: 'Arc', event: 'Event', story: 'Story' };
        let warningMsg = `Bạn có chắc chắn muốn xoá ${typeLabels[node.type]} "${node.name}" không?`;
        if (node.children?.length > 0) {
            warningMsg += ` Lưu ý: Tất cả các mục con bên trong cũng sẽ bị ảnh hưởng!`;
        }

        setConfirmData({
            title: `XOÁ ${typeLabels[node.type]?.toUpperCase()}`,
            message: warningMsg,
            onConfirm: async () => {
                setConfirmOpen(false);
                setLoading(true);
                try {
                    if (node.type === 'region') await SupabaseAPI.deleteRegion(node.region_id || node.id);
                    else if (node.type === 'arc') await SupabaseAPI.deleteArc(node.arc_id || node.id);
                    else if (node.type === 'event') await SupabaseAPI.deleteEvent(node.event_id || node.id);
                    else if (node.type === 'story') await SupabaseAPI.deleteStory(node.story_id || node.id);

                    EditorCache.invalidateStoryTree();
                    showNotification?.(`Đã xoá ${typeLabels[node.type]} "${node.name}"`, 'success');
                    if (activeSelectedId === node.id) {
                        setInternalSelectedId(null);
                        onStorySelect(null, null);
                    }
                    await loadTree(false);
                } catch (err) {
                    console.error('Delete node failed:', err);
                    showNotification?.(`Xoá thất bại: ${err.message}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
        setConfirmOpen(true);
    };

    if (loading && tree.length === 0) {
        return (
            <div style={{ padding: '1.5rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Loader className="spinning" size={18} /> Đang tải dữ liệu...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top Toolbar */}
            <div style={{ padding: '0.65rem 0.75rem', backgroundColor: '#141414', borderBottom: '1px solid rgba(245,237,220,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(245,237,220,0.6)' }}>CẤU TRÚC CỐT TRUYỆN</span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                        className="redesign-tool-btn"
                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: isReloading ? 'not-allowed' : 'pointer' }}
                        onClick={() => loadTree(true)}
                        disabled={isReloading}
                        title="Làm mới danh mục cốt truyện từ máy chủ"
                    >
                        <RotateCw size={12} className={isReloading ? 'spinning' : ''} />
                        <span>Làm mới</span>
                    </button>
                    <button
                        className="redesign-btn primary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => onAddItem('region', null, () => loadTree(true), tree.length + 1)}
                    >
                        <Plus size={12} /> Thêm Region
                    </button>
                </div>
            </div>

            {/* Publication Status Filter Tabs */}
            <div className="tree-filter-tabs">
                <button
                    className={`tree-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                    title={`Tất cả: ${counts.total} màn`}
                >
                    <span className="tab-label">TẤT CẢ</span>
                    <span className="tab-count">({counts.total})</span>
                </button>
                <button
                    className={`tree-filter-tab tab-pub ${statusFilter === 'published' ? 'active tab-pub' : ''}`}
                    onClick={() => setStatusFilter('published')}
                    title={`Đã xuất bản: ${counts.pub} màn`}
                >
                    <span className="tab-label">XUẤT BẢN</span>
                    <span className="tab-count">({counts.pub})</span>
                </button>
                <button
                    className={`tree-filter-tab tab-draft ${statusFilter === 'draft' ? 'active tab-draft' : ''}`}
                    onClick={() => setStatusFilter('draft')}
                    title={`Bản nháp: ${counts.draft} màn`}
                >
                    <span className="tab-label">BẢN NHÁP</span>
                    <span className="tab-count">({counts.draft})</span>
                </button>
            </div>

            {/* Quick Search */}
            <div className="tree-search-bar">
                <Search size={12} color="rgba(245,237,220,0.5)" />
                <input
                    type="text"
                    className="tree-search-input"
                    placeholder="Tìm tên hoặc ID chương..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(245,237,220,0.5)', cursor: 'pointer', padding: 0, display: 'flex' }}
                        title="Xoá tìm kiếm"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Tree Nodes List */}
            <div className="redesign-tree-panel">
                {filteredTree.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(245,237,220,0.4)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        NO_ITEMS_FOUND // {statusFilter.toUpperCase()}
                    </div>
                ) : (
                    filteredTree.map(regionNode => (
                        <TreeNode
                            key={regionNode.id}
                            node={regionNode}
                            selectedId={activeSelectedId}
                            expandedMap={activeExpandedMap}
                            onToggle={handleToggle}
                            onSelect={handleSelect}
                            onAdd={handleAdd}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onToggleStatus={handleToggleStoryStatus}
                            onBulkToggleEvent={handleBulkToggleEvent}
                        />
                    ))
                )}
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title={confirmData.title}
                message={confirmData.message}
                onConfirm={confirmData.onConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}
