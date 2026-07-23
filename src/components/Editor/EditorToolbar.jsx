import React from 'react';
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
    FileText,
    Bookmark
} from 'lucide-react';
import styles from '../../pages/EditorPage.module.css';

const TOOL_GROUPS = [
    {
        id: 'scene',
        label: 'SCENE',
        accent: 'ochre',
        tools: [
            { id: 'bg', label: 'BG', icon: ImageIcon, template: '@bg ""', hint: 'Chèn ảnh nền' },
            { id: 'video', label: 'Video', icon: Video, template: '@video src=""', hint: 'Chèn video nền/cutscene' },
        ]
    },
    {
        id: 'audio',
        label: 'AUDIO',
        accent: 'sage',
        tools: [
            { id: 'bgm', label: 'BGM', icon: Music, template: '@bgm id="" intro="" loop=""', hint: 'Chèn nhạc nền BGM' },
            { id: 'sfx', label: 'SFX', icon: Volume2, template: '@sfx "" src=""', hint: 'Chèn âm thanh SFX' },
        ]
    },
    {
        id: 'text',
        label: 'TEXT',
        accent: 'terracotta',
        tools: [
            { id: 'char', label: 'Char', icon: UserPlus, template: '@char Name id=""', hint: 'Khai báo nhân vật' },
            { id: 'narrator', label: 'Narrator', icon: FileText, template: '@narrator {\n  \n}', hint: 'Khối lời dẫn' },
            { id: 'dialogue', label: 'Dialogue', icon: MessageSquare, template: 'Name [, ]: ', hint: 'Lời thoại nhân vật' },
        ]
    },
    {
        id: 'notes',
        label: 'NOTES',
        accent: 'indigo',
        tools: [
            { id: 'note_def', label: 'Note', icon: Bookmark, template: '@note id: nội dung ghi chú', hint: 'Định nghĩa ghi chú' },
            { id: 'note_link', label: 'Link Note', icon: HelpCircle, template: '[từ | id]', isInline: true, hint: 'Gắn liên kết note' },
        ]
    },
    {
        id: 'flow',
        label: 'FLOW',
        accent: 'crimson',
        tools: [
            { id: 'decision', label: 'Decision', icon: GitMerge, template: '@decision "" [, ]\n- Choice 1\n- Choice 2', hint: 'Rẽ nhánh Lựa chọn' },
            { id: 'response', label: 'Response', icon: CornerDownRight, template: '@response "" 1 {\n  \n}', hint: 'Phản hồi Lựa chọn' },
        ]
    }
];

export default function EditorToolbar({ onInsert }) {
    const handleWheel = (e) => {
        const container = e.currentTarget;
        if (container && container.scrollWidth > container.clientWidth && e.deltaY !== 0) {
            e.preventDefault();
            container.scrollLeft += e.deltaY * 1.2;
        }
    };

    return (
        <div 
            className={`editor-toolbar-container ${styles.toolbar}`}
            onWheel={handleWheel}
        >
            {TOOL_GROUPS.map((group) => (
                <div 
                    key={group.id} 
                    className={`toolbar-group-box ${styles.toolbarGroup}`}
                    data-accent={group.accent}
                >
                    <span className="toolbar-group-label">{group.label}</span>
                    <div className="toolbar-group-tools">
                        {group.tools.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => onInsert(tool.template, tool.isInline)}
                                className={`toolbar-btn ${styles.toolBtn}`}
                                title={tool.hint || `Insert ${tool.label}`}
                            >
                                <tool.icon size={13} className="tool-icon" />
                                <span>{tool.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
