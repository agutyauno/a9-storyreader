import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarTabs from './SidebarTabs';
import StoryTreePanel from './StoryTreePanel';
import AssetPanel from './AssetPanel';
import AddItemModal from './AddItemModal';
import AddAssetModal from './AddAssetModal';
import { SupabaseAPI } from '../../services/supabaseApi';
import pageStyles from '../../pages/EditorPage.module.css';

export default function EditorSidebar({ metadata, onMetadataChange, onStorySelect, currentStoryId, reloadRef, onPickAsset, showNotification }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('story');

    // AddItemModal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('region');
    const [modalParent, setModalParent] = useState(null);
    const [modalOrder, setModalOrder] = useState(1);
    const [initialData, setInitialData] = useState(null);
    const reloadTreeRef = useRef(null); // callback to reload tree after CRUD

    // AddAssetModal state
    const [assetModalOpen, setAssetModalOpen] = useState(false);
    const [assetModalCategory, setAssetModalCategory] = useState(null);
    const assetReloadRef = useRef(null);

    // Expose tree reload to parent
    useEffect(() => {
        if (reloadRef) {
            reloadRef.current = () => reloadTreeRef.current?.();
        }
    }, [reloadRef]);

    // ─── Story tree CRUD ───────────────────────────────────────────────────────
    const handleAddItem = (type, parentNode, reloadFn, defaultOrder) => {
        setModalType(type);
        setModalParent(parentNode);
        setModalOrder(defaultOrder || 1);
        setInitialData(null);
        reloadTreeRef.current = reloadFn;
        setModalOpen(true);
    };

    const handleEditItem = (node, reloadFn) => {
        setModalType(node.type);
        setModalParent(null); 
        setInitialData(node);
        reloadTreeRef.current = reloadFn;
        setModalOpen(true);
    };

    const handleModalSubmit = async (formData, isEditMode) => {
        try {
            let result;
            if (modalType === 'region') {
                const payload = {
                    region_id: formData.id,
                    name: formData.name,
                    description: formData.description,
                    display_order: formData.displayOrder,
                    icon_url: formData.imageUrl,
                };
                result = isEditMode 
                    ? await SupabaseAPI.updateRegion(formData.id, payload)
                    : await SupabaseAPI.createRegion(payload);
            } else if (modalType === 'arc') {
                const payload = {
                    arc_id: formData.id,
                    name: formData.name,
                    description: formData.description,
                    display_order: formData.displayOrder,
                    region_id: isEditMode ? initialData.region_id : (modalParent?.region_id || modalParent?.id),
                };
                result = isEditMode 
                    ? await SupabaseAPI.updateArc(formData.id, payload)
                    : await SupabaseAPI.createArc(payload);
            } else if (modalType === 'event') {
                const payload = {
                    event_id: formData.id,
                    name: formData.name,
                    description: formData.description,
                    display_order: formData.displayOrder,
                    arc_id: isEditMode ? initialData.arc_id : (modalParent?.arc_id || modalParent?.id),
                    image_url: formData.imageUrl,
                };
                result = isEditMode 
                    ? await SupabaseAPI.updateEvent(formData.id, payload)
                    : await SupabaseAPI.createEvent(payload);
            } else if (modalType === 'story') {
                const payload = {
                    story_id: formData.id,
                    name: formData.name,
                    description: formData.description,
                    display_order: formData.displayOrder,
                    event_id: isEditMode ? initialData.event_id : (modalParent?.event_id || modalParent?.id),
                };
                if (!isEditMode) {
                    payload.story_content = { characters: {}, sections: [] };
                }
                result = isEditMode 
                    ? await SupabaseAPI.updateStory(formData.id, payload)
                    : await SupabaseAPI.createStory(payload);
            } else if (modalType === 'character') {
                const payload = {
                    character_id: formData.id,
                    name: formData.name,
                    description: formData.description,
                    expressions: formData.expressions
                };
                result = await SupabaseAPI.createCharacter(payload);
            } else if (modalType === 'gallery') {
                const payload = {
                    gallery_id: formData.id,
                    title: formData.name,
                    display_order: formData.displayOrder,
                    event_id: modalParent?.event_id || modalParent?.id || null, 
                    image_url: formData.imageUrl
                };
                result = await SupabaseAPI.createGallery(payload);
            }
            // Reload tree or asset list
            reloadTreeRef.current?.();
            setModalOpen(false);

            // If a story was created, open it in the editor
            if (modalType === 'story' && !isEditMode && result?.story_id) {
                navigate(`/editor/${result.story_id}`);
            }
        } catch (err) {
            console.error('Create item failed:', err);
            // Re-throw so the modal can show the error
            throw err;
        }
    };

    // ─── Asset CRUD ────────────────────────────────────────────────────────────
    const handleAssetSubmit = async (formData) => {
        try {
            let created;
            if (formData.type === 'character') {
                created = await SupabaseAPI.createCharacter({
                    character_id: formData.id,
                    name: formData.name,
                    description: formData.description || '',
                    expressions: formData.expressions || []
                });
            } else if (formData.category === 'gallery') {
                created = await SupabaseAPI.createGallery({
                    gallery_id: formData.id,
                    title: formData.name,
                    image_url: formData.url || '',
                    display_order: 0
                });
            } else {
                // Table 'assets' only has: asset_id, type, category, url
                created = await SupabaseAPI.createAsset({
                    asset_id: formData.asset_id || formData.id,
                    type: formData.type,
                    category: formData.category,
                    url: formData.url || '',
                });
            }
            assetReloadRef.current?.();
            setAssetModalOpen(false);
        } catch (err) {
            console.error('Create asset/character failed:', err);
            // Re-throw so the modal can show the error
            throw err;
        }
    };

    const handleAddAsset = (category, reloadFn) => {
        setAssetModalCategory(category);
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
                    onEditItem={handleEditItem}
                    currentStoryId={currentStoryId}
                    showNotification={showNotification}
                />
            )}

            {/* Asset Tab */}
            {activeTab === 'asset' && (
                <AssetPanel onAddAsset={handleAddAsset} onPickAsset={onPickAsset} showNotification={showNotification} />
            )}

            {/* Modals */}
            <AddItemModal
                isOpen={modalOpen}
                type={modalType}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
                onPickAsset={onPickAsset}
                initialDisplayOrder={modalOrder}
                initialData={initialData}
            />
            <AddAssetModal
                isOpen={assetModalOpen}
                onClose={() => setAssetModalOpen(false)}
                onSubmit={handleAssetSubmit}
                initialCategory={assetModalCategory}
            />
        </aside>
    );
}
