import React from 'react';
import '../editorComponents.css';

export default function SidebarTabs({ activeTab, onTabChange }) {
    return (
        <div className="redesign-sidebar-tabs">
            <button 
                className={`redesign-sidebar-tab ${activeTab === 'story' ? 'active' : ''}`}
                onClick={() => onTabChange('story')}
            >
                STORY TREE
            </button>
            <button 
                className={`redesign-sidebar-tab ${activeTab === 'assets' ? 'active' : ''}`}
                onClick={() => onTabChange('assets')}
            >
                ASSETS HUB
            </button>
        </div>
    );
}
