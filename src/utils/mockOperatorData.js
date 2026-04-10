// ─────────────────────────────────────────────────────────────────────────────
// Mock Operator Data
// Structure mirrors the Hybrid Database design:
//   - operators table: core info + combat_info (JSONB) + lore_info (JSONB)
//   - operator_skins table: separate skin entries
//   - operator_dialogues table: voice lines linked to skin
//   - stories table (reused): operator records via operator_id FK
// ─────────────────────────────────────────────────────────────────────────────

// ─── Reference Data (Classes, Factions) ────────────────────────────────────

export const OPERATOR_CLASSES = [
  { id: 'caster', name: 'Caster', icon: '/assets/images/class/caster.png' },
  { id: 'guard', name: 'Guard', icon: '/assets/images/class/guard.png' },
  { id: 'defender', name: 'Defender', icon: '/assets/images/class/defender.png' },
  { id: 'sniper', name: 'Sniper', icon: '/assets/images/class/sniper.png' },
  { id: 'medic', name: 'Medic', icon: '/assets/images/class/medic.png' },
  { id: 'supporter', name: 'Supporter', icon: '/assets/images/class/supporter.png' },
  { id: 'vanguard', name: 'Vanguard', icon: '/assets/images/class/vanguard.png' },
  { id: 'specialist', name: 'Specialist', icon: '/assets/images/class/specialist.png' },
];

export const OPERATOR_SUBCLASSES = [
  { id: 'core_caster', name: 'Core Caster', classId: 'caster', icon: '/assets/images/subclass/core_caster.png' },
  { id: 'arts_fighter', name: 'Arts Fighter', classId: 'guard', icon: '/assets/images/subclass/arts_fighter.png' },
  { id: 'swordmaster', name: 'Swordmaster', classId: 'guard', icon: '/assets/images/subclass/swordmaster.png' },
  { id: 'ranged_guard', name: 'Ranged Guard', classId: 'guard', icon: '/assets/images/subclass/ranged_guard.png' },
];

export const FACTIONS = [
  { id: 'rhodes_island', name: 'Rhodes Island', icon: '/assets/images/faction/rhodes_island.png' },
  { id: 'lungmen', name: 'Lungmen', icon: '/assets/images/faction/lungmen.png' },
  { id: 'karlan_trade', name: 'Karlan Trade Co.', icon: '/assets/images/faction/karlan_trade.png' },
  { id: 'penguin_logistics', name: 'Penguin Logistics', icon: '/assets/images/faction/penguin_logistics.png' },
  { id: 'blacksteel', name: 'Blacksteel Worldwide', icon: '/assets/images/faction/blacksteel.png' },
  { id: 'ursus', name: 'Ursus', icon: '/assets/images/faction/ursus.png' },
  { id: 'kjerag', name: 'Kjerag', icon: '/assets/images/faction/kjerag.png' },
  { id: 'glasgow', name: 'Glasgow', icon: '/assets/images/faction/glasgow.png' },
  { id: 'abyssal_hunters', name: 'Abyssal Hunters', icon: '/assets/images/faction/abyssal_hunters.png' },
];

// ─── Operator Entries ──────────────────────────────────────────────────────

export const MOCK_OPERATORS = [
  // ═══════════════════════════════════════════════════════════════════════
  // AMIYA
  // ═══════════════════════════════════════════════════════════════════════
  {
    operator_id: 'char_002_amiya',
    name: 'Amiya',
    rarity: 5,
    class: 'caster',
    sub_class: 'core_caster',
    factions: ['rhodes_island'],
    avatar_url: '/assets/images/operator/amiya/avatar.png',

    // ── combat_info (JSONB column) ──────────────────────────────────────
    combat_info: {
      operator_token: {
        description: 'A small ring that carries a familiar warmth. As you put it on, you feel as if she is standing right beside you.',
      },
      skills: [
        {
          id: 'sk_amiya_1',
          name: 'Spirit Burst',
          icon: '/assets/images/operator/amiya/skill_1.png',
          description: 'ATK increases to 160%. Each attack hits twice. Each hit\'s damage is halved.',
        },
        {
          id: 'sk_amiya_2',
          name: 'Soul Absorption',
          icon: '/assets/images/operator/amiya/skill_2.png',
          description: 'ATK increases to 200%. Attacks deal Arts damage and recover 4 SP per hit. Duration: infinite.',
        },
        {
          id: 'sk_amiya_3',
          name: 'Chimera',
          icon: '/assets/images/operator/amiya/skill_3.png',
          description: 'Increases ATK to 370%. Attack interval is slightly increased. Attacks deal True damage. After the skill ends, Amiya is stunned for 10 seconds.',
        },
      ],
      talents: [
        {
          name: 'Emotional Absorption',
          description: 'Gain 1 SP for every enemy killed within the 4 surrounding tiles.',
        },
        {
          name: 'Spiritual Destruction',
          description: 'When the third skill is active, attacks ignore the target\'s RES.',
        },
      ],
      modules: [
        {
          id: 'mod_amiya_x',
          name: 'Module X: Starfall',
          icon: '/assets/images/operator/amiya/module_x.png',
          description: 'Increases base ATK by 25 and ASPD by 3. After deployment, immediately recovers 15 SP.',
          story: 'Amiya has always carried a burden far heavier than what any child should bear. The ring upon her finger pulses with a light that speaks of promises, both made and broken. Those who know its origin understand why she fights with such quiet desperation—not for vengeance, but for a world where such rings need never be forged again.\n\nThe module designated "Starfall" was engineered by the Engineering Department specifically for Amiya after the Chernobog incident. It channels the ambient Originium Arts in the environment to supplement her natural energy reserves, reducing the physical toll of her abilities. Dr. Kal\'tsit insisted on its creation after observing the aftereffects of Amiya\'s third combat skill during field operations.',
        },
      ],
    },

    // ── lore_info (JSONB column) ────────────────────────────────────────
    lore_info: {
      profiles: [
        {
          title: 'Basic Info',
          content: 'Amiya is the young leader of Rhodes Island and its public representative. Although she appears to be only a teenager, she has already proven herself as a capable leader and a powerful Arts user.',
        },
        {
          title: 'Physical Exam',
          content: 'Strength: Normal | Mobility: Normal | Endurance: Normal |\nTactical Acumen: Excellent | Combat Skill: Excellent | Originium Arts Assimilation: Outstanding',
        },
        {
          title: 'Clinical Analysis',
          content: 'Imaging tests reveal dense Originium clusters within her circulatory system, indicating early-stage Oripathy. Further tests confirm she possesses a rare and potent form of Arts utilization that is directly linked to her emotional state.\n\n[Classified]\nThe nature of Amiya\'s condition is far more complex than standard Oripathy. Additional details are restricted to Level-4 clearance and above.',
        },
        {
          title: 'Archive File 1',
          content: 'Amiya was found as an orphan and taken in by the previous leader of Rhodes Island. Little is known about her origins. Despite her young age and gentle demeanor, she demonstrates an uncanny ability to lead, inspiring loyalty in even the most hardened operators.',
        },
        {
          title: 'Archive File 2',
          content: 'Amiya\'s Arts abilities are categorized as "Chimera" type, an extremely rare classification. Her powers allow her to not only project devastating offensive Arts but also to sense and, to some degree, absorb the emotional states of those around her. This ability is both a gift and a considerable psychological burden.',
        },
        {
          title: 'Archive File 3',
          content: 'Following the events at Chernobog, Amiya has taken on a more direct combat role. While Dr. Kal\'tsit has expressed concerns about the physical cost of her abilities, Amiya is resolute. "If there\'s something I can do, then I must do it," she was heard saying to the Doctor. "Not because I\'m the leader. Because I\'m one of them."',
        },
      ],
    },

    // ── Skins (operator_skins table) ────────────────────────────────────
    skins: [
      {
        skin_id: 'skin_amiya_default',
        name: 'Default',
        image_url: '/assets/images/operator/amiya/skin_default.png',
        description: '',
        is_default: true,
      },
      {
        skin_id: 'skin_amiya_e2',
        name: 'Elite 2',
        image_url: '/assets/images/operator/amiya/skin_e2.png',
        description: 'Amiya after her second promotion, wearing the new uniform tailored by the logistics team. The dark fabric is interwoven with Originium-dampening threads, a precaution suggested by Dr. Kal\'tsit.',
        is_default: false,
      },
      {
        skin_id: 'skin_amiya_epoque',
        name: 'Epoque - Newsgirl',
        image_url: '/assets/images/operator/amiya/skin_epoque.png',
        description: '"Breaking news! This is Amiya from Rhodes Island Daily, reporting live! ...Um, was that okay? I practiced in front of the mirror all morning." — This outfit was a gift from the Doctor, intended for a morale-boosting event. Amiya wears it with characteristic earnestness.',
        is_default: false,
      },
    ],

    // ── Dialogues (operator_dialogues table) ─────────────────────────────
    dialogues: [
      {
        dialogue_id: 'dlg_amiya_001',
        skin_id: null, // Default skin dialogues
        title: 'Greeting',
        text_content: 'Good morning, Doctor. I hope you slept well. There\'s a lot of work today, but don\'t worry — I\'ll be by your side.',
        audio_url_jp: '/assets/audio/operator/amiya/jp/greeting.mp3',
        audio_url_en: '/assets/audio/operator/amiya/en/greeting.mp3',
        audio_url_cn: '/assets/audio/operator/amiya/cn/greeting.mp3',
      },
      {
        dialogue_id: 'dlg_amiya_002',
        skin_id: null,
        title: 'Talk 1',
        text_content: 'I know I\'m still young, and I know there are things I don\'t fully understand yet. But the people of Rhodes Island... they trust me. And I won\'t let that trust be misplaced.',
        audio_url_jp: '/assets/audio/operator/amiya/jp/talk_1.mp3',
        audio_url_en: '/assets/audio/operator/amiya/en/talk_1.mp3',
        audio_url_cn: '/assets/audio/operator/amiya/cn/talk_1.mp3',
      },
      {
        dialogue_id: 'dlg_amiya_003',
        skin_id: null,
        title: 'Talk 2',
        text_content: 'This ring... it was given to me by someone very important. I don\'t remember everything about them, but... I never take it off. It reminds me of why I\'m here.',
        audio_url_jp: '/assets/audio/operator/amiya/jp/talk_2.mp3',
        audio_url_en: '/assets/audio/operator/amiya/en/talk_2.mp3',
        audio_url_cn: '/assets/audio/operator/amiya/cn/talk_2.mp3',
      },
      {
        dialogue_id: 'dlg_amiya_004',
        skin_id: null,
        title: 'Battle Start',
        text_content: 'Everyone, stay focused! We can do this!',
        audio_url_jp: '/assets/audio/operator/amiya/jp/battle_start.mp3',
        audio_url_en: '/assets/audio/operator/amiya/en/battle_start.mp3',
        audio_url_cn: '/assets/audio/operator/amiya/cn/battle_start.mp3',
      },
      {
        dialogue_id: 'dlg_amiya_005',
        skin_id: null,
        title: 'Skill Activation',
        text_content: 'I won\'t lose... not here!',
        audio_url_jp: '/assets/audio/operator/amiya/jp/skill.mp3',
        audio_url_en: '/assets/audio/operator/amiya/en/skill.mp3',
        audio_url_cn: '/assets/audio/operator/amiya/cn/skill.mp3',
      },
      {
        dialogue_id: 'dlg_amiya_006',
        skin_id: null,
        title: 'Defeated',
        text_content: 'Doctor... I\'m sorry... I couldn\'t...',
        audio_url_jp: '/assets/audio/operator/amiya/jp/defeated.mp3',
        audio_url_en: '/assets/audio/operator/amiya/en/defeated.mp3',
        audio_url_cn: '/assets/audio/operator/amiya/cn/defeated.mp3',
      },
      // Skin-specific dialogues (Epoque skin)
      {
        dialogue_id: 'dlg_amiya_epoque_001',
        skin_id: 'skin_amiya_epoque',
        title: 'Greeting',
        text_content: 'Good morning, Doctor! Amiya from RID — Rhodes Island Daily — here! Today\'s headline: the Doctor is working hard as always! ...Ehehe.',
        audio_url_jp: '/assets/audio/operator/amiya/jp/epoque_greeting.mp3',
        audio_url_en: '/assets/audio/operator/amiya/en/epoque_greeting.mp3',
        audio_url_cn: '/assets/audio/operator/amiya/cn/epoque_greeting.mp3',
      },
      {
        dialogue_id: 'dlg_amiya_epoque_002',
        skin_id: 'skin_amiya_epoque',
        title: 'Talk 1',
        text_content: 'I\'ve been interviewing everyone at Rhodes Island for our newsletter! Blaze said something really cool, let me check my notes...',
        audio_url_jp: '/assets/audio/operator/amiya/jp/epoque_talk_1.mp3',
        audio_url_en: '/assets/audio/operator/amiya/en/epoque_talk_1.mp3',
        audio_url_cn: '/assets/audio/operator/amiya/cn/epoque_talk_1.mp3',
      },
    ],

    // ── Operator Records (stories table with operator_id FK) ─────────────
    records: [
      {
        story_id: 'op_record_amiya_01',
        name: 'Amiya\'s Resolve',
        description: 'A personal record of Amiya reflecting on the events at Chernobog and the responsibilities she has chosen to bear.',
        display_order: 1,
        story_content: {
          type: 'vns',
          script: `[background: bg_rhodes_bridge]
[bgm: bgm_quiet_night]

[narrator]
Late at night, the bridge of Rhodes Island is quiet. Only the hum of the ship's engines fills the air.

[Amiya|default]
...

[narrator]
Amiya stands alone by the observation window, looking out at the dark landscape below.

[Amiya|default]
Doctor... are you still awake?

[narrator]
She turns, surprised by the footsteps behind her.

[Amiya|default]
I was just... thinking. About everything that happened in Chernobog. About the people we couldn't save.

[Amiya|default]
Sometimes I wonder if I'm really the right person to lead Rhodes Island. I'm not the strongest. I'm not the wisest.

[Amiya|default]
But then I think about everyone here — Dobermann, Closure, Kal'tsit, and you, Doctor.

[Amiya|default]
And I remember: it's not about being the best. It's about being here. About not giving up.

[Amiya|default]
So I'll keep going. For everyone.

[narrator]
She smiles — a small, quiet smile, but one that carries the weight of an unshakable resolve.`,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CH'EN
  // ═══════════════════════════════════════════════════════════════════════
  {
    operator_id: 'char_010_chen',
    name: "Ch'en",
    rarity: 6,
    class: 'guard',
    sub_class: 'swordmaster',
    factions: ['lungmen', 'rhodes_island'],
    avatar_url: '/assets/images/operator/chen/avatar.png',

    combat_info: {
      operator_token: {
        description: 'A well-worn badge from the Lungmen Guard Department. Though she has left, her sense of justice remains.',
      },
      skills: [
        {
          id: 'sk_chen_1',
          name: 'Sheathed Strike',
          icon: '/assets/images/operator/chen/skill_1.png',
          description: 'The next attack deals 200% Physical damage.',
        },
        {
          id: 'sk_chen_2',
          name: 'Chi Xiao - Unsheath',
          icon: '/assets/images/operator/chen/skill_2.png',
          description: 'Deal 620% Arts damage to all enemies in range. Ignores deployment limit.',
        },
        {
          id: 'sk_chen_3',
          name: 'Chi Xiao - Shadowless',
          icon: '/assets/images/operator/chen/skill_3.png',
          description: 'Immediately deals 10 hits of Arts damage to a random enemy in range. Each hit deals 110% ATK as Arts damage.',
        },
      ],
      talents: [
        {
          name: 'Scolding',
          description: 'All [Lungmen] operators gain +1 SP every 4 seconds.',
        },
      ],
      modules: [
        {
          id: 'mod_chen_y',
          name: 'Module Y: Lungmen Code',
          icon: '/assets/images/operator/chen/module_y.png',
          description: 'When this Operator is deployed, all [Guard] operators gain +8% ATK.',
          story: "The Lungmen Guard Department was Ch'en's life. She joined not out of obligation, but because she saw in its mission a reflection of her own sense of justice. The rules, the order, the clear lines between right and wrong—they were a framework she could cling to in a world of moral ambiguity.\n\nBut the world changed, and so did Lungmen. When the choice came between duty and conscience, Ch'en chose to walk away. The badge stays with her, not as a reminder of what she left behind, but of the ideals that first drove her to serve.",
        },
      ],
    },

    lore_info: {
      profiles: [
        {
          title: 'Basic Info',
          content: "Ch'en Hui-Chieh is the former Chief of the Lungmen Guard Department. A woman of fierce conviction and formidable combat skill, she now serves as a Rhodes Island operator after a series of events that forced her to reevaluate her loyalty to Lungmen's political establishment.",
        },
        {
          title: 'Physical Exam',
          content: 'Strength: Excellent | Mobility: Excellent | Endurance: Excellent |\nTactical Acumen: Outstanding | Combat Skill: Outstanding | Originium Arts Assimilation: Standard',
        },
        {
          title: 'Archive File 1',
          content: "Ch'en's swordsmanship is derived from the ancient Yan tradition but has been adapted through years of practical enforcement work. Her blade, Chi Xiao, is said to be one of a pair—twin swords of extraordinary craftsmanship. The location of the second blade remains unknown.",
        },
      ],
    },

    skins: [
      {
        skin_id: 'skin_chen_default',
        name: 'Default',
        image_url: '/assets/images/operator/chen/skin_default.png',
        description: '',
        is_default: true,
      },
      {
        skin_id: 'skin_chen_e2',
        name: 'Elite 2',
        image_url: '/assets/images/operator/chen/skin_e2.png',
        description: "Ch'en in her full Lungmen Guard Department regalia. The uniform is spotless, the badges gleaming — a testament to the pride she takes in her work.",
        is_default: false,
      },
    ],

    dialogues: [
      {
        dialogue_id: 'dlg_chen_001',
        skin_id: null,
        title: 'Greeting',
        text_content: "Hmph. You're the Doctor? ...Let's see if you're as capable as they say.",
        audio_url_jp: '/assets/audio/operator/chen/jp/greeting.mp3',
        audio_url_en: '/assets/audio/operator/chen/en/greeting.mp3',
        audio_url_cn: '/assets/audio/operator/chen/cn/greeting.mp3',
      },
      {
        dialogue_id: 'dlg_chen_002',
        skin_id: null,
        title: 'Talk 1',
        text_content: "Rules exist for a reason. Without them, we're no different from the ones we're fighting against.",
        audio_url_jp: '/assets/audio/operator/chen/jp/talk_1.mp3',
        audio_url_en: '/assets/audio/operator/chen/en/talk_1.mp3',
        audio_url_cn: '/assets/audio/operator/chen/cn/talk_1.mp3',
      },
      {
        dialogue_id: 'dlg_chen_003',
        skin_id: null,
        title: 'Battle Start',
        text_content: 'Chi Xiao, let us begin.',
        audio_url_jp: '/assets/audio/operator/chen/jp/battle_start.mp3',
        audio_url_en: '/assets/audio/operator/chen/en/battle_start.mp3',
        audio_url_cn: '/assets/audio/operator/chen/cn/battle_start.mp3',
      },
    ],

    records: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SILVERASH
  // ═══════════════════════════════════════════════════════════════════════
  {
    operator_id: 'char_003_silverash',
    name: 'SilverAsh',
    rarity: 6,
    class: 'guard',
    sub_class: 'ranged_guard',
    factions: ['karlan_trade', 'kjerag'],
    avatar_url: '/assets/images/operator/silverash/avatar.png',

    combat_info: {
      operator_token: {
        description: 'A small snow leopard figurine carved from a Kjerag glacier stone. It\'s cold to the touch, yet somehow comforting.',
      },
      skills: [
        {
          id: 'sk_sa_1',
          name: 'Power Strike γ',
          icon: '/assets/images/operator/silverash/skill_1.png',
          description: 'The next attack deals 290% Physical damage.',
        },
        {
          id: 'sk_sa_2',
          name: 'Eagle Eye',
          icon: '/assets/images/operator/silverash/skill_2.png',
          description: 'Increases attack range. All enemies within range have their Stealth removed.',
        },
        {
          id: 'sk_sa_3',
          name: 'Truesilver Slash',
          icon: '/assets/images/operator/silverash/skill_3.png',
          description: 'Greatly increases Attack Range. ATK increases to 200% and attacks deal damage to all enemies in range. Duration: 25 seconds.',
        },
      ],
      talents: [
        {
          name: 'Leader',
          description: 'When deployed, all friendly units gain +10% Physical and Arts dodge.',
        },
      ],
      modules: [
        {
          id: 'mod_sa_x',
          name: 'Module X: Kjerag\'s Will',
          icon: '/assets/images/operator/silverash/module_x.png',
          description: 'During Truesilver Slash, enemies hit have their DEF reduced by 100 for 3 seconds.',
          story: 'SilverAsh grew up in the heart of Kjerag, where the snow never melts and the politics are as treacherous as the mountain passes. Inheriting leadership of Karlan Trade at a young age, he learned quickly that survival demanded both strength and cunning.\n\nThe module "Kjerag\'s Will" represents his philosophy: break the enemy\'s defenses, and the rest follows. It was developed in collaboration with Rhine Lab, a partnership that raised more than a few eyebrows among Kjerag\'s conservative elders.',
        },
      ],
    },

    lore_info: {
      profiles: [
        {
          title: 'Basic Info',
          content: 'SilverAsh is the current head of the Silverash family and CEO of Karlan Trade Co., the largest commercial enterprise in Kjerag. A shrewd politician and a devastating combatant, he works with Rhodes Island to advance both his nation\'s future and his own agenda.',
        },
        {
          title: 'Physical Exam',
          content: 'Strength: Outstanding | Mobility: Excellent | Endurance: Outstanding |\nTactical Acumen: Outstanding | Combat Skill: Outstanding | Originium Arts Assimilation: Normal',
        },
        {
          title: 'Archive File 1',
          content: 'SilverAsh\'s relationship with Rhodes Island is pragmatic. He provides considerable financial support and, in return, gains access to medical expertise for his sister\'s condition. Beyond this transaction, however, he has shown genuine interest in Rhodes Island\'s broader mission.',
        },
      ],
    },

    skins: [
      {
        skin_id: 'skin_sa_default',
        name: 'Default',
        image_url: '/assets/images/operator/silverash/skin_default.png',
        description: '',
        is_default: true,
      },
      {
        skin_id: 'skin_sa_e2',
        name: 'Elite 2',
        image_url: '/assets/images/operator/silverash/skin_e2.png',
        description: 'SilverAsh in his formal Kjerag attire. The white fur-lined coat is both practical and symbolic—a reminder of the frozen peaks he calls home.',
        is_default: false,
      },
    ],

    dialogues: [
      {
        dialogue_id: 'dlg_sa_001',
        skin_id: null,
        title: 'Greeting',
        text_content: 'Ah, Doctor. Shall we discuss today\'s strategy over a cup of Kjerag black tea?',
        audio_url_jp: '/assets/audio/operator/silverash/jp/greeting.mp3',
        audio_url_en: '/assets/audio/operator/silverash/en/greeting.mp3',
        audio_url_cn: '/assets/audio/operator/silverash/cn/greeting.mp3',
      },
      {
        dialogue_id: 'dlg_sa_002',
        skin_id: null,
        title: 'Talk 1',
        text_content: 'In Kjerag, we say: the snow leopard does not chase its prey. It waits, calculates, and strikes once — with finality.',
        audio_url_jp: '/assets/audio/operator/silverash/jp/talk_1.mp3',
        audio_url_en: '/assets/audio/operator/silverash/en/talk_1.mp3',
        audio_url_cn: '/assets/audio/operator/silverash/cn/talk_1.mp3',
      },
      {
        dialogue_id: 'dlg_sa_003',
        skin_id: null,
        title: 'Battle Start',
        text_content: 'The battlefield is just another negotiation table.',
        audio_url_jp: '/assets/audio/operator/silverash/jp/battle_start.mp3',
        audio_url_en: '/assets/audio/operator/silverash/en/battle_start.mp3',
        audio_url_cn: '/assets/audio/operator/silverash/cn/battle_start.mp3',
      },
    ],

    records: [],
  },
];

// ─── Helper: Map ID to full object ─────────────────────────────────────────
export const getClassById = (id) => OPERATOR_CLASSES.find(c => c.id === id) || null;
export const getSubClassById = (id) => OPERATOR_SUBCLASSES.find(sc => sc.id === id) || null;
export const getFactionById = (id) => FACTIONS.find(f => f.id === id) || null;
export const getOperatorById = (id) => MOCK_OPERATORS.find(op => op.operator_id === id) || null;

/**
 * Get dialogues for a specific operator, optionally filtered by skin.
 * If skinId is null, returns default (non-skin-specific) dialogues.
 * If skinId is provided, returns dialogues for that skin.
 */
export const getDialoguesBySkin = (operator, skinId) => {
  if (!operator?.dialogues) return [];
  if (skinId === null || skinId === undefined) {
    return operator.dialogues.filter(d => d.skin_id === null);
  }
  // Show skin-specific dialogues; fall back to default for titles not overridden
  const skinDialogues = operator.dialogues.filter(d => d.skin_id === skinId);
  const defaultDialogues = operator.dialogues.filter(d => d.skin_id === null);
  
  const skinTitles = new Set(skinDialogues.map(d => d.title));
  const merged = [
    ...skinDialogues,
    ...defaultDialogues.filter(d => !skinTitles.has(d.title)),
  ];
  return merged;
};

/**
 * Check if a skin has its own unique dialogues (for showing the Skin selector in Tab 3).
 */
export const getSkinsWithDialogues = (operator) => {
  if (!operator?.dialogues || !operator?.skins) return [];
  const skinIdsWithDialogues = new Set(
    operator.dialogues.filter(d => d.skin_id !== null).map(d => d.skin_id)
  );
  // Always include default
  return [
    { skin_id: null, name: 'Default' },
    ...operator.skins.filter(s => skinIdsWithDialogues.has(s.skin_id) && !s.is_default),
  ];
};
