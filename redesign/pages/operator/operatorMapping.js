// ═══════════════════════════════════════════════════════════════════════════════
// Operator Mappings — Arknights Operator Database
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Classes ────────────────────────────────────────────────────────────────
export const CLASSES = [
  { id: 'guard', name: 'Guard', icon: '/assets/images/icon/class/Guard.png' },
  { id: 'sniper', name: 'Sniper', icon: '/assets/images/icon/class/Sniper.png' },
  { id: 'caster', name: 'Caster', icon: '/assets/images/icon/class/Caster.png' },
  { id: 'medic', name: 'Medic', icon: '/assets/images/icon/class/Medic.png' },
  { id: 'defender', name: 'Defender', icon: '/assets/images/icon/class/Defender.png' },
  { id: 'supporter', name: 'Supporter', icon: '/assets/images/icon/class/Supporter.png' },
  { id: 'vanguard', name: 'Vanguard', icon: '/assets/images/icon/class/Vanguard.png' },
  { id: 'specialist', name: 'Specialist', icon: '/assets/images/icon/class/Specialist.png' },
]

export const CLASSES_MAP = CLASSES.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

// ─── Subclasses ─────────────────────────────────────────────────────────────
export const SUBCLASSES = [
  {
    id: 'lord',
    name: 'Lord',
    classId: 'guard',
    description: 'Can attack aerial enemies. Has extended attack range when skill is active.',
    icon: '/assets/images/icon/class/Lord_Guard.png'
  },
  {
    id: 'marksman',
    name: 'Marksman',
    classId: 'sniper',
    description: 'Prioritizes attacking aerial enemies. Low DP cost.',
    icon: '/assets/images/icon/class/Marksman_Sniper.png'
  },
  {
    id: 'corecaster',
    name: 'Core Caster',
    classId: 'caster',
    description: 'Deals Arts damage to a single target. Standard Caster archetype.',
    icon: '/assets/images/icon/class/Core_Caster.png'
  },
  {
    id: 'incantationmedic',
    name: 'Incantation Medic',
    classId: 'medic',
    description: 'Heals allies and attacks enemies simultaneously using Mon3tr. Multi-functional tactical medic.',
    icon: '/assets/images/icon/class/Incantation_Medic.png'
  }
]

export const SUBCLASSES_MAP = SUBCLASSES.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

// ─── Factions ───────────────────────────────────────────────────────────────
export const FACTIONS = [
  // Parent Factions / Nations
  { id: 'rhodes_island', name: 'Rhodes Island', icon: '/assets/images/icon/factions/Rhodes_Island.png' },
  { id: 'karlan', name: 'Karlan', icon: '/assets/images/icon/factions/Kjerag.png' },
  { id: 'yan', name: 'Yan', icon: '/assets/images/icon/factions/Yan.png' },
  { id: 'victoria', name: 'Victoria', icon: '/assets/images/icon/factions/Victoria.png' },
  { id: 'ursus', name: 'Ursus', icon: '/assets/images/icon/factions/Ursus.png' },
  { id: 'aegir', name: 'Aegir', icon: '/assets/images/icon/factions/Aegir.png' },
  { id: 'laterano', name: 'Laterano', icon: '/assets/images/icon/factions/Laterano.png' },
  { id: 'siracusa', name: 'Siracusa', icon: '/assets/images/icon/factions/Siracusa.png' },
  { id: 'babel', name: 'Babel', icon: '/assets/images/icon/factions/Babel.png' },

  // Subfactions
  { id: 'karlan_trade', name: 'Karlan Trade', parentId: 'karlan', icon: '/assets/images/icon/factions/Karlan_Trade.png' },
  { id: 'penguin_logistics', name: 'Penguin Logistics', parentId: 'yan', icon: '/assets/images/icon/factions/Penguin_Logistics.png' },
  { id: 'glasgow', name: 'Glasgow Gang', parentId: 'victoria', icon: '/assets/images/icon/factions/Glasgow.png' },
  { id: 'lungmen', name: 'Lungmen Guard', parentId: 'yan', icon: '/assets/images/icon/factions/Lungmen.png' },
  { id: 'ursus_students', name: 'Ursus Student Self-Governing Group', parentId: 'ursus', icon: '/assets/images/icon/factions/Ursus_Student_Self-Governing_Group.png' },
  { id: 'abyssal_hunters', name: 'Abyssal Hunters', parentId: 'aegir', icon: '/assets/images/icon/factions/Abyssal_Hunters.png' },
]

export const FACTIONS_MAP = FACTIONS.reduce((acc, item) => {
  acc[item.id] = item
  return acc
}, {})

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
