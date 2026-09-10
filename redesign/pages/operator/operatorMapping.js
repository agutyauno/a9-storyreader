// ═══════════════════════════════════════════════════════════════════════════════
// Operator Mappings — Arknights Operator Database
// Complete Classes, Subclasses (Branches), and Factions with Icons and Meta
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Classes ────────────────────────────────────────────────────────────────
export const CLASSES = [
  { id: 'vanguard', name: 'Vanguard', icon: '/assets/images/icon/class/Vanguard.png' },
  { id: 'guard', name: 'Guard', icon: '/assets/images/icon/class/Guard.png' },
  { id: 'defender', name: 'Defender', icon: '/assets/images/icon/class/Defender.png' },
  { id: 'sniper', name: 'Sniper', icon: '/assets/images/icon/class/Sniper.png' },
  { id: 'caster', name: 'Caster', icon: '/assets/images/icon/class/Caster.png' },
  { id: 'medic', name: 'Medic', icon: '/assets/images/icon/class/Medic.png' },
  { id: 'supporter', name: 'Supporter', icon: '/assets/images/icon/class/Supporter.png' },
  { id: 'specialist', name: 'Specialist', icon: '/assets/images/icon/class/Specialist.png' },
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
    name: 'Pioneer',
    classId: 'vanguard',
    description: 'Blocks 2 enemies.',
    icon: '/assets/images/icon/class/Pioneer_Vanguard.png'
  },
  {
    id: 'charger',
    name: 'Charger',
    classId: 'vanguard',
    description: 'Obtain 1 DP after this unit defeats an enemy; Refunds the original DP Cost when retreated',
    icon: '/assets/images/icon/class/Charger_Vanguard.png'
  },
  {
    id: 'standard_bearer',
    name: 'Standard Bearer',
    classId: 'vanguard',
    description: 'Cannot block enemies during the skill duration.',
    icon: '/assets/images/icon/class/Standard_Bearer_Vanguard.png'
  },
  {
    id: 'tactician',
    name: 'Tactician',
    classId: 'vanguard',
    description: 'This unit can designate one Tactical Point within attack range to call Reinforcements; ATK is increased to 150% when attacking enemies blocked by Reinforcements',
    icon: '/assets/images/icon/class/Tactician_Vanguard.png'
  },
  {
    id: 'agent',
    name: 'Agent',
    classId: 'vanguard',
    description: '	Has reduced Redeployment Time, can use ranged attacks',
    icon: '/assets/images/icon/class/Agent_Vanguard.png'
  },
  {
    id: 'strategist',
    name: 'Strategist',
    classId: 'vanguard',
    description: 'Blocks 2 enemies, and can support allies in the Deployment Waiting Zone',
    icon: '/assets/images/icon/class/Strategist_Vanguard.png'
  },

  // ─── Guard ────────────────────────────────────────────────────────────────
  {
    id: 'dreadnought',
    name: 'Dreadnought',
    classId: 'guard',
    description: 'Blocks 1 enemy.',
    icon: '/assets/images/icon/class/Dreadnought_Guard.png'
  },
  {
    id: 'centurion',
    name: 'Centurion',
    classId: 'guard',
    description: 'Attacks all blocked enemies',
    icon: '/assets/images/icon/class/Centurion_Guard.png'
  },
  {
    id: 'lord',
    name: 'Lord',
    classId: 'guard',
    description: 'Can launch Ranged Attacks that deal 80% of normal ATK.',
    icon: '/assets/images/icon/class/Lord_Guard.png'
  },
  {
    id: 'arts_fighter',
    name: 'Arts Fighter',
    classId: 'guard',
    description: 'Deals Arts damage.',
    icon: '/assets/images/icon/class/Arts_Fighter_Guard.png'
  },
  {
    id: 'instructor',
    name: 'Instructor',
    classId: 'guard',
    description: 'Can attack enemies from range; When attacking enemies not blocked by self, increase ATK to 120%',
    icon: '/assets/images/icon/class/Instructor_Guard.png'
  },
  {
    id: 'fighter',
    name: 'Fighter',
    classId: 'guard',
    description: 'Blocks 1 enemy.',
    icon: '/assets/images/icon/class/Fighter_Guard.png'
  },
  {
    id: 'swordmaster',
    name: 'Swordmaster',
    classId: 'guard',
    description: 'Normal attacks deal damage twice.',
    icon: '/assets/images/icon/class/Swordmaster_Guard.png'
  },
  {
    id: 'liberator',
    name: 'Liberator',
    classId: 'guard',
    description: 'Normally does not attack and has 0 Block; When skill is inactive, ATK gradually increases up to +200% over 40 seconds. ATK is reset when the skill ends',
    icon: '/assets/images/icon/class/Liberator_Guard.png'
  },
  {
    id: 'reaper',
    name: 'Reaper',
    classId: 'guard',
    description: 'Cannot be healed by allies; Attacks deal AoE damage; Recovers 50 HP for every enemy hit during attacks, up to Block count',
    icon: '/assets/images/icon/class/Reaper_Guard.png'
  },
  {
    id: 'soloblade',
    name: 'Soloblade',
    classId: 'guard',
    description: 'attacks an enemy. Can\'t be healed by other units. Recovers self HP every time this operator attacks an enemy',
    icon: '/assets/images/icon/class/Soloblade_Guard.png'
  },
  {
    id: 'crusher',
    name: 'Crusher',
    classId: 'guard',
    description: 'Attacks all blocked enemies',
    icon: '/assets/images/icon/class/Crusher_Guard.png'
  },
  {
    id: 'earthshaker',
    name: 'Earthshaker',
    classId: 'guard',
    description: 'Attacks deal 50% ATK as AOE Physical damage to enemies around the target.',
    icon: '/assets/images/icon/class/Earthshaker_Guard.png'
  },
  {
    id: 'mercenary',
    name: 'Mercenary',
    classId: 'guard',
    description: 'Can spend DP to strengthen combat abilities',
    icon: '/assets/images/icon/class/Mercenary_Guard.png'
  },
  {
    id: 'primal_guard',
    name: 'Primal Guard',
    classId: 'guard',
    description: 'Blocks 2 enemies, and can inflict Elemental damage',
    icon: '/assets/images/icon/class/Primal_Guard.png'
  },

  // ─── Defender ─────────────────────────────────────────────────────────────
  {
    id: 'protector',
    name: 'Protector',
    classId: 'defender',
    description: 'Blocks 3 enemies',
    icon: '/assets/images/icon/class/Protector_Defender.png'
  },
  {
    id: 'guardian',
    name: 'Guardian',
    classId: 'defender',
    description: 'Can heal allies by using the skill',
    icon: '/assets/images/icon/class/Guardian_Defender.png'
  },
  {
    id: 'juggernaut',
    name: 'Juggernaut',
    classId: 'defender',
    description: 'Cannot be healed by allies.',
    icon: '/assets/images/icon/class/Juggernaut_Defender.png'
  },
  {
    id: 'arts_protector',
    name: 'Arts Protector',
    classId: 'defender',
    description: 'Normal attacks deal Arts Damage while the skill is active',
    icon: '/assets/images/icon/class/Arts_Protector_Defender.png'
  },
  {
    id: 'duelist',
    name: 'Duelist',
    classId: 'defender',
    description: 'Only restores SP when blocking enemiesS',
    icon: '/assets/images/icon/class/Duelist_Defender.png'
  },
  {
    id: 'fortress',
    name: 'Fortress',
    classId: 'defender',
    description: 'When not blocking enemies, prioritizes dealing ranged AoE Physical damage',
    icon: '/assets/images/icon/class/Fortress_Defender.png'
  },
  {
    id: 'sentry_protector',
    name: 'Sentry Protector',
    classId: 'defender',
    description: 'Blocks 3 enemies and attacks from long range',
    icon: '/assets/images/icon/class/Sentry_Protector_Defender.png'
  },
  {
    id: 'primal_protector',
    name: 'Primal Protector',
    classId: 'defender',
    description: 'Blocks 3 enemies, and can inflict Elemental Injury',
    icon: '/assets/images/icon/class/Primal_Protector_Defender.png'
  },

  // ─── Sniper ───────────────────────────────────────────────────────────────
  {
    id: 'marksman',
    name: 'Marksman',
    classId: 'sniper',
    description: 'Attacks aerial enemies first',
    icon: '/assets/images/icon/class/Marksman_Sniper.png'
  },
  {
    id: 'artilleryman',
    name: 'Artilleryman',
    classId: 'sniper',
    description: 'Deals AOE Physical damage',
    icon: '/assets/images/icon/class/Artilleryman_Sniper.png'
  },
  {
    id: 'deadeye',
    name: 'Deadeye',
    classId: 'sniper',
    description: 'Prioritizes attacking the enemy with lowest DEF within range first',
    icon: '/assets/images/icon/class/Deadeye_Sniper.png'
  },
  {
    id: 'heavyshooter',
    name: 'Heavyshooter',
    classId: 'sniper',
    description: 'High accuracy point-blank shot',
    icon: '/assets/images/icon/class/Heavyshooter_Sniper.png'
  },
  {
    id: 'spreadshooter',
    name: 'Spreadshooter',
    classId: 'sniper',
    description: 'Attacks all enemies within range, and deals 150% damage to enemies in the row directly in front of this unit.',
    icon: '/assets/images/icon/class/Spreadshooter_Sniper.png'
  },
  {
    id: 'besieger',
    name: 'Besieger',
    classId: 'sniper',
    description: 'Attacks the heaviest enemy first',
    icon: '/assets/images/icon/class/Besieger_Sniper.png'
  },
  {
    id: 'flinger',
    name: 'Flinger',
    classId: 'sniper',
    description: 'Attacks deal two instances of Physical damage to ground enemies in a small area (The second instance is a shockwave that has half the normal ATK)',
    icon: '/assets/images/icon/class/Flinger_Sniper.png'
  },
  {
    id: 'hunter',
    name: 'Hunter',
    classId: 'sniper',
    description: 'Attacks consume Ammo to increase ATK; While not attacking, Ammo will be slowly reloaded',
    icon: '/assets/images/icon/class/Hunter_Sniper.png'
  },
  {
    id: 'loopshooter',
    name: 'Loopshooter',
    classId: 'sniper',
    description: 'Can only attack while holding a boomerang projectile (projectile takes time to return)',
    icon: '/assets/images/icon/class/Loopshooter_Sniper.png'
  },
  {
    id: 'skybreaker',
    name: 'Skybreaker',
    classId: 'sniper',
    description: 'Takes off on deployment, and only attacks aerial enemies when in mid-air; on skill activation, descends and deals AOE Physical damage',
    icon: '/assets/images/icon/class/Skybreaker_Sniper.png'
  },

  // ─── Caster ───────────────────────────────────────────────────────────────
  {
    id: 'corecaster',
    name: 'Core Caster',
    classId: 'caster',
    description: 'Deals Arts damage',
    icon: '/assets/images/icon/class/Core_Caster.png'
  },
  {
    id: 'splash_caster',
    name: 'Splash Caster',
    classId: 'caster',
    description: 'Deals AOE Arts damage',
    icon: '/assets/images/icon/class/Splash_Caster.png'
  },
  {
    id: 'mech_accord_caster',
    name: 'Mech-Accord Caster',
    classId: 'caster',
    description: 'Controls a Drone to deal Arts damage to an enemy; When the Drone continuously attacks the same enemy, its damage will increase (up to 110% of the operator\'s ATK)',
    icon: '/assets/images/icon/class/Mech-Accord_Caster.png'
  },
  {
    id: 'phalanx_caster',
    name: 'Phalanx Caster',
    classId: 'caster',
    description: 'Normally does not attack, but has greatly increased DEF and RES; When skill is active, attacks deal AoE Arts damage',
    icon: '/assets/images/icon/class/Phalanx_Caster.png'
  },
  {
    id: 'mystic_caster',
    name: 'Mystic Caster',
    classId: 'caster',
    description: 'Attacks deal Arts damage; When unable to find a target, attacks can be stored up and fired all at once (Up to 3 charges).',
    icon: '/assets/images/icon/class/Mystic_Caster.png'
  },
  {
    id: 'chain_caster',
    name: 'Chain Caster',
    classId: 'caster',
    description: 'Attacks deal Arts damage and jump between 4 enemies. Each jump deals 15% less damage and inflicts a brief Slow',
    icon: '/assets/images/icon/class/Chain_Caster.png'
  },
  {
    id: 'blast_caster',
    name: 'Blast Caster',
    classId: 'caster',
    description: 'Deals AOE Arts damage in a long line',
    icon: '/assets/images/icon/class/Blast_Caster.png'
  },
  {
    id: 'primal_caster',
    name: 'Primal Caster',
    classId: 'caster',
    description: 'Attacks deal Arts damage, and can inflict Elemental damage',
    icon: '/assets/images/icon/class/Primal_Caster.png'
  },
  {
    id: 'shaper_caster',
    name: 'Shaper Caster',
    classId: 'caster',
    description: 'Deals Arts Damage; Can create Summons by defeating enemies, and can attack enemies blocked by these Summons',
    icon: '/assets/images/icon/class/Shaper_Caster.png'
  },

  // ─── Medic ────────────────────────────────────────────────────────────────
  {
    id: 'medic',
    name: 'Medic',
    classId: 'medic',
    description: 'Restores the HP of allies',
    icon: '/assets/images/icon/class/Medic_Medic.png'
  },
  {
    id: 'multitarget_medic',
    name: 'Multi-target Medic',
    classId: 'medic',
    description: 'Restores the HP of 3 allies simultaneously',
    icon: '/assets/images/icon/class/Multi-target_Medic.png'
  },
  {
    id: 'therapist',
    name: 'Therapist',
    classId: 'medic',
    description: 'Has a large healing range, but the healing amount on farther targets is reduced to 80%',
    icon: '/assets/images/icon/class/Therapist_Medic.png'
  },
  {
    id: 'wandering_medic',
    name: 'Wandering Medic',
    classId: 'medic',
    description: 'Restores the HP of allied units and recovers Elemental Injury by 50% of ATK (can recover Elemental Injury of unhurt allied units)',
    icon: '/assets/images/icon/class/Wandering_Medic.png'
  },
  {
    id: 'incantationmedic',
    name: 'Incantation Medic',
    classId: 'medic',
    description: 'Attacks deal Arts damage and heal the HP of an ally within Attack Range for 50% of the damage dealt',
    icon: '/assets/images/icon/class/Incantation_Medic.png'
  },
  {
    id: 'chain_medic',
    name: 'Chain Medic',
    classId: 'medic',
    description: 'Restores HP of allies, bouncing between 3 allies. Healing reduced by 25% per bounce.',
    icon: '/assets/images/icon/class/Chain_Medic.png'
  },
  {
    id: 'watchman_medic',
    name: 'Watchman Medic',
    classId: 'medic',
    description: 'Restores the HP of allies, and can Take Off',
    icon: '/assets/images/icon/class/Watchman_Medic.png'
  },

  // ─── Supporter ────────────────────────────────────────────────────────────
  {
    id: 'decel_binder',
    name: 'Decel Binder',
    classId: 'supporter',
    description: 'Deals Arts damage and Slows the target for a short time',
    icon: '/assets/images/icon/class/Decel_Binder_Supporter.png'
  },
  {
    id: 'hexer',
    name: 'Hexer',
    classId: 'supporter',
    description: 'Deals Arts damage',
    icon: '/assets/images/icon/class/Hexer_Supporter.png'
  },
  {
    id: 'summoner',
    name: 'Summoner',
    classId: 'supporter',
    description: 'Deals Arts damage, Can use Summons in battles',
    icon: '/assets/images/icon/class/Summoner_Supporter.png'
  },
  {
    id: 'bard',
    name: 'Bard',
    classId: 'supporter',
    description: 'Does not attack but continuously restores the HP of all allies within range (the HP restored per second is equal to 10% of self ATK). Self is unaffected by Inspiration',
    icon: '/assets/images/icon/class/Bard_Supporter.png'
  },
  {
    id: 'abjurer',
    name: 'Abjurer',
    classId: 'supporter',
    description: 'Deals Arts damage; When skill is active, attacks instead restore the HP of allies (heal amount is equal to 75% of ATK)',
    icon: '/assets/images/icon/class/Abjurer_Supporter.png'
  },
  {
    id: 'artificer',
    name: 'Artificer',
    classId: 'supporter',
    description: 'Blocks 2 enemies; Can use <Support Devices> in battles',
    icon: '/assets/images/icon/class/Artificer_Supporter.png'
  },
  {
    id: 'ritualist',
    name: 'Ritualist',
    classId: 'supporter',
    description: 'Attacks deal Arts damage, and can inflict Elemental Injury',
    icon: '/assets/images/icon/class/Ritualist_Supporter.png'
  },

  // ─── Specialist ───────────────────────────────────────────────────────────
  {
    id: 'executor',
    name: 'Executor',
    classId: 'specialist',
    description: 'Significantly reduced Redeployment Time',
    icon: '/assets/images/icon/class/Executor_Specialist.png'
  },
  {
    id: 'merchant',
    name: 'Merchant',
    classId: 'specialist',
    description: 'Has reduced Redeployment Time, but DP Cost is not refunded upon retreating; While deployed, 3 DP are consumed every 3 seconds (automatically retreats without sufficient DP)',
    icon: '/assets/images/icon/class/Merchant_Specialist.png'
  },
  {
    id: 'hookmaster',
    name: 'Hookmaster',
    classId: 'specialist',
    description: 'Can Shift enemies by using skills, can be deployed on Ranged Tiles',
    icon: '/assets/images/icon/class/Hookmaster_Specialist.png'
  },
  {
    id: 'push_stroker',
    name: 'Push Stroker',
    classId: 'specialist',
    description: 'Can attack all blocked enemies, can be deployed on Ranged Tiles',
    icon: '/assets/images/icon/class/Push_Stroker_Specialist.png'
  },
  {
    id: 'ambusher',
    name: 'Ambusher',
    classId: 'specialist',
    description: 'Deals Damage to all targets within range, 50% chance to dodge Physical and Arts attacks and is less likely to be targeted by enemies',
    icon: '/assets/images/icon/class/Ambusher_Specialist.png'
  },
  {
    id: 'dollkeeper',
    name: 'Dollkeeper',
    classId: 'specialist',
    description: 'Does not retreat upon receiving lethal damage, instead swaps to a <Substitute> (Substitute has 0 Block). Swaps back to the original after 20 seconds',
    icon: '/assets/images/icon/class/Dollkeeper_Specialist.png'
  },
  {
    id: 'geek',
    name: 'Geek',
    classId: 'specialist',
    description: 'Continually loses HP over time',
    icon: '/assets/images/icon/class/Geek_Specialist.png'
  },
  {
    id: 'trapmaster',
    name: 'Trapmaster',
    classId: 'specialist',
    description: 'Can use traps to assist in combat, but traps cannot be placed on tiles already occupied by an enemy',
    icon: '/assets/images/icon/class/Trapmaster_Specialist.png'
  },
  {
    id: 'alchemist',
    name: 'Alchemist',
    classId: 'specialist',
    description: 'Can throw Alchemical Units to assist in combat',
    icon: '/assets/images/icon/class/Alchemist_Specialist.png'
  },
  {
    id: 'skyranger',
    name: 'Skyranger',
    classId: 'specialist',
    description: 'After Taking Off, can block 2 flying enemies',
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

// Explicit backward-compatible & alternative aliases
if (SUBCLASSES_MAP['corecaster']) {
  SUBCLASSES_MAP['core_caster'] = SUBCLASSES_MAP['corecaster']
}
if (SUBCLASSES_MAP['incantationmedic']) {
  SUBCLASSES_MAP['incantation_medic'] = SUBCLASSES_MAP['incantationmedic']
}
if (SUBCLASSES_MAP['multitarget_medic']) {
  SUBCLASSES_MAP['multi_target_medic'] = SUBCLASSES_MAP['multitarget_medic']
  SUBCLASSES_MAP['multi-target_medic'] = SUBCLASSES_MAP['multitarget_medic']
  SUBCLASSES_MAP['multitargetmedic'] = SUBCLASSES_MAP['multitarget_medic']
}
if (SUBCLASSES_MAP['mech_accord_caster']) {
  SUBCLASSES_MAP['mech-accord_caster'] = SUBCLASSES_MAP['mech_accord_caster']
  SUBCLASSES_MAP['mechaccord_caster'] = SUBCLASSES_MAP['mech_accord_caster']
  SUBCLASSES_MAP['mechaccord'] = SUBCLASSES_MAP['mech_accord_caster']
}
if (SUBCLASSES_MAP['standard_bearer']) {
  SUBCLASSES_MAP['standardbearer'] = SUBCLASSES_MAP['standard_bearer']
}

// ─── Factions ───────────────────────────────────────────────────────────────
export const FACTIONS = [
  // ─── Parent Factions / Nations ────────────────────────────────────────────
  { id: 'rhodes_island', name: 'Rhodes Island', icon: '/assets/images/icon/factions/Rhodes_Island.png' },
  { id: 'yan', name: 'Yan', icon: '/assets/images/icon/factions/Yan.png' },
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
  { id: 'elite_op', name: 'Elite Operator', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Elite_Op.png' },
  { id: 'sweep', name: 'S.W.E.E.P.', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/S.W.E.E.P.png' },
  { id: 'op_reserve_a1', name: 'Op Reserve Team A1', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Op_Reserve_A1.png' },
  { id: 'op_reserve_a4', name: 'Op Reserve Team A4', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Op_Reserve_A4.png' },
  { id: 'op_reserve_a6', name: 'Op Reserve Team A6', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Op_Reserve_A6.png' },
  { id: 'op_a4', name: 'Op Team A4', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Op_A4.png' },
  { id: 'followers', name: 'Followers', parentId: 'rhodes_island', icon: '/assets/images/icon/factions/Followers.png' },

  // Yan
  { id: 'lungmen', name: 'Lungmen', parentId: 'yan', icon: '/assets/images/icon/factions/Lungmen.png' },
  { id: 'lungmen_guard', name: 'Lungmen Guard Department', parentId: 'yan', icon: '/assets/images/icon/factions/Lungmen_Guard_Department.png' },
  { id: 'penguin_logistics', name: 'Penguin Logistics', parentId: 'yan', icon: '/assets/images/icon/factions/Penguin_Logistics.png' },
  { id: 'lee_detective', name: "Lee's Detective Agency", parentId: 'yan', icon: "/assets/images/icon/factions/Lee's_Detective_Agency.png" },
  { id: 'sui', name: 'Sui', parentId: 'yan', icon: '/assets/images/icon/factions/Sui.png' },

  // Victoria
  { id: 'glasgow', name: 'Glasgow Gang', parentId: 'victoria', icon: '/assets/images/icon/factions/Glasgow.png' },
  { id: 'tara', name: 'Tara / Dublinn', parentId: 'victoria', icon: '/assets/images/icon/factions/Tara.png' },

  // Ursus
  { id: 'ursus_students', name: 'Ursus Student Self-Governing Group', parentId: 'ursus', icon: '/assets/images/icon/factions/Ursus_Student_Self-Governing_Group.png' },

  // Columbia
  { id: 'rhine_lab', name: 'Rhine Lab', parentId: 'columbia', icon: '/assets/images/icon/factions/Rhine_Lab.png' },
  { id: 'blacksteel', name: 'Blacksteel Worldwide', parentId: 'columbia', icon: '/assets/images/icon/factions/Blacksteel.png' },

  // Kazimierz
  { id: 'pinus_sylvestris', name: 'Pinus Sylvestris', parentId: 'kazimierz', icon: '/assets/images/icon/factions/Pinus_Sylvestris.png' },

  // Kjerag
  { id: 'karlan_trade', name: 'Karlan Trade', parentId: 'kjerag', icon: '/assets/images/icon/factions/Karlan_Trade.png' },

  // Aegir
  { id: 'abyssal_hunters', name: 'Abyssal Hunters', parentId: 'aegir', icon: '/assets/images/icon/factions/Abyssal_Hunters.png' },
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
