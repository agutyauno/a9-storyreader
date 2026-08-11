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
    HelpCircle
} from 'lucide-react';
import './editorComponents.css';

const TOOL_GROUPS = [
    {
        category: 'scene',
        label: 'SCENE',
        tools: [
            { id: 'bg', label: 'BG', icon: ImageIcon, template: '@bg ""' },
            { id: 'video', label: 'Video', icon: Video, template: '@video src=""' },
        ]
    },
    {
        category: 'audio',
        label: 'AUDIO',
        tools: [
            { id: 'bgm', label: 'BGM', icon: Music, template: '@bgm id="" intro="" loop=""' },
            { id: 'sfx', label: 'SFX', icon: Volume2, template: '@sfx "" src=""' },
        ]
    },
    {
        category: 'content',
        label: 'CONTENT',
        tools: [
            { id: 'char', label: 'Char', icon: UserPlus, template: '@char Name id=""' },
            { id: 'narrator', label: 'Narrator', icon: MessageSquare, template: '@narrator {\n  \n}' },
            { id: 'dialogue', label: 'Dialogue', icon: MessageSquare, template: 'Name [, ]: ' },
            { id: 'note_def', label: 'Note', icon: HelpCircle, template: '@note id: nội dung ghi chú' },
            { id: 'note_link', label: 'Link Note', icon: HelpCircle, template: '[từ | id]', isInline: true },
            { id: 'decision', label: 'Decision', icon: GitMerge, template: '@decision "" [, ]\n- Choice 1\n- Choice 2' },
            { id: 'response', label: 'Response', icon: CornerDownRight, template: '@response "" 1 {\n  \n}' },
        ]
    }
];

export default function EditorToolbar({ onInsert }) {
    return (
        <div className="redesign-editor-toolbar">
            {TOOL_GROUPS.map((group, gi) => (
                <React.Fragment key={group.category}>
                    <div className={`redesign-toolbar-group group-${group.category}`}>
                        <span className="redesign-toolbar-group-label">{group.label}</span>
                        {group.tools.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => onInsert(tool.template, tool.isInline)}
                                className={`redesign-tool-btn tool-${group.category}`}
                                title={`Chèn ${tool.label}`}
                            >
                                <tool.icon size={13} className="tool-icon" />
                                <span>{tool.label}</span>
                            </button>
                        ))}
                    </div>
                    {gi < TOOL_GROUPS.length - 1 && (
                        <div className="redesign-toolbar-divider" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
