// ═══════════════════════════════════════════════════════════════════════════════
// Operator Mappings — Arknights Operator Database
// Complete Classes, Subclasses (Branches), and Factions with Icons and Meta
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Classes ────────────────────────────────────────────────────────────────
export const CLASSES = [
  { id: 'vanguard', name: 'Tiên Phong', icon: '/assets/images/icon/class/Vanguard.png' },
  { id: 'guard', name: 'Cận Vệ', icon: '/assets/images/icon/class/Guard.png' },
  { id: 'defender', name: 'Phòng Ngự', icon: '/assets/images/icon/class/Defender.png' },
  { id: 'sniper', name: 'Xạ Thủ', icon: '/assets/images/icon/class/Sniper.png' },
  { id: 'caster', name: 'Thuật Sư', icon: '/assets/images/icon/class/Caster.png' },
  { id: 'medic', name: 'Y Tế', icon: '/assets/images/icon/class/Medic.png' },
  { id: 'supporter', name: 'Hỗ Trợ', icon: '/assets/images/icon/class/Supporter.png' },
  { id: 'specialist', name: 'Đặc Chủng', icon: '/assets/images/icon/class/Specialist.png' },
]

export const CLASSES_MAP = CLASSES.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

// ─── Subclasses (Branches) ──────────────────────────────────────────────────
export const SUBCLASSES = [
  // ─── Vanguard ─────────────────────────────────────────────────────────────
  {
    id: 'pioneer',
    name: 'Tiền Phương',
    classId: 'vanguard',
    description: 'Chặn 2 kẻ địch.',
    icon: '/assets/images/icon/class/Pioneer_Vanguard.png'
  },
  {
    id: 'charger',
    name: 'Xung Kích',
    classId: 'vanguard',
    description: 'Hồi 1 DP sau khi tiêu diệt một kẻ địch; Hoàn trả toàn bộ lượng DP gốc khi rút lui.',
    icon: '/assets/images/icon/class/Charger_Vanguard.png'
  },
  {
    id: 'standard_bearer',
    name: 'Chiến Kỳ',
    classId: 'vanguard',
    description: 'Không thể chặn kẻ địch trong thời gian kỹ năng kích hoạt.',
    icon: '/assets/images/icon/class/Standard_Bearer_Vanguard.png'
  },
  {
    id: 'tactician',
    name: 'Chiến Thuật Gia',
    classId: 'vanguard',
    description: 'Có thể chỉ định một Điểm Chiến Thuật trong tầm đánh để gọi Quân Tiếp Viện; Sát thương tăng lên 150% khi tấn công kẻ địch bị chặn bởi Quân Tiếp Viện.',
    icon: '/assets/images/icon/class/Tactician_Vanguard.png'
  },
  {
    id: 'agent',
    name: 'Tình Báo',
    classId: 'vanguard',
    description: 'Giảm thời gian Tái triển khai, có thể thực hiện tấn công tầm xa.',
    icon: '/assets/images/icon/class/Agent_Vanguard.png'
  },
  {
    id: 'strategist',
    name: 'Chiến Lược Gia',
    classId: 'vanguard',
    description: 'Chặn 2 kẻ địch, có thể hỗ trợ đồng minh trong Khu Vực Chờ Triển Khai.',
    icon: '/assets/images/icon/class/Strategist_Vanguard.png'
  },

  // ─── Guard ────────────────────────────────────────────────────────────────
  {
    id: 'dreadnought',
    name: 'Dũng Sĩ',
    classId: 'guard',
    description: 'Chặn 1 kẻ địch.',
    icon: '/assets/images/icon/class/Dreadnought_Guard.png'
  },
  {
    id: 'centurion',
    name: 'Cường Công',
    classId: 'guard',
    description: 'Tấn công tất cả kẻ địch đang bị chặn.',
    icon: '/assets/images/icon/class/Centurion_Guard.png'
  },
  {
    id: 'lord',
    name: 'Lãnh Chủ',
    classId: 'guard',
    description: 'Có thể phát động tấn công tầm xa gây 80% sát thương.',
    icon: '/assets/images/icon/class/Lord_Guard.png'
  },
  {
    id: 'arts_fighter',
    name: 'Thuật Chiến',
    classId: 'guard',
    description: 'Đòn đánh thường gây Sát thương Phép.',
    icon: '/assets/images/icon/class/Arts_Fighter_Guard.png'
  },
  {
    id: 'instructor',
    name: 'Huấn Luyện Viên',
    classId: 'guard',
    description: 'Có thể tấn công kẻ địch từ khoảng cách xa; Khi tấn công kẻ địch không bị chặn bởi bản thân, sức tấn công tăng lên 120%.',
    icon: '/assets/images/icon/class/Instructor_Guard.png'
  },
  {
    id: 'fighter',
    name: 'Đấu Sĩ',
    classId: 'guard',
    description: 'Chặn 1 kẻ địch.',
    icon: '/assets/images/icon/class/Fighter_Guard.png'
  },
  {
    id: 'swordmaster',
    name: 'Kiếm Hào',
    classId: 'guard',
    description: 'Đòn đánh thường gây sát thương 2 lần liên tiếp.',
    icon: '/assets/images/icon/class/Swordmaster_Guard.png'
  },
  {
    id: 'liberator',
    name: 'Giải Phóng',
    classId: 'guard',
    description: 'Bình thường không tấn công và chặn kẻ địch; Khi kỹ năng chưa kích hoạt, chỉ số tấn công tăng dần lên tới +200% sau 40 giây. Chỉ số tấn công sẽ thiết lập lại khi kỹ năng kết thúc.',
    icon: '/assets/images/icon/class/Liberator_Guard.png'
  },
  {
    id: 'reaper',
    name: 'Trảm Sát',
    classId: 'guard',
    description: 'Không thể nhận hồi phục từ đồng minh; Đòn đánh gây sát thương diện rộng; Hồi 50 HP cho mỗi kẻ địch trúng đòn, tối đa theo số lượng chặn.',
    icon: '/assets/images/icon/class/Reaper_Guard.png'
  },
  {
    id: 'soloblade',
    name: 'Võ Sĩ',
    classId: 'guard',
    description: 'Không thể nhận hồi phục từ các đơn vị khác. Hồi 70 HP cho bản thân mỗi khi tấn công kẻ địch.',
    icon: '/assets/images/icon/class/Soloblade_Guard.png'
  },
  {
    id: 'crusher',
    name: 'Trọng Kích',
    classId: 'guard',
    description: 'Tấn công tất cả kẻ địch đang bị chặn.',
    icon: '/assets/images/icon/class/Crusher_Guard.png'
  },
  {
    id: 'earthshaker',
    name: 'Địa Chấn',
    classId: 'guard',
    description: 'Đòn đánh gây 50% sức tấn công thành Sát thương Vật lý diện rộng lên kẻ địch xung quanh mục tiêu.',
    icon: '/assets/images/icon/class/Earthshaker_Guard.png'
  },
  {
    id: 'mercenary',
    name: 'Lính Đánh Thuê',
    classId: 'guard',
    description: 'Có thể tiêu hao điểm DP để gia tăng năng lực chiến đấu.',
    icon: '/assets/images/icon/class/Mercenary_Guard.png'
  },
  {
    id: 'primal_guard',
    name: 'Cận Vệ Nguyên Tố',
    classId: 'guard',
    description: 'Chặn 2 kẻ địch, có thể gây Sát thương Nguyên tố.',
    icon: '/assets/images/icon/class/Primal_Guard.png'
  },

  // ─── Defender ─────────────────────────────────────────────────────────────
  {
    id: 'protector',
    name: 'Thiết Vệ',
    classId: 'defender',
    description: 'Chặn 3 kẻ địch.',
    icon: '/assets/images/icon/class/Protector_Defender.png'
  },
  {
    id: 'guardian',
    name: 'Hộ Vệ',
    classId: 'defender',
    description: 'Có thể hồi máu cho đồng minh bằng cách kích hoạt kỹ năng.',
    icon: '/assets/images/icon/class/Guardian_Defender.png'
  },
  {
    id: 'juggernaut',
    name: 'Cường Vệ',
    classId: 'defender',
    description: 'Không thể nhận hồi phục từ đồng minh.',
    icon: '/assets/images/icon/class/Juggernaut_Defender.png'
  },
  {
    id: 'arts_protector',
    name: 'Thuật Vệ',
    classId: 'defender',
    description: 'Đòn đánh thường gây Sát thương Phép khi kỹ năng kích hoạt.',
    icon: '/assets/images/icon/class/Arts_Protector_Defender.png'
  },
  {
    id: 'duelist',
    name: 'Chiến Vệ',
    classId: 'defender',
    description: 'Chỉ hồi phục điểm kỹ năng khi trực tiếp chặn kẻ địch.',
    icon: '/assets/images/icon/class/Duelist_Defender.png'
  },
  {
    id: 'fortress',
    name: 'Pháo Thủ',
    classId: 'defender',
    description: 'Khi không chặn kẻ địch, ưu tiên gây Sát thương Vật lý diện rộng từ xa.',
    icon: '/assets/images/icon/class/Fortress_Defender.png'
  },
  {
    id: 'sentry_protector',
    name: 'Tuần Tra',
    classId: 'defender',
    description: 'Chặn 3 kẻ địch và có thể tấn công từ khoảng cách xa.',
    icon: '/assets/images/icon/class/Sentry_Protector_Defender.png'
  },
  {
    id: 'primal_protector',
    name: 'Thiết Vệ Nguyên Tố',
    classId: 'defender',
    description: 'Chặn 3 kẻ địch, có thể gây Tổn thương Nguyên tố.',
    icon: '/assets/images/icon/class/Primal_Protector_Defender.png'
  },

  // ─── Sniper ───────────────────────────────────────────────────────────────
  {
    id: 'marksman',
    name: 'Cao Xạ',
    classId: 'sniper',
    description: 'Ưu tiên tấn công kẻ địch trên không.',
    icon: '/assets/images/icon/class/Marksman_Sniper.png'
  },
  {
    id: 'artilleryman',
    name: 'Pháo Kích',
    classId: 'sniper',
    description: 'Gây Sát thương Vật lý diện rộng.',
    icon: '/assets/images/icon/class/Artilleryman_Sniper.png'
  },
  {
    id: 'deadeye',
    name: 'Thiện Xạ',
    classId: 'sniper',
    description: 'Ưu tiên tấn công kẻ địch có DEF thấp nhất trong tầm đánh.',
    icon: '/assets/images/icon/class/Deadeye_Sniper.png'
  },
  {
    id: 'heavyshooter',
    name: 'Trọng Xạ',
    classId: 'sniper',
    description: 'Đòn bắn điểm xạ cự ly gần với độ chính xác và sức sát thương cao.',
    icon: '/assets/images/icon/class/Heavyshooter_Sniper.png'
  },
  {
    id: 'spreadshooter',
    name: 'Tán Xạ',
    classId: 'sniper',
    description: 'Tấn công tất cả kẻ địch trong tầm đánh, và gây 150% sát thương lên kẻ địch ở hàng ngay phía trước.',
    icon: '/assets/images/icon/class/Spreadshooter_Sniper.png'
  },
  {
    id: 'besieger',
    name: 'Công Thành',
    classId: 'sniper',
    description: 'Ưu tiên tấn công kẻ địch có trọng lượng nặng nhất trước.',
    icon: '/assets/images/icon/class/Besieger_Sniper.png'
  },
  {
    id: 'flinger',
    name: 'Phóng Kích',
    classId: 'sniper',
    description: 'Đòn đánh gây 2 lần Sát thương Vật lý lên kẻ địch mặt đất trong phạm vi nhỏ (lần thứ hai là sóng xung kích gây nửa lượng sát thương thường).',
    icon: '/assets/images/icon/class/Flinger_Sniper.png'
  },
  {
    id: 'hunter',
    name: 'Thợ Săn',
    classId: 'sniper',
    description: 'Đòn đánh tiêu hao Đạn để tăng sức tấn công; Khi không tấn công, Đạn sẽ được nạp lại dần.',
    icon: '/assets/images/icon/class/Hunter_Sniper.png'
  },
  {
    id: 'loopshooter',
    name: 'Hoàn Xạ',
    classId: 'sniper',
    description: 'Chỉ có thể tấn công khi đang giữ boomerang (vũ khí cần thời gian để bay quay trở lại).',
    icon: '/assets/images/icon/class/Loopshooter_Sniper.png'
  },
  {
    id: 'skybreaker',
    name: 'Phá Thiên Xạ',
    classId: 'sniper',
    description: 'Bay lên không trung khi triển khai, chỉ tấn công kẻ địch trên không khi đang bay; kích hoạt kỹ năng sẽ hạ cánh và gây Sát thương Vật lý diện rộng.',
    icon: '/assets/images/icon/class/Skybreaker_Sniper.png'
  },

  // ─── Caster ───────────────────────────────────────────────────────────────
  {
    id: 'corecaster',
    name: 'Thuật Sư Nòng Cốt',
    classId: 'caster',
    description: 'Gây Sát thương Phép.',
    icon: '/assets/images/icon/class/Core_Caster.png'
  },
  {
    id: 'splash_caster',
    name: 'Thuật Sư Khuếch Tán',
    classId: 'caster',
    description: 'Gây Sát thương Phép diện rộng.',
    icon: '/assets/images/icon/class/Splash_Caster.png'
  },
  {
    id: 'mech_accord_caster',
    name: 'Thuật Sư Khí Giới',
    classId: 'caster',
    description: 'Điều khiển Drone gây Sát thương Phép lên kẻ địch; Khi Drone liên tục tấn công cùng một mục tiêu, sát thương tăng dần (lên tới 110% sức tấn công).',
    icon: '/assets/images/icon/class/Mech-Accord_Caster.png'
  },
  {
    id: 'phalanx_caster',
    name: 'Thuật Sư Trận Pháp',
    classId: 'caster',
    description: 'Bình thường không tấn công, nhưng được tăng mạnh giáp và kháng phép; Khi kỹ năng kích hoạt, đòn đánh gây Sát thương Phép diện rộng.',
    icon: '/assets/images/icon/class/Phalanx_Caster.png'
  },
  {
    id: 'mystic_caster',
    name: 'Thuật Sư Huyền Bí',
    classId: 'caster',
    description: 'Đòn đánh gây Sát thương Phép; Khi không có mục tiêu trong tầm, có thể tích trữ đòn đánh và bắn cùng lúc (tối đa tích trữ 3 đòn).',
    icon: '/assets/images/icon/class/Mystic_Caster.png'
  },
  {
    id: 'chain_caster',
    name: 'Thuật Sư Liên Chuỗi',
    classId: 'caster',
    description: 'Đòn đánh gây Sát thương Phép và nảy giữa 4 kẻ địch. Mỗi lần nảy giảm 15% sát thương và gây Làm chậm.',
    icon: '/assets/images/icon/class/Chain_Caster.png'
  },
  {
    id: 'blast_caster',
    name: 'Thuật Sư Bộc Phá',
    classId: 'caster',
    description: 'Gây Sát thương Phép diện rộng theo một đường thẳng dài.',
    icon: '/assets/images/icon/class/Blast_Caster.png'
  },
  {
    id: 'primal_caster',
    name: 'Thuật Sư Nguyên Tố',
    classId: 'caster',
    description: 'Đòn đánh gây Sát thương Phép, có thể gây Sát thương Nguyên tố.',
    icon: '/assets/images/icon/class/Primal_Caster.png'
  },
  {
    id: 'shaper_caster',
    name: 'Thuật Sư Tử Linh',
    classId: 'caster',
    description: 'Gây Sát thương Phép; Có thể tạo Triệu Hồi khi hạ gục kẻ địch, và tấn công các kẻ địch bị các Triệu Hồi này chặn.',
    icon: '/assets/images/icon/class/Shaper_Caster.png'
  },

  // ─── Medic ────────────────────────────────────────────────────────────────
  {
    id: 'medic',
    name: 'Y Sĩ',
    classId: 'medic',
    description: 'Hồi phục HP cho đồng minh.',
    icon: '/assets/images/icon/class/Medic_Medic.png'
  },
  {
    id: 'multitarget_medic',
    name: 'Đa Trị',
    classId: 'medic',
    description: 'Hồi phục HP cho 3 đồng minh cùng một lúc.',
    icon: '/assets/images/icon/class/Multi-target_Medic.png'
  },
  {
    id: 'therapist',
    name: 'Trị Liệu',
    classId: 'medic',
    description: 'Có tầm hồi phục rộng, nhưng lượng hồi phục cho mục tiêu ở xa bị giảm còn 80%.',
    icon: '/assets/images/icon/class/Therapist_Medic.png'
  },
  {
    id: 'wandering_medic',
    name: 'Du Trị',
    classId: 'medic',
    description: 'Hồi phục HP cho đồng minh và hồi phục Tổn thương Nguyên tố bằng 50% sức tấn công (có thể hồi phục Tổn thương Nguyên tố cho đồng minh chưa mất máu).',
    icon: '/assets/images/icon/class/Wandering_Medic.png'
  },
  {
    id: 'incantationmedic',
    name: 'Thuật Trị',
    classId: 'medic',
    description: 'Đòn đánh gây Sát thương Phép và hồi máu cho một đồng minh trong tầm đánh bằng 50% lượng sát thương gây ra.',
    icon: '/assets/images/icon/class/Incantation_Medic.png'
  },
  {
    id: 'chain_medic',
    name: 'Liên Trị',
    classId: 'medic',
    description: 'Hồi phục HP cho đồng minh, dòng trị liệu nảy giữa 3 mục tiêu. Khả năng hồi phục giảm 25% sau mỗi lần nảy.',
    icon: '/assets/images/icon/class/Chain_Medic.png'
  },
  {
    id: 'watchman_medic',
    name: 'Watchman Medic',
    classId: 'medic',
    description: 'Hồi phục HP cho đồng minh, có khả năng Bay lên không trung.',
    icon: '/assets/images/icon/class/Watchman_Medic.png'
  },

  // ─── Supporter ────────────────────────────────────────────────────────────
  {
    id: 'decel_binder',
    name: 'Khống Chế',
    classId: 'supporter',
    description: 'Gây Sát thương Phép và Làm chậm mục tiêu trong thời gian ngắn.',
    icon: '/assets/images/icon/class/Decel_Binder_Supporter.png'
  },
  {
    id: 'hexer',
    name: 'Nguyền Sư',
    classId: 'supporter',
    description: 'Đòn đánh gây Sát thương Phép.',
    icon: '/assets/images/icon/class/Hexer_Supporter.png'
  },
  {
    id: 'summoner',
    name: 'Triệu Hồi Sư',
    classId: 'supporter',
    description: 'Gây Sát thương Phép, có thể sử dụng Triệu Hồi trong trận chiến.',
    icon: '/assets/images/icon/class/Summoner_Supporter.png'
  },
  {
    id: 'bard',
    name: 'Phiêu Ca',
    classId: 'supporter',
    description: 'Không tấn công nhưng liên tục hồi phục HP cho tất cả đồng minh trong tầm (lượng HP hồi mỗi giây bằng 10% sức tấn công bản thân). Bản thân không nhận hiệu ứng Cảm Hứng.',
    icon: '/assets/images/icon/class/Bard_Supporter.png'
  },
  {
    id: 'abjurer',
    name: 'Hậu Thuẫn',
    classId: 'supporter',
    description: 'Gây Sát thương Phép; Khi kỹ năng kích hoạt, đòn đánh chuyển sang hồi phục HP cho đồng minh (lượng hồi máu bằng 75% sức tấn công).',
    icon: '/assets/images/icon/class/Abjurer_Supporter.png'
  },
  {
    id: 'artificer',
    name: 'Thợ Máy',
    classId: 'supporter',
    description: 'Chặn 2 kẻ địch; Có thể sử dụng các Thiết Bị Hỗ Trợ trong trận chiến.',
    icon: '/assets/images/icon/class/Artificer_Supporter.png'
  },
  {
    id: 'ritualist',
    name: 'Pháp Sư',
    classId: 'supporter',
    description: 'Đòn đánh gây Sát thương Phép, có thể gây Tổn thương Nguyên tố.',
    icon: '/assets/images/icon/class/Ritualist_Supporter.png'
  },

  // ─── Specialist ───────────────────────────────────────────────────────────
  {
    id: 'executor',
    name: 'Sát Thủ',
    classId: 'specialist',
    description: 'Giảm đáng kể thời gian Tái triển khai.',
    icon: '/assets/images/icon/class/Executor_Specialist.png'
  },
  {
    id: 'merchant',
    name: 'Thương Gia',
    classId: 'specialist',
    description: 'Giảm thời gian Tái triển khai, nhưng không hoàn trả DP khi rút lui; Khi đang triển khai, tiêu hao 3 DP mỗi 3 giây (tự động rút lui nếu không đủ DP).',
    icon: '/assets/images/icon/class/Merchant_Specialist.png'
  },
  {
    id: 'hookmaster',
    name: 'Lôi Kéo',
    classId: 'specialist',
    description: 'Có thể Kéo kẻ địch bằng kỹ năng, có thể triển khai trên Ô Cao.',
    icon: '/assets/images/icon/class/Hookmaster_Specialist.png'
  },
  {
    id: 'push_stroker',
    name: 'Đẩy Lùi',
    classId: 'specialist',
    description: 'Có thể tấn công tất cả kẻ địch bị chặn, có thể triển khai trên Ô Cao.',
    icon: '/assets/images/icon/class/Push_Stroker_Specialist.png'
  },
  {
    id: 'ambusher',
    name: 'Phục Kích',
    classId: 'specialist',
    description: 'Gây sát thương lên tất cả mục tiêu trong tầm, có 50% cơ hội né đòn tấn công Vật lý và Phép, ít bị kẻ địch nhắm tới hơn.',
    icon: '/assets/images/icon/class/Ambusher_Specialist.png'
  },
  {
    id: 'dollkeeper',
    name: 'Thế Thân',
    classId: 'specialist',
    description: 'Không rút lui khi nhận sát thương chí tử, thay vào đó chuyển sang một Thế Thân (Thế Thân chặn 0). Chuyển lại về bản thể sau 20 giây.',
    icon: '/assets/images/icon/class/Dollkeeper_Specialist.png'
  },
  {
    id: 'geek',
    name: 'Quái Kiệt',
    classId: 'specialist',
    description: 'Liên tục mất HP theo thời gian.',
    icon: '/assets/images/icon/class/Geek_Specialist.png'
  },
  {
    id: 'trapmaster',
    name: 'Đánh Bẫy',
    classId: 'specialist',
    description: 'Có thể đặt Bẫy để hỗ trợ chiến đấu, nhưng bẫy không thể đặt trên ô đã có kẻ địch đứng.',
    icon: '/assets/images/icon/class/Trapmaster_Specialist.png'
  },
  {
    id: 'alchemist',
    name: 'Nhà Giả Kim',
    classId: 'specialist',
    description: 'Có thể ném các Đơn Vị Thuật Giả Kim để hỗ trợ trong chiến đấu.',
    icon: '/assets/images/icon/class/Alchemist_Specialist.png'
  },
  {
    id: 'skyranger',
    name: 'Phòng Không',
    classId: 'specialist',
    description: 'Sau khi Bay lên không trung, có thể chặn 2 kẻ địch đang bay.',
    icon: '/assets/images/icon/class/Skyranger_Specialist.png'
  }
]

export const SUBCLASSES_MAP = SUBCLASSES.reduce((acc, item) => {
  acc[item.id] = item
  // Normalized key (stripped of dashes and underscores)
  const stripped = item.id.toLowerCase().replace(/[-_\s]/g, '')
  if (!acc[stripped]) acc[stripped] = item
  // Snake case alias
  const snake = item.id.toLowerCase().replace(/[-\s]/g, '_')
  if (!acc[snake]) acc[snake] = item
  return acc
}, {})

if (SUBCLASSES_MAP['sentry_protector']) {
  SUBCLASSES_MAP['sentry'] = SUBCLASSES_MAP['sentry_protector']
}

// ─── Factions ───────────────────────────────────────────────────────────────
export const FACTIONS = [
  // ─── Parent Factions / Nations ────────────────────────────────────────────
  { id: 'rhodes_island', name: 'Rhodes Island', icon: '/assets/images/icon/factions/Rhodes_Island.png' },
  { id: 'yan', name: 'Viêm Quốc', icon: '/assets/images/icon/factions/Yan.png' },
  { id: 'victoria', name: 'Victoria', icon: '/assets/images/icon/factions/Victoria.png' },
  { id: 'ursus', name: 'Ursus', icon: '/assets/images/icon/factions/Ursus.png' },
  { id: 'columbia', name: 'Columbia', icon: '/assets/images/icon/factions/Columbia.png' },
  { id: 'kazimierz', name: 'Kazimierz', icon: '/assets/images/icon/factions/Kazimierz.png' },
  { id: 'kjerag', name: 'Kjerag', icon: '/assets/images/icon/factions/Kjerag.png' },
  { id: 'laterano', name: 'Laterano', icon: '/assets/images/icon/factions/Laterano.png' },
  { id: 'siracusa', name: 'Siracusa', icon: '/assets/images/icon/factions/Siracusa.png' },
  { id: 'leithanien', name: 'Leithanien', icon: '/assets/images/icon/factions/Leithanien.png' },
  { id: 'iberia', name: 'Iberia', icon: '/assets/images/icon/factions/Iberia.png' },
  { id: 'aegir', name: 'Aegir', icon: '/assets/images/icon/factions/Aegir.png' },
  { id: 'sami', name: 'Sami', icon: '/assets/images/icon/factions/Sami.png' },
  { id: 'sargon', name: 'Sargon', icon: '/assets/images/icon/factions/Sargon.png' },
  { id: 'minos', name: 'Minos', icon: '/assets/images/icon/factions/Minos.png' },
  { id: 'higashi', name: 'Higashi', icon: '/assets/images/icon/factions/Higashi.png' },
  { id: 'rim_billiton', name: 'Rim Billiton', icon: '/assets/images/icon/factions/Rim_Billiton.png' },
  { id: 'bolivar', name: 'Bolívar', icon: '/assets/images/icon/factions/Bolívar.png' },
  { id: 'siesta', name: 'Siesta', icon: '/assets/images/icon/factions/Siesta.png' },
  { id: 'babel', name: 'Babel', icon: '/assets/images/icon/factions/Babel.png' },
  { id: 'team_rainbow', name: 'Team Rainbow', icon: '/assets/images/icon/factions/Team_Rainbow.png' },

  // ─── Subfactions / Affiliated Groups ───────────────────────────────────────
  // Rhodes Island
  { id: 'elite_op', name: 'Cán viên Tinh nhuệ', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Elite_Op.png' },
  { id: 'sweep', name: 'SWEEP', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/S.W.E.E.P.png' },
  { id: 'op_reserve_a1', name: 'Đội Dự bị Tác chiến A1', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Op_Reserve_A1.png' },
  { id: 'op_reserve_a4', name: 'Đội Dự bị Tác chiến A4', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Op_Reserve_A4.png' },
  { id: 'op_reserve_a6', name: 'Đội Dự bị Tác chiến A6', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Op_Reserve_A6.png' },
  { id: 'op_a4', name: 'Đội Tác chiến A4', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Op_A4.png' },
  { id: 'followers', name: 'Followers', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Followers.png' },

  // Yan
  { id: 'lungmen', name: 'Long Môn', parentId: 'yan', icon: '/assets/images/icon/factions/Lungmen.png' },
  { id: 'lungmen_guard', name: 'Cục Cảnh vệ Long Môn', parentId: 'yan', icon: '/assets/images/icon/factions/Lungmen_Guard_Department.png' },
  { id: 'penguin_logistics', name: 'Chuyển phát Cánh Cụt', parentId: 'yan', icon: '/assets/images/icon/factions/Penguin_Logistics.png' },
  { id: 'lee_detective', name: 'Văn phòng Thám tử Lý', parentId: 'yan', icon: "/assets/images/icon/factions/Lee's_Detective_Agency.png" },
  { id: 'sui', name: 'Tuế', parentId: 'yan', icon: '/assets/images/icon/factions/Sui.png' },

  // Victoria
  { id: 'glasgow', name: 'Băng Glasgow', parentId: 'victoria', icon: '/assets/images/icon/factions/Glasgow.png' },
  { id: 'tara', name: 'Tara / Dublinn', parentId: 'victoria', icon: '/assets/images/icon/factions/Tara.png' },

  // Ursus
  { id: 'ursus_students', name: 'Hội Học sinh Tự trị Ursus', parentId: 'ursus', icon: '/assets/images/icon/factions/Ursus_Student_Self-Governing_Group.png' },

  // Columbia
  { id: 'rhine_lab', name: 'Viện Rhine', parentId: 'columbia', icon: '/assets/images/icon/factions/Rhine_Lab.png' },
  { id: 'blacksteel', name: 'Blacksteel Quốc Tế', parentId: 'columbia', icon: '/assets/images/icon/factions/Blacksteel.png' },

  // Kazimierz
  { id: 'pinus_sylvestris', name: 'Pinus Sylvestris', parentId: 'kazimierz', icon: '/assets/images/icon/factions/Pinus_Sylvestris.png' },

  // Kjerag
  { id: 'karlan_trade', name: 'Karlan Trade', parentId: 'kjerag', icon: '/assets/images/icon/factions/Karlan_Trade.png' },

  // Aegir
  { id: 'abyssal_hunters', name: 'Thợ săn Vực thẳm', parentId: 'aegir', icon: '/assets/images/icon/factions/Abyssal_Hunters.png' },
]

export const FACTIONS_MAP = FACTIONS.reduce((acc, item) => {
  acc[item.id] = item
  const stripped = item.id.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!acc[stripped]) acc[stripped] = item
  return acc
}, {})

// Aliases for common variants
if (FACTIONS_MAP['bolivar']) {
  FACTIONS_MAP['bolívar'] = FACTIONS_MAP['bolivar']
}
if (FACTIONS_MAP['lee_detective']) {
  FACTIONS_MAP["lee's_detective_agency"] = FACTIONS_MAP['lee_detective']
  FACTIONS_MAP['lees_detective_agency'] = FACTIONS_MAP['lee_detective']
}
if (FACTIONS_MAP['lungmen_guard']) {
  FACTIONS_MAP['lungmen_guard_department'] = FACTIONS_MAP['lungmen_guard']
}
if (FACTIONS_MAP['sweep']) {
  FACTIONS_MAP['s.w.e.e.p.'] = FACTIONS_MAP['sweep']
  FACTIONS_MAP['s_w_e_e_p'] = FACTIONS_MAP['sweep']
}
if (FACTIONS_MAP['elite_op']) {
  FACTIONS_MAP['elite_operator'] = FACTIONS_MAP['elite_op']
  FACTIONS_MAP['elite_ope'] = FACTIONS_MAP['elite_op']
}
if (FACTIONS_MAP['abyssal_hunters']) {
  FACTIONS_MAP['abyssal_hunter'] = FACTIONS_MAP['abyssal_hunters']
}
if (FACTIONS_MAP['ursus_students']) {
  FACTIONS_MAP['ursus_student'] = FACTIONS_MAP['ursus_students']
}

// ─── Helpers for Factions ───────────────────────────────────────────────────
export function getOperatorFactionIds(op) {
  if (!op) return []
  const ids = new Set()

  const addFactionAndParents = (factionId) => {
    if (!factionId) return
    let currentId = factionId
    while (currentId && !ids.has(currentId)) {
      ids.add(currentId)
      const faction = FACTIONS_MAP[currentId]
      currentId = faction?.parentId
    }
  }

  if (Array.isArray(op.factions)) {
    op.factions.forEach(id => addFactionAndParents(id))
  } else if (op.faction) {
    addFactionAndParents(op.faction)
  }

  return Array.from(ids)
}

export function getHierarchicalFactions() {
  const roots = FACTIONS.filter(f => !f.parentId)
  const childrenMap = FACTIONS.reduce((acc, f) => {
    if (f.parentId) {
      if (!acc[f.parentId]) acc[f.parentId] = []
      acc[f.parentId].push(f)
    }
    return acc
  }, {})

  const result = []
  roots.forEach(root => {
    result.push(root)
    const children = childrenMap[root.id] || []
    children.forEach(child => {
      result.push({
        ...child,
        isChild: true,
        displayName: `${child.name}`
      })
    })
  })
  return result
}
