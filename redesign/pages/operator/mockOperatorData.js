// ═══════════════════════════════════════════════════════════════════════════════
// Mock Operator Data — Arknights Operator Database
// Hardcoded placeholder data for UI development. Replace with API calls later.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Factions ────────────────────────────────────────────────────────────────
export const FACTIONS = [
  { id: 'rhodes_island', name: 'Rhodes Island' },
  { id: 'karlan', name: 'Karlan Trade' },
  { id: 'penguin_logistics', name: 'Penguin Logistics' },
  { id: 'babel', name: 'Babel' },
  { id: 'glasgow', name: 'Glasgow' },
  { id: 'lungmen', name: 'Lungmen Guard' },
  { id: 'ursus', name: 'Ursus Student Self-Governing Group' },
  { id: 'abyssal_hunters', name: 'Abyssal Hunters' },
]

// ─── Classes ────────────────────────────────────────────────────────────────
export const CLASSES = [
  { id: 'guard', name: 'Guard' },
  { id: 'sniper', name: 'Sniper' },
  { id: 'caster', name: 'Caster' },
  { id: 'medic', name: 'Medic' },
  { id: 'defender', name: 'Defender' },
  { id: 'supporter', name: 'Supporter' },
  { id: 'vanguard', name: 'Vanguard' },
  { id: 'specialist', name: 'Specialist' },
]

// ─── Operator Data ──────────────────────────────────────────────────────────
export const MOCK_OPERATORS = [
  // ═════════════════════════════════════════════════════════════════════════
  // SILVERASH — 6★ Guard (Ranged Guard)
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: 'char_silverash',
    name: 'SilverAsh',
    appellation: 'SilverAsh',
    rarity: 6,
    position: 'Melee',
    tagList: ['DPS', 'Support'],
    faction: { id: 'karlan', name: 'Karlan Trade' },
    class: { id: 'guard', name: 'Guard' },
    subclass: { 
      id: 'rangedguard', 
      name: 'Lord', 
      description: 'Can attack aerial enemies. Has extended attack range when skill is active.' 
    },

    portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_172_svrash_1.png',
    
    skins: [
      { 
        id: 'default', 
        name: 'Default', 
        portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_172_svrash_1.png',
        description: 'Standard uniform.' 
      },
      { 
        id: 'epoque_1', 
        name: 'Époque - Shining Steps', 
        portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_172_svrash_epoque%231.png',
        description: '"The snow may fall endlessly, but Kjerag\'s heir strides forward with a dancer\'s grace."' 
      },
    ],

    stats: {
      hp: 3069,
      atk: 862,
      def: 394,
      res: 0,
      redeployTime: '70s',
      dpCost: 24,
      block: 2,
      attackInterval: '1.3s',
    },

    talents: [
      { 
        name: 'Leader', 
        description: 'When deployed, all allies gain ATK +6%. If SilverAsh is in the squad but not deployed, all allies gain ATK +3%.' 
      },
      {
        name: 'Eagle Eye',
        description: 'Increases the attack range of all ranged allies in the squad by +0.2 tiles.'
      }
    ],

    skills: [
      {
        name: 'Power Strike γ',
        icon: null,
        duration: 'Instant',
        spCost: 4,
        initialSp: 0,
        activationType: 'auto',
        spRecoveryType: 'auto',
        description: 'The next attack deals 290% ATK as Physical damage.',
      },
      {
        name: 'Slash Range Extension',
        icon: null,
        duration: '30s',
        spCost: 30,
        initialSp: 15,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'Attack range expands. ATK +80%. Attack speed -30.',
      },
      {
        name: 'Truesilver Slash',
        icon: null,
        duration: '25s',
        spCost: 90,
        initialSp: 70,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'Attack range greatly expands, ATK +200%, attacks deal Physical damage to all enemies in range. Can hit aerial units.',
      },
    ],

    modules: [
      {
        name: 'LORD Module',
        icon: null,
        imageUrl: '/assets/images/module/silverash_module.png',
        lore: 'Một thanh gươm chống gậy tùy chỉnh có độ chính xác cao được cấp cho người đứng đầu Karlan Trade. Lưỡi kiếm được rèn từ các hợp kim quý hiếm có khả năng chịu được nhiệt độ cực lạnh của Kjerag, và bao kiếm được tích hợp bộ truyền phát vi mô để trực tiếp điều hành các đội quân tiên phong.',
        description: 'Lord-class operators gain extended attack range. When enemies enter range, gain +15% ATK for the first 10 seconds.',
        stats: { atk: 55, def: 25 },
        skillDescription: 'Leader talent effect increased: all allies ATK +10% when deployed.',
      },
    ],

    baseSkills: [
      { name: 'Karlan Pragmatism', icon: null, description: 'When assigned to the Trading Post, order acquisition efficiency +30%.' },
      { name: 'Kjerag Supply', icon: null, description: 'When assigned to the Trading Post, increases the efficiency of precious metal orders by +45%.' },
    ],

    token: null,

    profiles: [
      { title: 'Basic Info', content: 'Code Name: SilverAsh\nGender: Male\nCombat Experience: 7 Years\nPlace of Birth: Kjerag\nDate of Birth: July 1\nRace: Feline\nHeight: 192cm\nInfection Status: Non-infected' },
      { title: 'Physical Exam', content: 'Imaging tests have shown the outlines of his internal organs to be clear, with no abnormal shadows present. Noiteite particles present in the circulatory system, cell originiite-Loss test was normal, confirming the operator to be non-infected.' },
      { title: 'Profile', content: 'Enciodes Silverash is the current head of the Silverash clan in Kjerag. He is a politician, a businessman, and a strategist. After the death of his parents, he took on the responsibility of managing the vast Karlan Trade network while simultaneously maneuvering to consolidate his influence over the tri-clan political landscape of Kjerag. He brought his two younger sisters under the protection of Rhodes Island to ensure their safety while he carries out his grand plans.' },
      { title: 'Archive File 1', content: 'SilverAsh maintains a courteous and diplomatic demeanor at all times, but beneath that exterior lies a calculating mind that never ceases to plan several moves ahead. He has been described as "the most dangerous person in Kjerag" by many who have dealt with him, including the Saintess Pramanix herself.' },
      { title: 'Archive File 2', content: 'The Silverash clan has long been one of the three great clans of Kjerag, wielding economic influence through the sprawling Karlan Trade network. Under Enciodes\' leadership, Karlan Trade has expanded beyond Kjerag\'s borders, establishing connections with Columbia, Victoria, and even Laterano. His ultimate goal remains the modernization and opening of Kjerag to the outside world — a vision not shared by all his compatriots.' },
      { title: 'Archive File 3', content: 'Despite his pragmatic nature, SilverAsh cares deeply for his sisters Pramanix and Cliffheart. His decision to send them to Rhodes Island, while partly strategic, was born from a genuine desire to protect them from the political machinations that surround the Silverash name in Kjerag.' },
    ],

    dialogues: [
      { 
        title: 'Appointed as Assistant', 
        content: 'Doctor, you called for me? Good. I have a number of issues I\'d like to discuss with you as well.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 1', 
        content: 'The scenery here reminds me of Kjerag sometimes. The mountain wind, the scent of pine... But here, I can let my guard down, if only slightly.',
        skinVariants: {
          'epoque_1': 'Every step on the dance floor is a calculated move, Doctor. Not unlike the political stage, wouldn\'t you say?'
        },
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 2', 
        content: 'My sisters are doing well, I hope? Rhodes Island has been good to them. For that, you have my gratitude — and my continued cooperation.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 3', 
        content: 'A leader does not ask others to make sacrifices he himself is unwilling to endure. That is the principle I was raised on, and one I intend to uphold.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk after Promotion 1', 
        content: 'You wish to know more about Kjerag? Very well. Ask, and I shall tell you what I can. Some secrets, however, are best left buried in the snow.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk after Promotion 2', 
        content: 'I won\'t pretend that our alliance is purely altruistic, Doctor. But I believe our interests are aligned — and that is a stronger foundation than any oath.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Title Drop', 
        content: 'Arknights.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Greeting', 
        content: 'Good day, Doctor. Shall we review today\'s strategy?',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Deployed (Battle)', 
        content: 'SilverAsh, deploying.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Skill Activated (Battle)', 
        content: 'Truesilver Slash!',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Defeated (Battle)', 
        content: 'Not yet... Kjerag still needs me...',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
    ],

    records: [
      { id: 'rec_sa_01', title: 'Kjerag\'s Heir', description: 'A record of SilverAsh\'s ascension to head of the Silverash clan, following the mysterious circumstances of his parents\' deaths.' },
      { id: 'rec_sa_02', title: 'The Three Clans', description: 'An account of the delicate political balance between the Silverash, Browntail, and Paleroches clans, and Enciodes\' efforts to shift it in his favor.' },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════
  // EXUSIAI — 6★ Sniper (Marksman)
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: 'char_exusiai',
    name: 'Exusiai',
    appellation: 'Exusiai',
    rarity: 6,
    position: 'Ranged',
    tagList: ['DPS'],
    faction: { id: 'penguin_logistics', name: 'Penguin Logistics' },
    class: { id: 'sniper', name: 'Sniper' },
    subclass: { 
      id: 'marksman', 
      name: 'Marksman', 
      description: 'Prioritizes attacking aerial enemies. Low DP cost.' 
    },

    portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_103_angel_1.png',
    
    skins: [
      { 
        id: 'default', 
        name: 'Default', 
        portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_103_angel_1.png',
        description: 'Standard uniform.' 
      },
      { 
        id: 'epoque_1', 
        name: 'Époque - Exotic Sweetness', 
        portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_103_angel_epoque%231.png',
        description: '"Sweet things and even sweeter smiles — that\'s what makes the world go round!"' 
      },
    ],

    stats: {
      hp: 1629,
      atk: 626,
      def: 150,
      res: 0,
      redeployTime: '70s',
      dpCost: 13,
      block: 1,
      attackInterval: '1.0s',
    },

    talents: [
      { 
        name: 'Angel\'s Halo', 
        description: 'ATK +8%. When attacking, 20% chance to deal an additional hit dealing 50% ATK as Physical damage.' 
      },
    ],

    skills: [
      {
        name: 'Charging Mode',
        icon: null,
        duration: '25s',
        spCost: 30,
        initialSp: 15,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'ATK +30%. Attack speed +30.',
      },
      {
        name: 'Guns Blazing',
        icon: null,
        duration: '15s',
        spCost: 23,
        initialSp: 8,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'ATK +50%. Fires 3 bullets per attack.',
      },
      {
        name: 'Overloading',
        icon: null,
        duration: '15s',
        spCost: 28,
        initialSp: 15,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'ATK +110%. Fires 5 bullets per attack. After the skill ends, Exusiai is stunned for 3 seconds.',
      },
    ],

    modules: [
      {
        name: 'Marksman Module',
        icon: null,
        imageUrl: '/assets/images/module/exusiai_module.png',
        lore: 'Một khẩu súng tiểu liên Vector được sửa đổi với polymer nhẹ và hộp đạn trống dung lượng lớn tùy chỉnh. Tốc độ bắn của nó đã được tinh chỉnh để đồng bộ hóa hoàn hảo với tốc độ phản ứng thị giác của một Sankta, cho phép Exusiai duy trì hỏa lực áp đảo liên tục.',
        description: 'Marksman-class operators gain +10% ATK when attacking aerial targets.',
        stats: { atk: 40, hp: 100 },
        skillDescription: 'Angel\'s Halo effect increased: additional hit chance 25%, dealing 60% ATK.',
      },
    ],

    baseSkills: [
      { name: 'Penguin Logistics Network', icon: null, description: 'When assigned to the Trading Post, order acquisition efficiency +25%.' },
    ],

    token: null,

    profiles: [
      { title: 'Basic Info', content: 'Code Name: Exusiai\nGender: Female\nCombat Experience: 4 Years\nPlace of Birth: Laterano\nDate of Birth: December 24\nRace: Sankta\nHeight: 159cm\nInfection Status: Non-infected' },
      { title: 'Physical Exam', content: 'All standard values within normal range. Sankta physiology is noted for exceptional regenerative capabilities and an innate connection to Laterano\'s Light. No signs of Oripathy detected.' },
      { title: 'Profile', content: 'Exusiai is a Sankta from the city-state of Laterano, currently operating as a member of Penguin Logistics under Emperor (a penguin). Despite her carefree and cheerful attitude, she is an exceptional marksman capable of wielding multiple firearms with deadly precision. Her connection to Rhodes Island primarily comes through her partnership with Texas and the broader Penguin Logistics operations in Lungmen.' },
      { title: 'Archive File 1', content: 'Exusiai\'s seemingly endless supply of apple pie and cheerful energy masks a sharp tactical mind. She has been described by Emperor as "the fastest trigger in PL," a title she takes more pride in than any formal commendation. Her faith in the Laterano Church remains strong, though her departure from the nation was not without complications.' },
      { title: 'Archive File 2', content: 'The relationship between Exusiai and Mostima is a subject of much speculation among Rhodes Island staff. The two Sankta share a complicated history involving events in Laterano that neither is willing to fully disclose. What is known is that Exusiai\'s departure from Laterano and Mostima\'s subsequent wandering are connected to the same incident.' },
    ],

    dialogues: [
      { 
        title: 'Appointed as Assistant', 
        content: 'Doctor! I brought apple pie! Want some? I made extra just in case~',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 1', 
        content: 'Wanna hear about Penguin Logistics? We\'re the best courier service around! Fast delivery, guaranteed results! ...What? The exploding packages? Those were one-time incidents!',
        skinVariants: {
          'epoque_1': 'This outfit is SO cute, right?! The baker lady at the shop made it for me. She said I\'m her best customer — I wonder why!'
        },
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 2', 
        content: 'Texas doesn\'t smile much, but that\'s okay! I smile enough for both of us! Although she did almost smile when I shared my apple pie with her... almost.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 3', 
        content: 'Laterano? It\'s a beautiful place! Lots of sunshine, great food... I miss it sometimes. But my work is here now, and I\'ve made so many friends!',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Deployed (Battle)', 
        content: 'Bang bang bang!',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Skill Activated (Battle)', 
        content: 'Full burst!',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Defeated (Battle)', 
        content: 'Oww... I need to eat more apple pie to recover...',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
    ],

    records: [
      { id: 'rec_exu_01', title: 'Wings Over Lungmen', description: 'An account of Exusiai\'s first job in Lungmen with Penguin Logistics, and how she earned Emperor\'s trust through a daring aerial delivery.' },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════
  // AMIYA — 5★ Caster (Core Caster)
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: 'char_amiya',
    name: 'Amiya',
    appellation: 'Amiya',
    rarity: 5,
    position: 'Ranged',
    tagList: ['DPS', 'Support'],
    faction: { id: 'rhodes_island', name: 'Rhodes Island' },
    class: { id: 'caster', name: 'Caster' },
    subclass: { 
      id: 'corecaster', 
      name: 'Core Caster', 
      description: 'Deals Arts damage to a single target. Standard Caster archetype.' 
    },

    portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_002_amiya_1.png',
    
    skins: [
      { 
        id: 'default', 
        name: 'Default', 
        portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_002_amiya_1.png',
        description: 'Standard Rhodes Island uniform.' 
      },
      {
        id: 'epoque_1',
        name: 'Anniversary - Newsgirl',
        portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_002_amiya_epoque%231.png',
        description: '"Extra, extra! Rhodes Island Daily — read all about it!"'
      },
    ],

    stats: {
      hp: 1775,
      atk: 676,
      def: 129,
      res: 10,
      redeployTime: '70s',
      dpCost: 21,
      block: 1,
      attackInterval: '1.6s',
    },

    talents: [
      { 
        name: 'Chimera', 
        description: 'ATK +14%. Every 4 attacks, the next attack deals 225% ATK as Arts damage.' 
      },
      {
        name: 'Emotional Absorption',
        description: 'SP recovery rate +0.4/sec. When HP falls below 50%, gain +20 RES for 20 seconds.'
      }
    ],

    skills: [
      {
        name: 'Spirit Burst',
        icon: null,
        duration: '30s',
        spCost: 40,
        initialSp: 15,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'ATK +60%. Attack speed +30. Each attack generates 1 SP.',
      },
      {
        name: 'Chimera\'s Grip',
        icon: null,
        duration: '∞',
        spCost: 80,
        initialSp: 30,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'ATK +130%. Continuously loses HP (4% per second). When skill is active, attacks ignore 20 RES. Skill ends when Amiya retreats or is defeated.',
      },
      {
        name: 'True Black Slash',
        icon: null,
        duration: 'Instant',
        spCost: 10,
        initialSp: 0,
        activationType: 'auto',
        spRecoveryType: 'offensive',
        description: 'The next attack deals 900% ATK as True damage to a single enemy. Amiya retreats after using this skill. [Guard form only]',
      },
    ],

    modules: [],

    baseSkills: [
      { name: 'Rhodes Island Leader', icon: null, description: 'When assigned to the Command Center, morale consumption of all operators in base is reduced by -0.05/hour.' },
    ],

    token: null,

    profiles: [
      { title: 'Basic Info', content: 'Code Name: Amiya\nGender: Female\nCombat Experience: 1 Year\nPlace of Birth: Unknown (Rim Billiton)\nDate of Birth: Unknown\nRace: Cautus (Chimera)\nHeight: 142cm\nInfection Status: Infected' },
      { title: 'Physical Exam', content: 'Amiya\'s Originium Arts aptitude tests show extraordinary results that far exceed normal parameters. Her internal Originium concentrations are abnormally high for her stage of infection, suggesting a unique physiology. Regular monitoring is mandatory.' },
      { title: 'Profile', content: 'Amiya is the leader of Rhodes Island, a pharmaceutical company dedicated to researching and combating the Oripathy infection. Despite her young age, she carries the weight of command with a maturity that belies her years. She was chosen by the previous leader, Theresa — the King of Sarkaz — and has since guided Rhodes Island through numerous crises.' },
      { title: 'Archive File 1', content: 'Amiya possesses an extremely rare and powerful form of Originium Arts tied to her nature as a Chimera. This power, rooted in the legacy of the Sarkaz royalty, grants her abilities that are both feared and revered across Terra. She struggles to control this power, and the Doctor\'s presence seems to help stabilize her emotional and Arts equilibrium.' },
      { title: 'Archive File 2', content: 'The bond between Amiya and the Doctor is the cornerstone of Rhodes Island\'s command structure. Since discovering the Doctor in the Chernobog sarcophagus, Amiya has placed her complete trust in their judgment, even when that trust has been tested by the revelations about the Doctor\'s past and their connection to Babel.' },
      { title: 'Archive File 3', content: '[CLASSIFIED — Level 4 Clearance Required]\nThe rings on Amiya\'s fingers are not mere accessories. They are the Rings of Civilization, artifacts of immense power tied to the history of the Sarkaz people. Through these rings, Amiya channels the will and legacy of previous Sarkaz monarchs. The full extent of their power remains unknown, even to Amiya herself.' },
    ],

    dialogues: [
      { 
        title: 'Appointed as Assistant', 
        content: 'Doctor! I\'ve finished compiling today\'s mission briefings. Shall we go over them together?',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 1', 
        content: 'Even though I\'m the leader of Rhodes Island... sometimes I still feel like a child playing at being grown-up. But then I remember all the people counting on me, and I know I can\'t give up.',
        skinVariants: {
          'epoque_1': 'Read all about it! The Rhodes Island Daily Gazette! ...Hehe, just kidding. But wouldn\'t it be fun to have a newspaper?'
        },
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 2', 
        content: 'Doctor, have you eaten yet? Closure told me you\'ve been working for twelve hours straight again. Please take care of yourself...',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 3', 
        content: 'My dream? It\'s simple, really. A world where no one has to suffer because of Oripathy. Where infected and non-infected can live together in peace. That\'s what Rhodes Island is fighting for.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Deployed (Battle)', 
        content: 'Amiya, engaging!',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Skill Activated (Battle)', 
        content: 'I won\'t let anyone else get hurt!',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Defeated (Battle)', 
        content: 'Doctor... I\'m sorry... I wasn\'t strong enough...',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
    ],

    records: [
      { id: 'rec_amy_01', title: 'Waking the Doctor', description: 'A detailed record of the mission into the Chernobog sarcophagus, where Amiya first found and awakened the Doctor from cryostasis.' },
      { id: 'rec_amy_02', title: 'The Weight of the Crown', description: 'Amiya reflects on her responsibility as the inheritor of the Sarkaz legacy, and the meaning of the rings she carries.' },
      { id: 'rec_amy_03', title: 'Rhodes Island\'s Light', description: 'Accounts from various Rhodes Island operators about Amiya\'s leadership during the Londinium crisis, and the sacrifices she was willing to make.' },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════════
  // KAL'TSIT — 6★ Medic (Multi-target Medic / Summon)
  // ═════════════════════════════════════════════════════════════════════════
  {
    id: 'char_kaltsit',
    name: "Kal'tsit",
    appellation: "Kal'tsit",
    rarity: 6,
    position: 'Ranged',
    tagList: ['Healing', 'Summon', 'Support'],
    faction: { id: 'rhodes_island', name: 'Rhodes Island' },
    class: { id: 'medic', name: 'Medic' },
    subclass: { 
      id: 'incantationmedic', 
      name: 'Incantation Medic', 
      description: 'Heals allies and attacks enemies simultaneously using Mon3tr. Multi-functional tactical medic.' 
    },

    portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_003_kalts_1.png',
    
    skins: [
      { 
        id: 'default', 
        name: 'Default', 
        portraitUrl: 'https://raw.githubusercontent.com/Aceship/Arknight-Images/main/characters/char_003_kalts_1.png',
        description: 'Standard Rhodes Island Director uniform.' 
      },
    ],

    stats: {
      hp: 2178,
      atk: 569,
      def: 190,
      res: 15,
      redeployTime: '70s',
      dpCost: 28,
      block: 1,
      attackInterval: '2.85s',
    },

    talents: [
      { 
        name: 'Regenerative Cells', 
        description: 'Mon3tr gains +20% Max HP and restores 4% of max HP every second.' 
      },
      {
        name: 'Supreme Command',
        description: 'When Mon3tr is deployed, all allies gain DEF +8%. When Mon3tr is not deployed, Kal\'tsit gains ATK +15%.'
      }
    ],

    skills: [
      {
        name: 'Command: Structural Fortification',
        icon: null,
        duration: '∞',
        spCost: 40,
        initialSp: 20,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'Mon3tr gains +100% DEF, Block +1, and a shield equal to 40% of Mon3tr\'s Max HP.',
      },
      {
        name: 'Command: Meltdown',
        icon: null,
        duration: '20s',
        spCost: 25,
        initialSp: 10,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'Mon3tr gains +130% ATK and attacks deal AOE Arts damage to up to 3 enemies. Mon3tr continuously loses 3% Max HP per second.',
      },
      {
        name: 'Command: Tactical Coordination',
        icon: null,
        duration: '30s',
        spCost: 35,
        initialSp: 15,
        activationType: 'manual',
        spRecoveryType: 'auto',
        description: 'Mon3tr gains +80% ATK and +80% DEF. Every 3 attacks, Mon3tr deals True damage equal to 350% of Kal\'tsit\'s ATK to the target.',
      },
    ],

    modules: [
      {
        name: 'Medic Module — Supreme Authority',
        icon: null,
        imageUrl: '/assets/images/module/kaltsit_module.png',
        lore: 'Một bộ dụng cụ y tế cổ xưa, phong hóa chứa các công cụ có trước cả nền văn minh Terran hiện đại. Nó bao gồm các thiết bị phẫu thuật, thuốc thử hóa học chưa biết và một khoang ẩn được liên kết trực tiếp với chất xúc tác thần kinh của Mon3tr.',
        description: 'Incantation Medics gain +8% ATK when healing. Mon3tr\'s redeploy cooldown is reduced by 5 seconds.',
        stats: { atk: 30, hp: 150 },
        skillDescription: 'Regenerative Cells effect enhanced: Mon3tr restores 5% max HP per second.',
      },
    ],

    baseSkills: [
      { name: 'Rhodes Island Overseer', icon: null, description: 'When assigned to the Command Center, all facilities gain +5% productivity.' },
      { name: 'Mon3tr\'s Appetite', icon: null, description: 'When assigned to a Dormitory, restores +0.7 morale per hour to all operators in that dormitory.' },
    ],

    token: {
      name: 'Mon3tr',
      imageUrl: null,
      description: 'Mon3tr is Kal\'tsit\'s companion — a massive, intelligent organism of unknown origin that has accompanied her for as long as anyone can remember. It serves as both a weapon and a shield, capable of independent combat while Kal\'tsit directs operations from behind the front lines.',
    },

    profiles: [
      { title: 'Basic Info', content: 'Code Name: Kal\'tsit\nGender: Female\nCombat Experience: ████████\nPlace of Birth: ████████\nDate of Birth: ████████\nRace: ████████\nHeight: 166cm\nInfection Status: █████████ (Non-infected — suspected)' },
      { title: 'Physical Exam', content: 'Subject has declined all standard medical examinations, citing her own self-administered results as sufficient. Given her position as the Director of Medical Operations and Rhodes Island\'s foremost medical authority, this request has been reluctantly accommodated. Her self-reported results indicate perfect health.' },
      { title: 'Profile', content: 'Dr. Kal\'tsit serves as the Director of Rhodes Island\'s Medical Department and, alongside Amiya, is one of the two de facto leaders of the organization. Her expertise in medicine, biotechnology, and Originium research is unmatched. She is cold, calculating, and brutally pragmatic — traits that have made her both respected and feared within Rhodes Island.' },
      { title: 'Archive File 1', content: 'The true nature of Kal\'tsit\'s relationship with the entity known as Mon3tr remains one of Rhodes Island\'s deepest mysteries. Whether Mon3tr is a pet, a weapon, a symbiote, or something else entirely, no one has been able to determine. Kal\'tsit herself refuses to discuss the matter, deflecting all inquiries with a stare that most operators describe as "the kind that makes you re-evaluate your life choices."' },
      { title: 'Archive File 2', content: 'Kal\'tsit\'s memories appear to span centuries — a fact she neither confirms nor denies. She has been documented in historical records predating the founding of Rhodes Island by hundreds of years, always appearing at pivotal moments in Terra\'s history. Her connection to the previous Sarkaz King, Theresa, and her complicated relationship with the Doctor suggest a story far larger than any single lifetime.' },
      { title: 'Archive File 3', content: '[MAXIMUM CLEARANCE REQUIRED]\nThe Doctor and Kal\'tsit have a shared history that predates Rhodes Island and extends back to the days of Babel. The nature of this history — including a period of deep collaboration followed by a catastrophic betrayal — has shaped the current dynamic between them. Kal\'tsit has stated clearly: "I do not forgive. But I can work alongside those I do not forgive, for the sake of a greater goal."' },
    ],

    dialogues: [
      { 
        title: 'Appointed as Assistant', 
        content: 'Doctor. I trust you have a productive reason for summoning me, and not simply because Amiya asked you to "check in" on me.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 1', 
        content: 'Mon3tr isn\'t a pet, Doctor. It would be wise of you not to attempt to pet it again. The medical bills from your last attempt should serve as sufficient reminder.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 2', 
        content: 'I have dedicated longer than you can imagine to the fight against Oripathy. I will not see that work undone by carelessness, incompetence, or sentimentality.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk 3', 
        content: 'You ask me if I trust you, Doctor? Trust is irrelevant. What matters is whether you can be useful. So far, the answer has been... adequate.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Talk after Promotion 1', 
        content: 'You\'ve regained some of the competence I remember from Babel, Doctor. Don\'t let it go to your head. You still have a very long way to go before I consider you an equal.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Deployed (Battle)', 
        content: 'Mon3tr, deploy.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Skill Activated (Battle)', 
        content: 'Tactical formation. Execute.',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
      { 
        title: 'Defeated (Battle)', 
        content: 'This... is unacceptable...',
        skinVariants: {},
        voiceLines: { JP: null, CN: null, EN: null },
      },
    ],

    records: [
      { id: 'rec_kal_01', title: 'Echoes of Babel', description: 'Fragments of Kal\'tsit\'s memories from the Babel era, including her first meeting with Theresa and the events that led to the founding of Rhodes Island.' },
      { id: 'rec_kal_02', title: 'The Doctor\'s Other Self', description: 'Kal\'tsit\'s private reflections on the Doctor — both who they were before the sarcophagus, and who they have become since.' },
      { id: 'rec_kal_03', title: 'Mon3tr\'s Origin', description: 'A heavily redacted file containing the only known documentation of Mon3tr\'s origin, written in a language that predates all known Terran scripts.' },
    ],
  },
]

// ─── Helper Functions ────────────────────────────────────────────────────────
export function getOperatorById(id) {
  return MOCK_OPERATORS.find(op => op.id === id) || null
}

export function getOperatorsByFaction(factionId) {
  return MOCK_OPERATORS.filter(op => op.faction.id === factionId)
}

export function getOperatorsByClass(classId) {
  return MOCK_OPERATORS.filter(op => op.class.id === classId)
}

export function searchOperators(query) {
  const q = query.toLowerCase().trim()
  if (!q) return MOCK_OPERATORS
  return MOCK_OPERATORS.filter(op =>
    op.name.toLowerCase().includes(q) ||
    op.appellation.toLowerCase().includes(q) ||
    op.faction.name.toLowerCase().includes(q) ||
    op.class.name.toLowerCase().includes(q)
  )
}
