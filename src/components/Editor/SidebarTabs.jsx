import React from 'react';
import styles from './SidebarTabs.module.css';

/**
 * Tab switcher for the Editor Sidebar.
 * Renders "Story" and "Asset" tabs at the top of the sidebar.
 */
export default function SidebarTabs({ activeTab, onTabChange }) {
    return (
        <div className={styles.tabBar}>
            <button
                className={`${styles.tab} ${activeTab === 'story' ? styles.active : ''}`}
                onClick={() => onTabChange('story')}
            >
                Story
            </button>
            <button
                className={`${styles.tab} ${activeTab === 'asset' ? styles.active : ''}`}
                onClick={() => onTabChange('asset')}
            >
                Asset
            </button>
        </div>
    );
}
