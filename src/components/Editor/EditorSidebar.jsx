import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarTabs from './SidebarTabs';
import StoryTreePanel from './StoryTreePanel';
import AssetPanel from './AssetPanel';
import AddItemModal from './AddItemModal';
import AddAssetModal from './AddAssetModal';
import { SupabaseAPI } from '../../services/supabaseApi';
import pageStyles from '../../pages/EditorPage.module.css';

export default function EditorSidebar({ metadata, onMetadataChange, onStorySelect, currentStoryId, reloadRef, onPickAsset }) {
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

    // Expose tree reload to parent
    useEffect(() => {
        if (reloadRef) {
            reloadRef.current = () => reloadTreeRef.current?.();
        }
    }, [reloadRef]);

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
                    display_order: formData.displayOrder ?? 0,
                    event_id: modalParent?.event_id || modalParent?.id,
                    story_content: { characters: {}, sections: [] },
                });
            } else if (modalType === 'character') {
                created = await SupabaseAPI.createCharacter({
                    id: formData.id,
                    name: formData.name,
                    description: formData.description,
                    expressions: formData.expressions
                });
            } else if (modalType === 'gallery') {
                created = await SupabaseAPI.createGallery({
                    id: formData.id,
                    name: formData.name,
                    description: formData.description,
                    displayOrder: formData.displayOrder ?? 0,
                    event_id: modalParent?.event_id || modalParent?.id || null, // Optional FK
                    imageUrl: formData.imageUrl
                });
            }
            // Reload tree or asset list
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
            if (formData.type === 'character') {
                await SupabaseAPI.createCharacter({
                    id: formData.asset_id,
                    name: formData.name,
                    description: formData.description || '',
                }, formData.expressions || []);
            } else {
                await SupabaseAPI.createAsset({
                    asset_id: formData.asset_id,
                    name: formData.name,
                    description: formData.description || '',
                    type: formData.type,
                    category: formData.category,
                    url: formData.url || '',
                });
            }
            assetReloadRef.current?.();
            setAssetModalOpen(false);
        } catch (err) {
            console.error('Create asset/character failed:', err);
            alert(`Lỗi tạo: ${err.message}`);
        }
    };

    const handleAddAsset = (type, reloadFn) => {
        assetReloadRef.current = reloadFn;
        setAssetModalOpen(true);
    };

    return (
        <aside className={pageStyles.sidebar}>
            {/* Tab Bar */}
            <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Story Tab */}
            {activeTab === 'story' && (
                <StoryTreePanel
                    onStorySelect={onStorySelect}
                    onAddItem={handleAddItem}
                    currentStoryId={currentStoryId}
                />
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
