import React from 'react';
import { X, BookOpen, ImageIcon, Music, User, HelpCircle, GitMerge, FileText } from 'lucide-react';
import '../editorComponents.css';

const SYNTAX_GUIDES = [
    {
        category: 'SCENE (Bối cảnh & Phân đoạn)',
        icon: ImageIcon,
        color: '#FF9E80',
        items: [
            {
                tag: '@bg "bg_asset_id"',
                description: 'Đổi hình nền bối cảnh (nhận Asset ID hoặc URL ảnh).',
                example: '@bg "bg_ruin_city_01"'
            },
            {
                tag: '@video src="video_id_hoặc_url"',
                description: 'Phát video PV/Cutscene (hỗ trợ Asset ID, YouTube, Google Drive, MP4/WebM).',
                example: '@video src="video_pv_01"'
            },
            {
                tag: '@section',
                description: 'Bắt đầu một phân đoạn/chương kịch bản mới trong câu chuyện.',
                example: '@section'
            }
        ]
    },
    {
        category: 'AUDIO (Nhạc nền & Hiệu ứng âm thanh)',
        icon: Music,
        color: '#FFE082',
        items: [
            {
                tag: '@bgm id="bgm_id" intro="intro_id" loop="loop_id"',
                description: 'Phát nhạc nền BGM (id: bài nhạc chính, intro: đoạn dạo đầu phát 1 lần, loop: đoạn lặp lại).',
                example: '@bgm id="m_avg_theme" intro="m_avg_theme_intro" loop="m_avg_theme_loop"'
            },
            {
                tag: '@sfx "Tên_Hiệu_Ứng" src="sfx_asset_id"',
                description: 'Kích hoạt âm thanh tiếng động kèm nhãn tên hiển thị trên giao diện.',
                example: '@sfx "Tiếng sấm" src="e_avg_thunder"'
            }
        ]
    },
    {
        category: 'CONTENT (Nhân vật, Lời thoại & Tương tác)',
        icon: User,
        color: '#A5D6A7',
        items: [
            {
                tag: '@char Tên [id="...", avatar="...", full="...", color="#..."]',
                description: 'Khai báo nhân vật với ID database, ảnh avatar, ảnh đứng full-body, và màu chữ tên hiển thị.',
                example: '@char Amiya [id="char_002_amiya", avatar="char_002_amiya_1", full="char_002_amiya_1_full", color="#00E5FF"]'
            },
            {
                tag: 'Tên_Nhân_Vật [Trái.biểu_cảm, Phải.biểu_cảm, color="#..."]: Lời thoại',
                description: 'Tạo lời thoại kèm avatar trái, avatar phải, biểu cảm tùy chọn (e.g. .smile, .angry) và đổi màu tên riêng.',
                example: 'Amiya [Amiya.smile, Kaltsit.serious, color="#00E5FF"]: Doctor, chúng ta đã đến nơi rồi!'
            },
            {
                tag: '@narrator {\n  Nội dung...\n}',
                description: 'Khối lời dẫn truyện hoặc văn bản mô tả bối cảnh (hỗ trợ chú thích [từ | note_id]).',
                example: '@narrator {\n  Màn đêm buông xuống thành phố Chernobog...\n  Năng lượng [Originium | originium] tỏa sáng trong đống đổ nát.\n}'
            },
            {
                tag: '@decision "group_id" [Avatar_Trái, Avatar_Phải]\n- Lựa chọn 1\n- Lựa chọn 2',
                description: 'Tạo hộp lựa chọn phân nhánh với nhóm ID, ảnh nhân vật hai bên và các phương án (hỗ trợ chú thích [từ | note_id], [note: nội dung], và comment #).',
                example: '@decision "route_01" [Doctor, Amiya.smile]\n- Tiến vào [Rhode Island | note_ri]\n- Quan sát thêm từ xa [note: Lựa chọn an toàn hơn]'
            },
            {
                tag: '@response "group_id" 1 {\n  ...\n}',
                description: 'Khối kịch bản diễn biến tương ứng khi người chơi chọn một phương án (1, 2, ...).',
                example: '@response "route_01" 1 {\n  Amiya [Amiya.serious, ]: Bên trong này có vẻ an toàn.\n}'
            },
            {
                tag: '@note note_id: Nội dung giải thích',
                description: 'Định nghĩa mục thuật ngữ/ghi chú tra cứu trong từ điển cốt truyện.',
                example: '@note originium: Quặng khoáng sản chứa năng lượng kỳ lạ và nguy hiểm'
            },
            {
                tag: '[Từ cần chú thích | note_id]',
                description: 'Gắn liên kết giải thích thuật ngữ vào một từ ngữ bất kỳ trong lời thoại, dẫn truyện hoặc lựa chọn decision (cũng hỗ trợ [note: nội dung trực tiếp]).',
                example: 'Năng lượng [Originium | originium] rất nguy hiểm đối với con người.'
            },
            {
                tag: '# Ghi chú kịch bản / Comment',
                description: 'Dòng ghi chú nội bộ của người biên soạn, không hiển thị trong kịch bản khi đọc.',
                example: '# TODO: Bổ sung thêm câu thoại của Kaltsit ở đoạn sau'
            }
        ]
    }
];

export default function SyntaxHelpModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="redesign-modal-overlay" onClick={onClose}>
            <div className="redesign-modal-card large" onClick={(e) => e.stopPropagation()}>
                <div className="redesign-modal-header">
                    <div className="redesign-modal-title">
                        <BookOpen size={18} />
                        <span>HƯỚNG DẪN CÚ PHÁP STORY SCRIPT</span>
                    </div>
                    <button className="redesign-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="redesign-modal-body" style={{ gap: '1.25rem' }}>
                    <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'rgba(178,101,59,0.12)', border: '1px solid rgba(178,101,59,0.3)', color: '#F5EDDC', fontSize: '0.8rem', borderRadius: '4px', fontFamily: 'var(--font-swiss)' }}>
                        👉 <strong>Mẹo:</strong> Sử dụng các <strong>Menu Thả Xổ (SCENE, AUDIO, CONTENT)</strong> trên thanh Toolbar để chèn nhanh các mẫu cú pháp vào dòng hiện tại của trình soạn thảo.
                    </div>

                    {SYNTAX_GUIDES.map(section => (
                        <div key={section.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid rgba(245,237,220,0.15)', paddingBottom: '0.4rem' }}>
                                <section.icon size={15} style={{ color: section.color }} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: section.color, letterSpacing: '0.5px' }}>
                                    {section.category}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                {section.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            backgroundColor: '#121212',
                                            border: '1px solid rgba(245,237,220,0.12)',
                                            padding: '0.85rem 1rem',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.55rem'
                                        }}
                                    >
                                        {/* 1. Câu lệnh ở trên cùng */}
                                        <div style={{ display: 'flex' }}>
                                            <div style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.84rem',
                                                fontWeight: 700,
                                                color: '#F5EDDC',
                                                backgroundColor: '#1A1A1A',
                                                padding: '0.35rem 0.65rem',
                                                borderRadius: '3px',
                                                border: '1px solid rgba(245,237,220,0.2)',
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.5,
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}>
                                                {item.tag}
                                            </div>
                                        </div>

                                        {/* 2. Mô tả câu lệnh ở giữa */}
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'rgba(245,237,220,0.85)',
                                            fontFamily: 'var(--font-swiss)',
                                            lineHeight: 1.55,
                                            padding: '0 0.15rem'
                                        }}>
                                            {item.description}
                                        </div>

                                        {/* 3. Ví dụ câu lệnh ở cuối cùng */}
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.76rem',
                                            color: 'rgba(245,237,220,0.65)',
                                            backgroundColor: '#0A0A0A',
                                            padding: '0.45rem 0.75rem',
                                            borderRadius: '3px',
                                            border: '1px solid rgba(245,237,220,0.08)',
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.5
                                        }}>
                                            <span style={{ color: 'var(--color-terracotta)', fontWeight: 600, marginRight: '0.35rem' }}>Ví dụ:</span>
                                            {item.example}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
