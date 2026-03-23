import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, ChevronDown, Layers, BookOpen, Bookmark, FileText, Loader, Trash2 } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import styles from './StoryTreePanel.module.css';

// ─── Icons per type ───────────────────────────────────────────────────────────
const TYPE_ICON = {
    region: <Layers size={14} />,
    arc:    <BookOpen size={14} />,
    event:  <Bookmark size={14} />,
    story:  <FileText size={14} />,
};

// ─── Single Node ──────────────────────────────────────────────────────────────
function TreeNode({ node, depth = 0, selectedId, onSelect, onAdd, onDelete }) {
    const [open, setOpen] = useState(depth < 2);
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
                    onClick={() => setOpen(v => !v)}
                    style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
                >
                    {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
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
                </span>
            </div>

            {open && hasChildren && (
                <div className={styles.children}>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onAdd={onAdd}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function StoryTreePanel({ onStorySelect, onAddItem, currentStoryId }) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(currentStoryId || null);

    // Sync selection when parent changes (e.g., after save that creates a story ID)
    useEffect(() => {
        if (currentStoryId) setSelectedId(currentStoryId);
    }, [currentStoryId]);

    // ─── Load tree from API ───────────────────────────────────────────────────
    const loadTree = async () => {
        setLoading(true);
        try {
            const regions = await SupabaseAPI.getRegions();

            const built = await Promise.all(regions.map(async (region) => {
                const arcs = await SupabaseAPI.getArcsByRegion(region.region_id);
                const arcNodes = await Promise.all(arcs.map(async (arc) => {
                    const events = await SupabaseAPI.getEventsByArc(arc.arc_id);
                    const eventNodes = await Promise.all(events.map(async (event) => {
                        const stories = await SupabaseAPI.getStoriesByEvent(event.event_id);
                        return {
                            id: event.event_id,
                            type: 'event',
                            parentId: arc.arc_id,
                            parentType: 'arc',
                            ...event,
                            children: stories.map(s => ({
                                id: s.story_id,
                                type: 'story',
                                parentId: event.event_id,
                                parentType: 'event',
                                ...s,
                                children: []
                            }))
                        };
                    }));
                    return {
                        id: arc.arc_id,
                        type: 'arc',
                        parentId: region.region_id,
                        parentType: 'region',
                        ...arc,
                        children: eventNodes
                    };
                }));
                return {
                    id: region.region_id,
                    type: 'region',
                    parentId: null,
                    parentType: null,
                    ...region,
                    children: arcNodes
                };
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

    // ─── Add child node ───────────────────────────────────────────────────────
    const handleAddChild = (parentNode) => {
        const childType = { region: 'arc', arc: 'event', event: 'story' }[parentNode.type];
        if (!childType || !onAddItem) return;
        onAddItem(childType, parentNode, () => loadTree());
    };

    // ─── Delete node ─────────────────────────────────────────────────────────
    const handleDelete = async (node) => {
        const confirmMsg = `Bạn có chắc muốn xoá "${node.name}"?\nHành động này không thể hoàn tác.`;
        if (!window.confirm(confirmMsg)) return;
        try {
            if (node.type === 'region') await SupabaseAPI.deleteRegion(node.region_id);
            else if (node.type === 'arc') await SupabaseAPI.deleteArc(node.arc_id);
            else if (node.type === 'event') await SupabaseAPI.deleteEvent(node.event_id);
            else if (node.type === 'story') await SupabaseAPI.deleteStory(node.story_id);
            await loadTree();
        } catch (err) {
            console.error('Delete failed:', err);
            alert(`Xoá thất bại: ${err.message}`);
        }
    };

    // ─── Add top-level region ─────────────────────────────────────────────────
    const handleAddRegion = () => {
        if (!onAddItem) return;
        onAddItem('region', null, () => loadTree());
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
                            onSelect={handleSelect}
                            onAdd={handleAddChild}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
