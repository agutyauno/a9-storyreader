import React, { useState, useRef, useEffect } from 'react';
import SidebarTabs from './SidebarTabs';
import StoryTreePanel from './StoryTreePanel';
import AssetPanel from './AssetPanel';
import AddItemModal from '../modals/AddItemModal';
import AddAssetModal from '../modals/AddAssetModal';
import { SupabaseAPI } from '../../../../../src/services/supabaseApi';
import '../editorComponents.css';

export default function EditorSidebar({ metadata, onMetadataChange, onStorySelect, currentStoryId, reloadRef, onPickAsset, showNotification }) {
    const [activeTab, setActiveTab] = useState('story');

    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('region');
    const [modalParent, setModalParent] = useState(null);
    const [modalOrder, setModalOrder] = useState(1);
    const [initialData, setInitialData] = useState(null);
    const reloadTreeRef = useRef(null);

    const [assetModalOpen, setAssetModalOpen] = useState(false);
    const [assetModalCategory, setAssetModalCategory] = useState(null);
    const assetReloadRef = useRef(null);

    useEffect(() => {
        if (reloadRef) {
            reloadRef.current = () => reloadTreeRef.current?.();
        }
    }, [reloadRef]);

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
                    banner_url: formData.bannerUrl,
                    wallpaper_url: formData.wallpaperUrl,
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
                    payload.script_text = `@bg ""\n\nName: Hello world!\n`;
                }
                result = isEditMode 
                    ? await SupabaseAPI.updateStory(formData.id, payload)
                    : await SupabaseAPI.createStory(payload);
            }

            showNotification?.(`Đã ${isEditMode ? 'cập nhật' : 'tạo mới'} ${modalType} "${formData.name}"`, 'success');
            reloadTreeRef.current?.();

            if (!isEditMode && modalType === 'story' && result) {
                onStorySelect(formData.id, {
                    ...payload,
                    id: formData.id,
                    type: 'story',
                });
            }
        } catch (err) {
            console.error('Submit item error:', err);
            showNotification?.(`Lỗi: ${err.message}`, 'error');
            throw err;
        }
    };

    const handleOpenAddAsset = (category) => {
        setAssetModalCategory(category);
        setAssetModalOpen(true);
    };

    const handleAddAssetSubmit = async (assetData) => {
        try {
            if (assetData.type === 'character') {
                await SupabaseAPI.createCharacter({
                    id: assetData.asset_id,
                    name: assetData.name,
                    description: assetData.description || '',
                });
            } else if (assetData.category === 'gallery') {
                await SupabaseAPI.createGallery({
                    gallery_id: assetData.asset_id,
                    title: assetData.name,
                    image_url: assetData.url || '',
                });
            } else {
                await SupabaseAPI.createAsset({
                    asset_id: assetData.asset_id,
                    name: assetData.name,
                    description: assetData.description || '',
                    type: assetData.type,
                    category: assetData.category,
                    url: assetData.url || '',
                });
            }

            showNotification?.(`Đã thêm asset "${assetData.name}"`, 'success');
            assetReloadRef.current?.();
        } catch (err) {
            console.error('Add asset error:', err);
            showNotification?.(`Lỗi thêm asset: ${err.message}`, 'error');
            throw err;
        }
    };

    return (
        <div className="redesign-sidebar-container">
            <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'story' ? (
                    <StoryTreePanel
                        onStorySelect={onStorySelect}
                        onAddItem={handleAddItem}
                        onEditItem={handleEditItem}
                        currentStoryId={currentStoryId}
                        showNotification={showNotification}
                    />
                ) : (
                    <AssetPanel
                        onAddAsset={handleOpenAddAsset}
                        showNotification={showNotification}
                        reloadRef={assetReloadRef}
                    />
                )}
            </div>

            <AddItemModal
                isOpen={modalOpen}
                type={modalType}
                initialData={initialData}
                initialDisplayOrder={modalOrder}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
                onPickAsset={onPickAsset}
            />

            <AddAssetModal
                isOpen={assetModalOpen}
                initialCategory={assetModalCategory}
                onClose={() => setAssetModalOpen(false)}
                onSubmit={handleAddAssetSubmit}
            />
        </div>
    );
}
