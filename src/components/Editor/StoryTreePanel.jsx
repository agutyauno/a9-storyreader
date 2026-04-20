import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, ChevronDown, Layers, BookOpen, Bookmark, FileText, Loader, Trash2, Edit } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import ConfirmModal from './ConfirmModal';
import styles from './StoryTreePanel.module.css';

// ─── Icons per type ───────────────────────────────────────────────────────────
const TYPE_ICON = {
    region: <Layers size={14} />,
    arc: <BookOpen size={14} />,
    event: <Bookmark size={14} />,
    story: <FileText size={14} />,
};

// ─── Single Node ──────────────────────────────────────────────────────────────
function TreeNode({ node, depth = 0, selectedId, expandedMap, onToggle, onSelect, onAdd, onDelete, onEdit }) {
    // If not in map, default to open for top 2 levels
    const isOpen = expandedMap[node.id] !== undefined ? expandedMap[node.id] : (depth < 2);
    const hasChildren = node.children?.length > 0;
    const isSelected = selectedId === node.id;

    return (
        <div className={styles.nodeGroup}>
            <div
                className={`${styles.nodeRow} ${isSelected ? styles.selected : ''}`}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
                {/* Expand toggle */}
                <span
                    className={styles.chevron}
                    onClick={() => onToggle(node.id, isOpen)}
                    style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
                >
                    {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>

                {/* Type icon + label */}
                <span
                    className={styles.nodeLabel}
                    onClick={() => onSelect(node)}
                    title={node.description || node.name}
                >
                    <span className={`${styles.typeIcon} ${styles[node.type]}`}>
                        {TYPE_ICON[node.type]}
                    </span>
                    {node.name}
                </span>

                {/* Action buttons */}
                <span className={styles.nodeActions}>
                    {/* Add child */}
                    {node.type !== 'story' && (
                        <button
                            className={styles.actionBtn}
                            title={`Thêm ${{ region: 'Arc', arc: 'Event', event: 'Story' }[node.type]}`}
                            onClick={(e) => { e.stopPropagation(); onAdd(node); }}
                        >
                            <Plus size={15} />
                        </button>
                    )}
                    {/* Delete */}
                    <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        title="Xoá"
                        onClick={(e) => { e.stopPropagation(); onDelete(node); }}
                    >
                        <Trash2 size={15} />
                    </button>
                    {/* Edit */}
                    <button
                        className={styles.actionBtn}
                        title="Chỉnh sửa"
                        onClick={(e) => { e.stopPropagation(); onEdit(node); }}
                    >
                        <Edit size={14} />
                    </button>
                </span>
            </div>

            {isOpen && hasChildren && (
                <div className={styles.children}>
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function StoryTreePanel({ onStorySelect, onAddItem, onEditItem, currentStoryId, showNotification }) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(currentStoryId || null);

    // Expansion state: { [nodeId]: boolean }
    const [expandedMap, setExpandedMap] = useState(() => {
        try {
            const saved = localStorage.getItem('story_tree_expanded');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });

    // Confirm modal
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: () => { } });

    // Persist expansion state
    useEffect(() => {
        localStorage.setItem('story_tree_expanded', JSON.stringify(expandedMap));
    }, [expandedMap]);

    // Sync selection when parent changes (e.g., after save that creates a story ID)
    useEffect(() => {
        if (currentStoryId) setSelectedId(currentStoryId);
    }, [currentStoryId]);

    // ─── Load tree from API ───────────────────────────────────────────────────
    const loadTree = async () => {
        setLoading(true);
        try {
            // Parallel fetch all layers in one go
            const [regions, arcs, events, stories] = await Promise.all([
                SupabaseAPI.getRegions(),
                SupabaseAPI.getArcs(),
                SupabaseAPI.getEvents(),
                SupabaseAPI.getStories(),
            ]);

            // Create maps for efficient building
            const storiesByEvent = {};
            stories.forEach(s => {
                const eid = s.event_id;
                if (!storiesByEvent[eid]) storiesByEvent[eid] = [];
                storiesByEvent[eid].push({
                    type: 'story',
                    parentId: eid,
                    parentType: 'event',
                    ...s,
                    id: s.story_id,
                    children: []
                });
            });

            const eventsByArc = {};
            events.forEach(e => {
                const aid = e.arc_id;
                if (!eventsByArc[aid]) eventsByArc[aid] = [];
                eventsByArc[aid].push({
                    type: 'event',
                    parentId: aid,
                    parentType: 'arc',
                    ...e,
                    id: e.event_id,
                    children: storiesByEvent[e.event_id] || []
                });
            });

            const arcsByRegion = {};
            arcs.forEach(a => {
                const rid = a.region_id;
                if (!arcsByRegion[rid]) arcsByRegion[rid] = [];
                arcsByRegion[rid].push({
                    type: 'arc',
                    parentId: rid,
                    parentType: 'region',
                    ...a,
                    id: a.arc_id,
                    children: eventsByArc[a.arc_id] || []
                });
            });

            const built = regions.map(r => ({
                type: 'region',
                parentId: null,
                parentType: null,
                ...r,
                id: r.region_id,
                children: arcsByRegion[r.region_id] || []
            }));

            setTree(built);
        } catch (err) {
            console.error('Failed to load story tree:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTree(); }, []);

    // ─── Node selection ───────────────────────────────────────────────────────
    const handleSelect = (node) => {
        setSelectedId(node.id);
        if (onStorySelect) {
            onStorySelect(node);
        }
    };

    // ─── Toggle node expansion ───────────────────────────────────────────────
    const handleToggleNode = (nodeId, currentlyOpen) => {
        setExpandedMap(prev => ({
            ...prev,
            [nodeId]: !currentlyOpen
        }));
    };

    // ─── Add child node ───────────────────────────────────────────────────────
    const handleAddChild = (parentNode) => {
        const childType = { region: 'arc', arc: 'event', event: 'story' }[parentNode.type];
        if (!childType || !onAddItem) return;

        // Auto-increment: count existing children
        const nextOrder = (parentNode.children?.length || 0) + 1;
        onAddItem(childType, parentNode, () => loadTree(), nextOrder);
    };

    // ─── Delete node ─────────────────────────────────────────────────────────
    const handleDelete = async (node) => {
        setConfirmData({
            title: `Xoá ${node.type}`,
            message: `Bạn có chắc muốn xoá "${node.name}"?\nHành động này không thể hoàn tác.`,
            onConfirm: async () => {
                try {
                    if (node.type === 'region') await SupabaseAPI.deleteRegion(node.region_id);
                    else if (node.type === 'arc') await SupabaseAPI.deleteArc(node.arc_id);
                    else if (node.type === 'event') await SupabaseAPI.deleteEvent(node.event_id);
                    else if (node.type === 'story') await SupabaseAPI.deleteStory(node.story_id);
                    await loadTree();
                    showNotification(`Đã xoá ${node.type} thành công`, 'success');
                } catch (err) {
                    console.error('Delete failed:', err);
                    showNotification(`Xoá thất bại: ${err.message}`, 'error');
                }
            }
        });
        setConfirmOpen(true);
    };

    // ─── Edit node ───────────────────────────────────────────────────────────
    const handleEdit = (node) => {
        if (onEditItem) {
            onEditItem(node, () => loadTree());
        }
    };

    // ─── Add top-level region ─────────────────────────────────────────────────
    const handleAddRegion = () => {
        if (!onAddItem) return;

        // Auto-increment: count top-level regions
        const nextOrder = tree.length + 1;
        onAddItem('region', null, () => loadTree(), nextOrder);
    };

    return (
        <div className={styles.panel}>
            {/* Panel toolbar */}
            <div className={styles.toolbar}>
                <span className={styles.panelTitle}>Story Tree</span>
                <button
                    className={styles.toolBtn}
                    title="Thêm Region mới"
                    onClick={handleAddRegion}
                >
                    <Plus size={14} /> Region
                </button>
            </div>

            {/* Tree content */}
            <div className={styles.treeScroll}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent)' }} />
                    </div>
                ) : tree.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Chưa có dữ liệu. Bấm "+ Region" để bắt đầu.</p>
                    </div>
                ) : (
                    tree.map(node => (
                        <TreeNode
                            key={node.id}
                            node={node}
                            depth={0}
                            selectedId={selectedId}
                            expandedMap={expandedMap}
                            onToggle={handleToggleNode}
                            onSelect={handleSelect}
                            onAdd={handleAddChild}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    ))
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmOpen}
                title={confirmData.title}
                message={confirmData.message}
                onConfirm={confirmData.onConfirm}
                onClose={() => setConfirmOpen(false)}
            />
        </div>
    );
}
