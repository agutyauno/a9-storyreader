import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, ChevronDown, Layers, BookOpen, Bookmark, FileText, Loader, Trash2, Edit } from 'lucide-react';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import ConfirmModal from '../modals/ConfirmModal';
import '../editorComponents.css';

const TYPE_ICON = {
    region: <Layers size={13} />,
    arc: <BookOpen size={13} />,
    event: <Bookmark size={13} />,
    story: <FileText size={13} />,
};

function TreeNode({ node, depth = 0, selectedId, expandedMap, onToggle, onSelect, onAdd, onDelete, onEdit }) {
    const isOpen = expandedMap[node.id] !== undefined ? expandedMap[node.id] : (depth < 2);
    const hasChildren = node.children?.length > 0;
    const isSelected = selectedId === node.id;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
                className={`redesign-tree-node ${isSelected ? 'selected' : ''}`}
                style={{ paddingLeft: `${8 + depth * 14}px` }}
                onClick={() => onSelect(node)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 0 }}>
                    <span
                        style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', visibility: hasChildren ? 'visible' : 'hidden' }}
                        onClick={(e) => { e.stopPropagation(); onToggle(node.id, isOpen); }}
                    >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: isSelected ? '#FFF' : '#D84315', display: 'flex' }}>
                            {TYPE_ICON[node.type]}
                        </span>
                        <span>{node.name}</span>
                    </span>
                </div>

                <div className="redesign-tree-actions" onClick={e => e.stopPropagation()}>
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function StoryTreePanel({ onStorySelect, onAddItem, onEditItem, currentStoryId, showNotification }) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(currentStoryId || null);

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

    useEffect(() => {
        if (currentStoryId) setSelectedId(currentStoryId);
    }, [currentStoryId]);

    const loadTree = async () => {
        setLoading(true);
        try {
            const data = await SupabaseAPI.getFullStoryTree();
            setTree(data || []);
        } catch (err) {
            console.error('Failed to load story tree:', err);
            showNotification?.('Tải danh mục cốt truyện thất bại', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id, currentOpen) => {
        setExpandedMap(prev => {
            const next = { ...prev, [id]: !currentOpen };
            try { localStorage.setItem('story_tree_expanded', JSON.stringify(next)); } catch (e) { }
            return next;
        });
    };

    const handleSelect = (node) => {
        setSelectedId(node.id);
        if (node.type === 'story') {
            onStorySelect(node.story_id || node.id, node);
        } else {
            onStorySelect(null, node);
        }
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
        const typeLabels = { region: 'Region (Vùng)', arc: 'Arc (Chương)', event: 'Event (Sự kiện)', story: 'Story (Bài viết)' };
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

                    showNotification?.(`Đã xoá ${typeLabels[node.type]} "${node.name}"`, 'success');
                    if (selectedId === node.id) {
                        setSelectedId(null);
                        onStorySelect(null, null);
                    }
                    await loadTree();
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

    if (loading) {
        return <div style={{ padding: '1.5rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><Loader className="spinning" size={18} /> Đang tải dữ liệu...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '0.65rem 0.75rem', backgroundColor: '#141414', borderBottom: '1px solid rgba(245,237,220,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(245,237,220,0.6)' }}>CẤU TRÚC CỐT TRUYỆN</span>
                <button
                    className="redesign-btn primary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    onClick={() => onAddItem('region', null, loadTree, tree.length + 1)}
                >
                    <Plus size={12} /> Thêm Region
                </button>
            </div>

            <div className="redesign-tree-panel">
                {tree.map(regionNode => (
                    <TreeNode
                        key={regionNode.id}
                        node={regionNode}
                        selectedId={selectedId}
                        expandedMap={expandedMap}
                        onToggle={handleToggle}
                        onSelect={handleSelect}
                        onAdd={handleAdd}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                ))}
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
