import React from 'react';
import { X, BookOpen, ImageIcon, Music, User, HelpCircle, GitMerge, FileText } from 'lucide-react';
import '../editorComponents.css';

const SYNTAX_GUIDES = [
    {
        category: 'SCENE (Bối cảnh & Media)',
        icon: ImageIcon,
        color: '#FF9E80',
        items: [
            {
                tag: '@bg "asset_id"',
                description: 'Thay đổi hình nền bối cảnh câu chuyện.',
                example: '@bg "bg_ruin_city_01"'
            },
            {
                tag: '@video src="asset_id"',
                description: 'Phát video PV hoặc hiệu ứng hình ảnh động.',
                example: '@video src="video_pv_01"'
            }
        ]
    },
    {
        category: 'AUDIO (Nhạc nền & Âm thanh)',
        icon: Music,
        color: '#FFE082',
        items: [
            {
                tag: '@bgm id="bgm_id" [intro=""] [loop=""]',
                description: 'Phát bản nhạc nền BGM cho phân cảnh.',
                example: '@bgm id="m_avg_theme" intro="" loop=""'
            },
            {
                tag: '@sfx "sfx_id"',
                description: 'Kích hoạt hiệu ứng âm thanh tiếng động.',
                example: '@sfx "e_avg_thunder"'
            }
        ]
    },
    {
        category: 'CONTENT (Nhân vật & Lời thoại)',
        icon: User,
        color: '#A5D6A7',
        items: [
            {
                tag: 'Tên_Nhân_Vật [biểu_cảm]: Lời thoại',
                description: 'Tạo lời thoại nhân vật kèm biểu cảm avatar.',
                example: 'Amiya [angry]: Doctor, xin hãy cẩn thận!'
            },
            {
                tag: '@char Tên id="char_id"',
                description: 'Xuất hiện nhân vật trên phân cảnh.',
                example: '@char Amiya id="char_002_amiya"'
            },
            {
                tag: '@narrator {\n  Nội dung...\n}',
                description: 'Lời dẫn truyện, văn bản mô tả bối cảnh.',
                example: '@narrator {\n  Màn đêm buông xuống thành phố Chernobog...\n}'
            },
            {
                tag: '@note id: Nội dung ghi chú',
                description: 'Định nghĩa thuật ngữ/ghi chú tra cứu.',
                example: '@note originium: Quặng khoáng sản chứa năng lượng kỳ lạ'
            },
            {
                tag: '[Từ hiển thị | note_id]',
                description: 'Gắn liên kết tra cứu từ điển vào lời thoại.',
                example: 'Năng lượng [Originium | originium] rất nguy hiểm.'
            },
            {
                tag: '@decision "Câu hỏi" [, ]\n- Lựa chọn A\n- Lựa chọn B',
                description: 'Tạo cây lựa chọn phân nhánh cho người đọc.',
                example: '@decision "Bạn chọn đi đâu?" [, ]\n- Đi theo Amiya\n- Ở lại căn cứ'
            },
            {
                tag: '@response "Lựa chọn A" 1 {\n ... \n}',
                description: 'Nhánh kịch bản tương ứng với lựa chọn.',
                example: '@response "Đi theo Amiya" 1 {\n  Amiya: Cảm ơn Doctor đã đồng hành!\n}'
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {section.items.map((item, idx) => (
                                    <div key={idx} style={{ backgroundColor: '#121212', border: '1px solid rgba(245,237,220,0.12)', padding: '0.65rem 0.85rem', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#F5EDDC', backgroundColor: '#1A1A1A', padding: '0.2rem 0.45rem', borderRadius: '3px', border: '1px solid rgba(245,237,220,0.2)' }}>
                                                {item.tag}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: 'rgba(245,237,220,0.65)', fontFamily: 'var(--font-swiss)' }}>
                                                {item.description}
                                            </span>
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(245,237,220,0.5)', backgroundColor: '#0A0A0A', padding: '0.35rem 0.6rem', borderRadius: '3px' }}>
                                            <span style={{ color: 'var(--color-terracotta)', opacity: 0.8 }}>Ví dụ:</span> {item.example}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="redesign-modal-footer">
                    <button className="redesign-btn primary" onClick={onClose}>Đóng Hướng Dẫn</button>
                </div>
            </div>
        </div>
    );
}
