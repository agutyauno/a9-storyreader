import React, { useState, useEffect, useRef } from 'react';
import {
    UserPlus,
    Image as ImageIcon,
    Music,
    Video,
    MessageSquare,
    Volume2,
    GitMerge,
    CornerDownRight,
    HelpCircle,
    ChevronDown,
    BookOpen,
    Film,
    Headphones,
    MessageCircle
} from 'lucide-react';
import SyntaxHelpModal from './modals/SyntaxHelpModal';
import './editorComponents.css';

const TOOL_GROUPS = [
    {
        category: 'scene',
        label: 'SCENE',
        icon: Film,
        color: '#FF9E80',
        tools: [
            { id: 'bg', label: 'Bối cảnh (BG)', icon: ImageIcon, template: '@bg ""', hint: '@bg "asset_id"' },
            { id: 'video', label: 'Video (PV)', icon: Video, template: '@video src=""', hint: '@video src="asset_id"' },
        ]
    },
    {
        category: 'audio',
        label: 'AUDIO',
        icon: Headphones,
        color: '#FFE082',
        tools: [
            { id: 'bgm', label: 'Nhạc nền (BGM)', icon: Music, template: '@bgm id="" intro="" loop=""', hint: '@bgm id="bgm_id"' },
            { id: 'sfx', label: 'Âm thanh (SFX)', icon: Volume2, template: '@sfx "" src=""', hint: '@sfx "sfx_id"' },
        ]
    },
    {
        category: 'content',
        label: 'CONTENT',
        icon: MessageCircle,
        color: '#A5D6A7',
        tools: [
            { id: 'dialogue', label: 'Lời thoại', icon: MessageSquare, template: 'Name [, ]: ', hint: 'Tên [biểu_cảm]: Lời thoại' },
            { id: 'char', label: 'Nhân vật', icon: UserPlus, template: '@char Name id=""', hint: '@char Name id=""' },
            { id: 'narrator', label: 'Dẫn truyện', icon: MessageSquare, template: '@narrator {\n  \n}', hint: '@narrator { ... }' },
            { id: 'note_def', label: 'Ghi chú', icon: HelpCircle, template: '@note id: nội dung ghi chú', hint: '@note id: nội dung' },
            { id: 'note_link', label: 'Liên kết từ', icon: HelpCircle, template: '[từ | id]', isInline: true, hint: '[từ_hiển_thị | note_id]' },
            { id: 'decision', label: 'Lựa chọn', icon: GitMerge, template: '@decision "" [, ]\n- Choice 1\n- Choice 2', hint: '@decision "câu_hỏi"' },
            { id: 'response', label: 'Phản hồi', icon: CornerDownRight, template: '@response "" 1 {\n  \n}', hint: '@response "lựa_chọn" 1' },
        ]
    }
];

export default function EditorToolbar({ onInsert }) {
    const [openGroup, setOpenGroup] = useState(null);
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const toolbarRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
                setOpenGroup(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectTool = (tool) => {
        onInsert(tool.template, tool.isInline);
        setOpenGroup(null);
    };

    const toggleDropdown = (category) => {
        setOpenGroup(prev => prev === category ? null : category);
    };

    return (
        <>
            <div className="redesign-toolbar-container" ref={toolbarRef}>
                <div className="redesign-toolbar-inner">
                    {/* Category Dropdown Menus */}
                    <div className="toolbar-dropdowns-group">
                        {TOOL_GROUPS.map(group => {
                            const isOpen = openGroup === group.category;
                            return (
                                <div key={group.category} className="toolbar-dropdown-anchor">
                                    <button
                                        type="button"
                                        onClick={() => toggleDropdown(group.category)}
                                        className={`toolbar-dropdown-btn group-${group.category} ${isOpen ? 'active' : ''}`}
                                    >
                                        <group.icon size={13} style={{ color: group.color }} />
                                        <span>{group.label}</span>
                                        <ChevronDown size={12} className={`dropdown-caret ${isOpen ? 'open' : ''}`} />
                                    </button>

                                    {isOpen && (
                                        <div className="toolbar-floating-popover">
                                            <div className="popover-header" style={{ borderBottomColor: group.color }}>
                                                <span style={{ color: group.color }}>LỆNH {group.label}</span>
                                            </div>
                                            <div className="popover-list">
                                                {group.tools.map(tool => (
                                                    <button
                                                        key={tool.id}
                                                        type="button"
                                                        onClick={() => handleSelectTool(tool)}
                                                        className="popover-item"
                                                        title={`Cú pháp: ${tool.hint}`}
                                                    >
                                                        <tool.icon size={13} className="popover-item-icon" style={{ color: group.color }} />
                                                        <span className="popover-item-text">{tool.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Auxiliary Action: Syntax Cheatsheet Guide */}
                    <div className="toolbar-auxiliary-group">
                        <button
                            type="button"
                            className="toolbar-action-btn"
                            onClick={() => setHelpModalOpen(true)}
                            title="Mở hướng dẫn chi tiết cú pháp Story Script"
                        >
                            <BookOpen size={13} />
                            <span>Cú pháp</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Syntax Help Cheatsheet Modal */}
            <SyntaxHelpModal 
                isOpen={helpModalOpen} 
                onClose={() => setHelpModalOpen(false)} 
            />
        </>
    );
}
