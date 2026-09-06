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
    MessageCircle,
    Layers,
    FileText
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
            { 
                id: 'bg', 
                label: 'Bối cảnh (BG)', 
                icon: ImageIcon, 
                template: '@bg "bg_asset_id"', 
                hint: '@bg "bg_asset_id"' 
            },
            { 
                id: 'video', 
                label: 'Video (PV)', 
                icon: Video, 
                template: '@video src="video_id_hoặc_url"', 
                hint: '@video src="video_id_hoặc_url"' 
            },
            { 
                id: 'section', 
                label: 'Phân đoạn (Section)', 
                icon: Layers, 
                template: '@section', 
                hint: '@section - Bắt đầu phân đoạn mới' 
            },
        ]
    },
    {
        category: 'audio',
        label: 'AUDIO',
        icon: Headphones,
        color: '#FFE082',
        tools: [
            { 
                id: 'bgm', 
                label: 'Nhạc nền (BGM)', 
                icon: Music, 
                template: '@bgm id="bgm_id" intro="intro_audio_id" loop="loop_audio_id"', 
                hint: '@bgm id="bgm_id" intro="intro_id" loop="loop_id"' 
            },
            { 
                id: 'sfx', 
                label: 'Âm thanh (SFX)', 
                icon: Volume2, 
                template: '@sfx "Tên_Hiệu_Ứng" src="sfx_asset_id"', 
                hint: '@sfx "Tên_Hiệu_Ứng" src="sfx_id"' 
            },
        ]
    },
    {
        category: 'content',
        label: 'CONTENT',
        icon: MessageCircle,
        color: '#A5D6A7',
        tools: [
            { 
                id: 'char', 
                label: 'Khai báo nhân vật', 
                icon: UserPlus, 
                template: '@char Tên_Nhân_Vật [id="char_id", avatar="avatar_id", full="full_id", color="#00E5FF"]', 
                hint: '@char Tên [id="", avatar="", full="", color=""]' 
            },
            { 
                id: 'dialogue', 
                label: 'Lời thoại nhân vật', 
                icon: MessageSquare, 
                template: 'Tên_Nhân_Vật [Avatar_Trái.biểu_cảm, Avatar_Phải.biểu_cảm, color="#00E5FF"]: Lời thoại của nhân vật...', 
                hint: 'Tên [Trái.biểu_cảm, Phải.biểu_cảm, color="#hex"]: Lời thoại' 
            },
            { 
                id: 'narrator', 
                label: 'Dẫn truyện', 
                icon: MessageSquare, 
                template: '@narrator {\n  Nội dung lời dẫn truyện ở đây (hỗ trợ chú thích [từ | note_id])...\n}', 
                hint: '@narrator { nội dung }' 
            },
            { 
                id: 'decision', 
                label: 'Nhánh lựa chọn', 
                icon: GitMerge, 
                template: '@decision "decision_group_id" [Avatar_Trái, Avatar_Phải]\n- Lựa chọn 1\n- Lựa chọn 2', 
                hint: '@decision "group_id" [Trái, Phải]\n- Lựa chọn 1\n- Lựa chọn 2' 
            },
            { 
                id: 'response', 
                label: 'Phản hồi lựa chọn', 
                icon: CornerDownRight, 
                template: '@response "decision_group_id" 1 {\n  # Kịch bản diễn biến khi chọn Lựa chọn 1\n  Tên_Nhân_Vật [biểu_cảm, ]: Phản hồi tương ứng...\n}', 
                hint: '@response "group_id" 1 { ... }' 
            },
            { 
                id: 'note_def', 
                label: 'Định nghĩa ghi chú', 
                icon: HelpCircle, 
                template: '@note note_id: Giải thích chi tiết về thuật ngữ hoặc bối cảnh tra cứu', 
                hint: '@note note_id: nội dung giải thích' 
            },
            { 
                id: 'note_link', 
                label: 'Liên kết từ chú thích', 
                icon: HelpCircle, 
                template: '[Từ cần chú thích | note_id]', 
                isInline: true, 
                hint: '[Từ hiển thị | note_id]' 
            },
            { 
                id: 'comment', 
                label: 'Ghi chú kịch bản (#)', 
                icon: FileText, 
                template: '# Ghi chú kịch bản / TODO: ...', 
                hint: '# Ghi chú kịch bản' 
            },
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
