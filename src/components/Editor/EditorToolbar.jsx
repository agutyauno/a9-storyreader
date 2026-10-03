import React from 'react';
import {
    UserPlus,
    LayoutList,
    Image as ImageIcon,
    Music,
    Video,
    MessageSquare,
    Volume2,
    GitMerge,
    CornerDownRight,
    HelpCircle
} from 'lucide-react';
import styles from '../../pages/EditorPage.module.css';

const TOOL_GROUPS = [
    {
        label: 'Scene',
        tools: [
            { id: 'bg', label: 'BG', icon: ImageIcon, template: '@bg ""' },
            { id: 'video', label: 'Video', icon: Video, template: '@video src=""' },
        ]
    },
    {
        label: 'Audio',
        tools: [
            { id: 'bgm', label: 'BGM', icon: Music, template: '@bgm id="" intro="" loop=""' },
            { id: 'sfx', label: 'SFX', icon: Volume2, template: '@sfx "" src=""' },
            { id: 'sfx_parallel', label: 'SFX Song song', icon: Volume2, template: '@sfx "" src="" parallel="true"' },
            { id: 'sfx_loop', label: 'SFX Loop', icon: Volume2, template: '@sfx "" src="" loop="true"' },
            { id: 'sfx_stop', label: 'SFX Stop', icon: Volume2, template: '@sfx stop=""' },
        ]
    },
    {
        label: 'Content',
        tools: [
            { id: 'char', label: 'Char', icon: UserPlus, template: '@char Tên_Nhân_Vật [id=""]' },
            { id: 'narrator', label: 'Narrator', icon: MessageSquare, template: '@narrator {\n  \n}' },
            { id: 'narrator_inline', label: 'Narrator 1L', icon: MessageSquare, template: '@narrator: ' },
            { id: 'dialogue', label: 'Dialogue', icon: MessageSquare, template: 'Name [, ]: ' },
            { id: 'note_def', label: 'Note', icon: HelpCircle, template: '@note id: nội dung ghi chú' },
            { id: 'note_link', label: 'Link Note', icon: HelpCircle, template: '[từ | id]', isInline: true },
            { id: 'note_direct', label: 'Inline Note', icon: HelpCircle, template: '[note: giải thích trực tiếp]', isInline: true },
            { id: 'decision', label: 'Decision', icon: GitMerge, template: '@decision "" [, ]\n- Choice 1\n- Choice 2' },
            { id: 'response', label: 'Response', icon: CornerDownRight, template: '@response "" 1 {\n  \n}' },
        ]
    }
];

export default function EditorToolbar({ onInsert }) {
    return (
        <div className={styles.toolbar}>
            {TOOL_GROUPS.map((group, gi) => (
                <React.Fragment key={group.label}>
                    <div className={styles.toolbarGroup}>
                        {group.tools.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => onInsert(tool.template, tool.isInline)}
                                className={styles.toolBtn}
                                title={`Insert ${tool.label}`}
                            >
                                <tool.icon size={14} />
                                <span>{tool.label}</span>
                            </button>
                        ))}
                    </div>
                    {gi < TOOL_GROUPS.length - 1 && (
                        <div className={styles.toolbarDivider} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
