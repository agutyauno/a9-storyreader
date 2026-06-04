import React, { useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import PageHero from '../../components/PageHero'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import Modal from '../../components/Modal'
import { NotificationProvider, useNotification } from '../../components/Notification'
import Tabs from '../../components/Tabs'
import Panel from '../../components/Panel'
import Input from '../../components/Input'
import { Plus, Settings, AlertTriangle, Play, HelpCircle } from 'lucide-react'
import './test.css'

export default function TestPage() {
    const [modalOpen, setModalOpen] = useState(false)
    const { addNotification } = useNotification()
    const [activeTab, setActiveTab] = useState('overview')
    const [inputValue, setInputValue] = useState('')
    const BASE_URL = import.meta.env.BASE_URL || '/'

    const handleButtonClick = (name) => {
        alert(`Bạn đã click nút: ${name}`)
    }

    return (
        <div className="app-wrapper">
            {/* Header without sidebar controller */}
            <Header BASE_URL={BASE_URL} />

            {/* Main container */}
            <main className="main-layout test-page-layout">
                <div className="redesign-container test-container">
                    {/* Page Hero */}
                    <PageHero
                        title="HỆ THỐNG COMPONENT CATALOG"
                        subtitle="SYS.TEST_SUITE_V2.0"
                        code="SEC.TEST_PAGE // RUNTIME: OK"
                        description="Trang dùng để hiển thị và kiểm tra hoạt động trực quan của tất cả các component thuộc dự án Civilight Eterna Database Redesign."
                    />

                    {/* Section: Buttons */}
                    <section className="test-section">
                        <h3 className="section-title technical-text">[01] BUTTON_VARIANTS</h3>
                        <div className="component-grid">
                            <div className="component-box">
                                <span className="component-label technical-text">Primary Variant</span>
                                <Button variant="primary" onClick={() => handleButtonClick('Primary')}>
                                    PRIMARY_ACTION
                                </Button>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Secondary Variant</span>
                                <Button variant="secondary" onClick={() => handleButtonClick('Secondary')}>
                                    SECONDARY
                                </Button>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Outline Variant</span>
                                <Button variant="outline" onClick={() => handleButtonClick('Outline')}>
                                    OUTLINE_TEXT
                                </Button>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Danger Variant</span>
                                <Button variant="danger" onClick={() => handleButtonClick('Danger')}>
                                    DANGER_ACTION
                                </Button>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">With Icon</span>
                                <Button
                                    variant="primary"
                                    icon={<Plus size={16} />}
                                    onClick={() => handleButtonClick('With Icon')}
                                >
                                    CREATE_NEW
                                </Button>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Disabled State</span>
                                <Button variant="primary" disabled icon={<Settings size={16} />}>
                                    DISABLED_ACTION
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Section: Loading */}
                    <section className="test-section">
                        <h3 className="section-title technical-text">[02] LOADING_STATES</h3>
                        <div className="component-grid">
                            <div className="component-box span-2">
                                <span className="component-label technical-text">Standard Loading</span>
                                <div className="loading-preview-box">
                                    <Loading text="RESOLVING_DATA_STREAM..." />
                                </div>
                            </div>

                            <div className="component-box span-2">
                                <span className="component-label technical-text">Text-Only (showBar=false)</span>
                                <div className="loading-preview-box">
                                    <Loading text="AWAITING_USER_SELECTION..." showBar={false} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Modal & Interactive */}
                    <section className="test-section">
                        <h3 className="section-title technical-text">[03] MODALS_&_INTERACTIVE</h3>
                        <div className="component-grid">
                            <div className="component-box">
                                <span className="component-label technical-text">Interactive Modal Trigger</span>
                                <Button variant="primary" icon={<Play size={16} />} onClick={() => setModalOpen(true)}>
                                    OPEN_MODAL_DEMO
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Section: Notifications */}
                    <section className="test-section">
                        <h3 className="section-title technical-text">[04] TOAST_NOTIFICATIONS</h3>
                        <div className="component-grid">
                            <div className="component-box">
                                <span className="component-label technical-text">Success Notification</span>
                                <Button variant="primary" onClick={() => addNotification('Dữ liệu đã được lưu thành công vào cơ sở dữ liệu!', 'success', 'SYS.SAVE_SUCCESS')}>
                                    TRIGGER_SUCCESS
                                </Button>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Info Notification</span>
                                <Button variant="secondary" onClick={() => addNotification('Phiên bản cơ sở dữ liệu hiện tại là v2.0.', 'info', 'SYS.INFO_MESSAGE')}>
                                    TRIGGER_INFO
                                </Button>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Warning Notification</span>
                                <Button variant="outline" onClick={() => addNotification('Cảnh báo: Phát hiện thiết bị lạ cố gắng truy cập cơ sở dữ liệu.', 'warning', 'SYS.SECURITY_WARN')}>
                                    TRIGGER_WARNING
                                </Button>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Danger Notification</span>
                                <Button variant="danger" onClick={() => addNotification('Lỗi kết nối cơ sở dữ liệu Supabase. Hãy kiểm tra kết nối mạng của bạn.', 'danger', 'SYS.CONNECT_ERROR')}>
                                    TRIGGER_DANGER
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Section: Tabs */}
                    <section className="test-section">
                        <h3 className="section-title technical-text">[05] TABS_NAVIGATION</h3>
                        <div className="component-box span-2">
                            <span className="component-label technical-text">Tabs Controller & View Switch</span>
                            <Tabs
                                tabs={[
                                    { id: 'overview', label: 'OVERVIEW // HỒ SƠ' },
                                    { id: 'skills', label: 'SKILLS // KỸ NĂNG' },
                                    { id: 'lore', label: 'LORE // TIỂU SỬ' }
                                ]}
                                activeTabId={activeTab}
                                onChange={setActiveTab}
                            />
                            <div className="tab-content-preview" style={{ padding: '1rem', border: '1px dashed rgba(245,237,220,0.15)', marginTop: '0.5rem' }}>
                                {activeTab === 'overview' && <p>NỘI DUNG TỔNG QUAN: Bố cục hiển thị các chỉ số cơ bản của Operator, faction Rhodes Island, độ hiếm 6 sao.</p>}
                                {activeTab === 'skills' && <p>DANH SÁCH KỸ NĂNG: Chi tiết các kỹ năng chiến đấu gồm kỹ năng 1, kỹ năng 2 và kỹ năng 3 của Operator.</p>}
                                {activeTab === 'lore' && <p>TIỂU SỬ: Tóm tắt thông tin lý lịch cá nhân và quá trình tham gia chiến đấu tại Babel/Rhodes Island.</p>}
                            </div>
                        </div>
                    </section>

                    {/* Section: Panels */}
                    <section className="test-section">
                        <h3 className="section-title technical-text">[06] PANEL_COMPONENTS</h3>
                        <div className="component-grid">
                            <div className="component-box">
                                <span className="component-label technical-text">Standard Panel</span>
                                <Panel title="DATABASE_NODE" subtitle="[SEC.NORMAL]">
                                    <p>Khung chứa dữ liệu thông thường với viền mỏng và tiêu đề Monospace in hoa.</p>
                                </Panel>
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Panel with stripes & actions</span>
                                <Panel 
                                    title="SYSTEM_MONITOR" 
                                    subtitle="[SEC.SECURE]" 
                                    stripes 
                                    actions={<Button variant="outline" onClick={() => alert('Action!')}>RELOAD</Button>}
                                >
                                    <p>Khung chứa dữ liệu đặc biệt có họa tiết sọc chéo ở tiêu đề và nút điều khiển hành động góc phải.</p>
                                </Panel>
                            </div>
                        </div>
                    </section>

                    {/* Section: Inputs */}
                    <section className="test-section">
                        <h3 className="section-title technical-text">[07] INPUT_FIELDS</h3>
                        <div className="component-grid">
                            <div className="component-box">
                                <span className="component-label technical-text">Standard Input</span>
                                <Input 
                                    label="Search Operator" 
                                    code="[SEARCH.STR]" 
                                    placeholder="Nhập tên Operator..." 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                {inputValue && <p style={{ fontSize: '0.85rem' }}>Đang tìm kiếm: <strong>{inputValue}</strong></p>}
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Input with Error</span>
                                <Input 
                                    label="Database Password" 
                                    code="[AUTH.PWD]" 
                                    type="password"
                                    placeholder="Nhập mật khẩu..." 
                                    error="Mật khẩu nhập vào không chính xác. Vui lòng kiểm tra lại."
                                />
                            </div>

                            <div className="component-box">
                                <span className="component-label technical-text">Disabled Input</span>
                                <Input 
                                    label="System Core ID" 
                                    code="[VAL.READ_ONLY]" 
                                    disabled 
                                    value="NODE_ID_F9CC8C8380AFB1F90E9"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Modal Demo Component */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="SYS.CONFIRMATION_DIALOG // SEC.TEST"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>
                            CANCEL
                        </Button>
                        <Button variant="danger" onClick={() => {
                            alert('Hành động nguy hiểm được xác nhận!')
                            setModalOpen(false)
                        }}>
                            CONFIRM_DESTRUCTION
                        </Button>
                    </>
                }
            >
                <div className="modal-demo-content">
                    <div className="warning-icon-wrapper">
                        <AlertTriangle size={32} color="#aa3d27" />
                    </div>
                    <div className="modal-text-content">
                        <h4 className="technical-text" style={{ color: '#aa3d27', marginBottom: '0.5rem' }}>
                            CẢNH BÁO: XÁC NHẬN HÀNH ĐỘNG
                        </h4>
                        <p>
                            Bạn đang kích hoạt bảng điều khiển kiểm thử. Việc xác nhận hành động này sẽ giả lập việc xóa hoặc thay đổi dữ liệu cấu trúc hệ thống. Hãy chắc chắn trước khi nhấn Confirm.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Footer */}
            <Footer />
        </div>
    )
}
