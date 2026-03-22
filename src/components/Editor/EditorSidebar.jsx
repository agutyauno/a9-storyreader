import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarTabs from './SidebarTabs';
import StoryTreePanel from './StoryTreePanel';
import AssetPanel from './AssetPanel';
import AddItemModal from './AddItemModal';
import AddAssetModal from './AddAssetModal';
import { SupabaseAPI } from '../../services/supabaseApi';
import pageStyles from '../../pages/EditorPage.module.css';

export default function EditorSidebar({ metadata, onMetadataChange, onStorySelect, currentStoryId }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('story');

    // AddItemModal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('region');
    const [modalParent, setModalParent] = useState(null);
    const reloadTreeRef = useRef(null); // callback to reload tree after CRUD

    // AddAssetModal state
    const [assetModalOpen, setAssetModalOpen] = useState(false);
    const assetReloadRef = useRef(null);

    // ─── Metadata form ─────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        onMetadataChange(prev => ({
            ...prev,
            [name]: name === 'display_order' ? (value ? parseInt(value) : null) : value
        }));
    };

    // ─── Story tree CRUD ───────────────────────────────────────────────────────
    const handleAddItem = (type, parentNode, reloadFn) => {
        setModalType(type);
        setModalParent(parentNode);
        reloadTreeRef.current = reloadFn;
        setModalOpen(true);
    };

    const handleModalSubmit = async (formData) => {
        try {
            let created;
            if (modalType === 'region') {
                created = await SupabaseAPI.createRegion({
                    name: formData.name,
                    description: formData.description,
                    display_order: formData.display_order ?? 0,
                    icon_url: formData.imageUrl,
                });
            } else if (modalType === 'arc') {
                created = await SupabaseAPI.createArc({
                    name: formData.name,
                    description: formData.description,
                    display_order: formData.display_order ?? 0,
                    region_id: modalParent?.region_id || modalParent?.id,
                });
            } else if (modalType === 'event') {
                created = await SupabaseAPI.createEvent({
                    name: formData.name,
                    description: formData.description,
                    display_order: formData.display_order ?? 0,
                    arc_id: modalParent?.arc_id || modalParent?.id,
                    image_url: formData.imageUrl,
                });
            } else if (modalType === 'story') {
                created = await SupabaseAPI.createStory({
                    name: formData.name,
                    description: formData.description,
                    display_order: formData.display_order ?? 0,
                    event_id: modalParent?.event_id || modalParent?.id,
                    story_content: { characters: {}, sections: [] },
                });
            }
            // Reload tree
            reloadTreeRef.current?.();
            setModalOpen(false);

            // If a story was created, open it in the editor
            if (modalType === 'story' && created?.story_id) {
                navigate(`/editor/${created.story_id}`);
            }
        } catch (err) {
            console.error('Create item failed:', err);
            alert(`Tạo thất bại: ${err.message}`);
        }
    };

    // ─── Asset CRUD ────────────────────────────────────────────────────────────
    const handleAssetSubmit = async (formData) => {
        try {
            await SupabaseAPI.createAsset({
                asset_id: formData.asset_id,
                name: formData.name,
                type: formData.type,
                category: formData.category,
                url: formData.url || '',
            });
            assetReloadRef.current?.();
            setAssetModalOpen(false);
        } catch (err) {
            console.error('Create asset failed:', err);
            alert(`Lỗi tạo asset: ${err.message}`);
        }
    };

    const handleAddAsset = (reloadFn) => {
        assetReloadRef.current = reloadFn;
        setAssetModalOpen(true);
    };

    return (
        <aside className={pageStyles.sidebar}>
            {/* Tab Bar */}
            <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Story Tab */}
            {activeTab === 'story' && (
                <>
                    <StoryTreePanel
                        onStorySelect={onStorySelect}
                        onAddItem={handleAddItem}
                        currentStoryId={currentStoryId}
                    />

                    {/* Metadata for currently loaded story */}
                    <div className={pageStyles.sidebarContent} style={{ borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
                        <h2 className={pageStyles.sidebarTitle}>Properties</h2>

                        <div className={pageStyles.formGroup}>
                            <label htmlFor="sidebar-name" className={pageStyles.formLabel}>Name</label>
                            <input
                                id="sidebar-name"
                                name="name"
                                type="text"
                                value={metadata.name || ''}
                                onChange={handleChange}
                                className={pageStyles.formInput}
                                placeholder="Story Title"
                            />
                        </div>

                        <div className={pageStyles.formGroup}>
                            <label htmlFor="sidebar-order" className={pageStyles.formLabel}>Display Order</label>
                            <input
                                id="sidebar-order"
                                name="display_order"
                                type="number"
                                min="0"
                                value={metadata.display_order ?? ''}
                                onChange={handleChange}
                                className={pageStyles.formInput}
                                placeholder="e.g. 1"
                            />
                        </div>

                        <div className={pageStyles.formGroup}>
                            <label htmlFor="sidebar-desc" className={pageStyles.formLabel}>Description</label>
                            <textarea
                                id="sidebar-desc"
                                name="description"
                                rows="3"
                                value={metadata.description || ''}
                                onChange={handleChange}
                                className={pageStyles.formTextarea}
                                placeholder="Brief summary..."
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Asset Tab */}
            {activeTab === 'asset' && (
                <AssetPanel onAddAsset={handleAddAsset} />
            )}

            {/* Modals */}
            <AddItemModal
                isOpen={modalOpen}
                type={modalType}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
            />
            <AddAssetModal
                isOpen={assetModalOpen}
                onClose={() => setAssetModalOpen(false)}
                onSubmit={handleAssetSubmit}
            />
        </aside>
    );
}
