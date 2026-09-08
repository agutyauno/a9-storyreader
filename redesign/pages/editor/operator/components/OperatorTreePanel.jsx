import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Plus, Trash2, User, Search, RefreshCw, FileText, Star, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SupabaseAPI } from '../../../../../src/services/supabaseApi'

export default function OperatorTreePanel({
    currentRecordId,
    onSelectRecord,
    onNewRecord,
    onDeleteRecord,
    reloadTrigger = 0
}) {
    const navigate = useNavigate()
    const [treeData, setTreeData] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedOps, setExpandedOps] = useState({})

    const fetchTree = async () => {
        setLoading(true)
        try {
            const data = await SupabaseAPI.getOperatorStoryTree()
            setTreeData(data || [])
            // If currentRecordId is set, make sure that operator is expanded
            if (currentRecordId && data) {
                const parentOp = data.find(op => op.records?.some(r => r.record_id === currentRecordId))
                if (parentOp) {
                    setExpandedOps(prev => ({ ...prev, [parentOp.operator_id]: true }))
                }
            }
        } catch (err) {
            console.error('Failed to load operator story tree:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTree()
    }, [reloadTrigger])

    // Filter tree
    const filteredTree = treeData.filter(op => {
        const q = searchQuery.toLowerCase().trim()
        if (!q) return true
        const matchOp = op.name.toLowerCase().includes(q) || (op.appellation || '').toLowerCase().includes(q)
        const matchRec = op.records?.some(r => r.name?.toLowerCase().includes(q) || r.record_id?.toLowerCase().includes(q))
        return matchOp || matchRec
    })

    const toggleExpand = (opId) => {
        setExpandedOps(prev => ({ ...prev, [opId]: !prev[opId] }))
    }

    return (
        <div className="operator-tree-panel">
            {/* Header */}
            <div className="operator-tree-header">
                <div className="tree-header-top">
                    <span className="tree-header-title technical-text">KÍ SỰ CÁN VIÊN // TREE</span>
                    <button
                        className="tree-icon-btn"
                        onClick={fetchTree}
                        title="Tải lại danh sách"
                    >
                        <RefreshCw size={13} className={loading ? 'spin-animate' : ''} />
                    </button>
                </div>

                <div className="tree-search-wrap">
                    <Search size={13} className="tree-search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm cán viên / kí sự..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="tree-search-input"
                    />
                </div>
            </div>

            {/* Tree list */}
            <div className="operator-tree-body scrollbar-custom">
                {loading ? (
                    <div className="tree-empty-state technical-text">
                        ĐANG TẢI DỮ LIỆU...
                    </div>
                ) : filteredTree.length === 0 ? (
                    <div className="tree-empty-state technical-text">
                        {searchQuery ? 'KHÔNG CÓ KẾT QUẢ PHÙ HỢP' : 'CHƯA CÓ CÁN VIÊN NÀO // VUI LÒNG TẠO HỒ SƠ CÁN VIÊN TRƯỚC'}
                    </div>
                ) : (
                    filteredTree.map(op => {
                        const isExpanded = expandedOps[op.operator_id] ?? false
                        const recCount = op.records?.length || 0

                        return (
                            <div key={op.operator_id} className="operator-tree-item">
                                {/* Operator node row */}
                                <div
                                    className="tree-node operator-node"
                                    onClick={() => toggleExpand(op.operator_id)}
                                >
                                    <div className="tree-node-left">
                                        <span className="tree-expand-arrow">
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </span>

                                        <div className="tree-op-avatar-placeholder">
                                            <User size={12} />
                                        </div>

                                        <span className="tree-node-title" title={op.name}>
                                            {op.name}
                                        </span>

                                        <span className="tree-badge" title="Số lượng kí sự">
                                            {recCount}
                                        </span>
                                    </div>

                                    {/* Action buttons on operator */}
                                    <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="tree-btn-action"
                                            title="Thêm kí sự mới cho cán viên này"
                                            onClick={() => onNewRecord(op)}
                                        >
                                            <Plus size={13} />
                                        </button>
                                        <button
                                            className="tree-btn-action"
                                            title="Sửa hồ sơ cán viên"
                                            onClick={() => navigate(`/editor/operator/${op.operator_id}`)}
                                        >
                                            <User size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Records list for this operator */}
                                {isExpanded && (
                                    <div className="tree-sub-list">
                                        {recCount === 0 ? (
                                            <div className="tree-record-empty">
                                                <span>Chưa có kí sự.</span>
                                                <button
                                                    className="tree-link-btn"
                                                    onClick={() => onNewRecord(op)}
                                                >
                                                    + Tạo kí sự
                                                </button>
                                            </div>
                                        ) : (
                                            op.records.map((rec, idx) => {
                                                const isSelected = currentRecordId === rec.record_id
                                                return (
                                                    <div
                                                        key={rec.record_id}
                                                        className={`tree-node record-node ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => onSelectRecord(rec, op)}
                                                    >
                                                        <div className="tree-node-left">
                                                            <FileText size={13} className="tree-record-icon" />
                                                            <span className="tree-node-title" title={rec.name}>
                                                                {rec.name || `Kí sự ${idx + 1}`}
                                                            </span>
                                                        </div>

                                                        <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                className="tree-btn-action danger"
                                                                title="Xoá kí sự này"
                                                                onClick={() => onDeleteRecord(rec, op)}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
