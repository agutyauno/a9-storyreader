import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, ArrowLeft, Save, Trash2, Settings, X, Upload } from 'lucide-react';
import { SupabaseAPI } from '../../services/supabaseApi';
import { getAssetUrl } from '../../utils/assetUtils';
import styles from './OperatorManager.module.css';

// ─── Asset Path Prefixes ──────────────────────────────────────────────────
const ASSET_PREFIXES = {
  portrait: '/images/operators_images/',
  icon: '/images/icons/',
  module: '/images/modules/',
  audio: '/audio/dialogue/',
};

// ─── Asset Path Input Component ───────────────────────────────────────────
function AssetPathInput({ prefix, value, onChange, placeholder }) {
  const fileInputRef = React.useRef(null);

  // value can be string or object { file, path, preview }
  const currentPath = typeof value === 'object' ? value?.path : value;
  const displayValue = currentPath?.startsWith(prefix) ? currentPath.slice(prefix.length) : (currentPath || '');

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fullPath = prefix + file.name;
    const preview = URL.createObjectURL(file);
    onChange({ file, path: fullPath, preview });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.assetUploadWrapper}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleUpload} 
      />
      <button 
        type="button" 
        className={styles.assetUploadBtn} 
        onClick={() => fileInputRef.current?.click()}
        title="Chọn ảnh/file từ máy tính"
      >
        <Upload size={14} />
        <span className={styles.assetFilename}>
          {displayValue || 'Chưa có file (hoặc chọn file mới)'}
        </span>
      </button>
    </div>
  );
}

// ─── Editable Accordion ───────────────────────────────────────────────────
function EditableAccordion({ title, iconUrl, children, defaultOpen = false, onRemove }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.accordionItem}>
      <div className={styles.accordionHeader} onClick={() => setOpen(!open)}>
        {iconUrl && <img src={getAssetUrl(iconUrl)} alt="" className={styles.accordionIcon} />}
        <span className={styles.accordionTitle}>{title || 'Untitled'}</span>
        {onRemove && (
          <button
            className={styles.btnIcon}
            onClick={e => { e.stopPropagation(); onRemove(); }}
            title="Xoá"
            style={{ marginRight: 4 }}
          >
            <Trash2 size={14} />
          </button>
        )}
        <span className={`${styles.accordionChevron} ${open ? styles.open : ''}`}>▼</span>
      </div>
      {open && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
}

// ─── Metadata Popup (Inline create Faction/Class/Subclass) ──────────────────
function MetadataPopup({ type, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [parentClassId, setParentClassId] = useState('');
  const [saving, setSaving] = useState(false);

  const labels = {
    faction: { title: 'Thêm Faction', namePlaceholder: 'VD: Rhodes Island' },
    class: { title: 'Thêm Class', namePlaceholder: 'VD: Guard' },
    subclass: { title: 'Thêm Sub-class', namePlaceholder: 'VD: Liberator' },
  };
  const label = labels[type] || labels.faction;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let created;
      const payload = { name: name.trim(), icon_url: iconUrl || null };
      if (type === 'faction') {
        created = await SupabaseAPI.createFaction(payload);
      } else if (type === 'class') {
        created = await SupabaseAPI.createOperatorClass(payload);
      } else if (type === 'subclass') {
        created = await SupabaseAPI.createOperatorSubclass({ ...payload, class_id: parseInt(parentClassId) || null });
      }
      onCreated?.(created);
      onClose();
    } catch (err) {
      console.error('Failed to create metadata:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popup} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>
          <h4 className={styles.popupTitle}>{label.title}</h4>
          <button className={styles.btnIcon} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tên</label>
          <input className={styles.formInput} value={name} onChange={e => setName(e.target.value)} placeholder={label.namePlaceholder} autoFocus />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Icon</label>
          <AssetPathInput prefix={ASSET_PREFIXES.icon} value={iconUrl} onChange={setIconUrl} placeholder="icon_name.png" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button className={styles.btnSecondary} onClick={onClose}>Huỷ</button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving || !name.trim()}>
            <Save size={14} /> {saving ? 'Đang lưu...' : 'Tạo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW — Operator Grid
// ═══════════════════════════════════════════════════════════════════════════
function OperatorDashboard({ operators, classes, factions, onSelect, onCreate, loading }) {
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterFaction, setFilterFaction] = useState('');

  const filtered = useMemo(() => {
    return operators.filter(op => {
      if (search && !op.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterClass && op.class_id !== parseInt(filterClass)) return false;
      if (filterFaction && !op._factionIds?.includes(parseInt(filterFaction))) return false;
      return true;
    });
  }, [operators, search, filterClass, filterFaction]);

  return (
    <div className={styles.inner}>
      <div className={styles.dashHeader}>
        <h1 className={styles.dashTitle}>Operator Database</h1>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <input
          type="text"
          className={styles.searchBar}
          placeholder="Tìm kiếm Operator..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={styles.filterSelect} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">Tất cả Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={styles.filterSelect} value={filterFaction} onChange={e => setFilterFaction(e.target.value)}>
          <option value="">Tất cả Faction</option>
          {factions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className={styles.emptyState}>Đang tải dữ liệu...</div>
      ) : (
        <div className={styles.operatorGrid}>
          {/* Add New Card */}
          <button className={styles.addCard} onClick={onCreate}>
            <Plus size={32} />
            <span>Thêm Operator</span>
          </button>

          {filtered.map(op => {
            const cls = classes.find(c => c.id === op.class_id);
            return (
              <button key={op.operator_id} className={styles.operatorCard} onClick={() => onSelect(op)}>
                <img
                  src={getAssetUrl(op.avatar_url || '/assets/images/character/blank.png')}
                  alt={op.name}
                  className={styles.cardAvatar}
                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = getAssetUrl('/assets/images/character/blank.png'); }}
                />
                <p className={styles.cardName}>{op.name || 'Unnamed'}</p>
                <div className={styles.cardMeta}>
                  {cls?.icon_url && <img src={getAssetUrl(cls.icon_url)} alt={cls.name} className={styles.cardMetaIcon} title={cls.name} />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: General Info + Combat
// ═══════════════════════════════════════════════════════════════════════════
function TabGeneralEditor({ form, setField, classes, subclasses, factions, allFactions, onMetadataRefresh }) {
  const [metaPopup, setMetaPopup] = useState(null); // 'faction' | 'class' | 'subclass' | null
  const [selectedSkinIdx, setSelectedSkinIdx] = useState(0);
  const skins = form.skins || [];
  const currentSkin = skins[selectedSkinIdx];
  const displayImage = currentSkin?.image_url || form.avatar_url || '/assets/images/character/blank.png';
  const skills = form.combat_info?.skills || [];
  const talents = form.combat_info?.talents || [];
  const modules = form.combat_info?.modules || [];

  const updateCombatArray = (key, index, field, value) => {
    const arr = [...(form.combat_info?.[key] || [])];
    arr[index] = { ...arr[index], [field]: value };
    setField('combat_info', { ...form.combat_info, [key]: arr });
  };

  const addCombatItem = (key, template) => {
    const arr = [...(form.combat_info?.[key] || []), template];
    setField('combat_info', { ...form.combat_info, [key]: arr });
  };

  const removeCombatItem = (key, index) => {
    const arr = (form.combat_info?.[key] || []).filter((_, i) => i !== index);
    setField('combat_info', { ...form.combat_info, [key]: arr });
  };

  return (
    <div>
      {/* ── Skin Visualizer ────────────────────────────────────── */}
      <div className={styles.skinVisualizer}>
        <div className={styles.skinImageWrapper}>
          <img
            src={getAssetUrl(displayImage)}
            alt={form.name}
            className={styles.skinImage}
            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = getAssetUrl('/assets/images/character/blank.png'); }}
          />
          {skins.length > 1 && (
            <div className={styles.skinSelector}>
              {skins.map((skin, idx) => (
                <button
                  key={skin.skin_id || idx}
                  className={`${styles.skinBtn} ${idx === selectedSkinIdx ? styles.active : ''}`}
                  onClick={() => setSelectedSkinIdx(idx)}
                  type="button"
                >
                  {skin.name || `Skin ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.skinInfoPanel}>
          {/* Name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tên Operator</label>
            <input className={styles.formInput} value={form.name || ''} onChange={e => setField('name', e.target.value)} placeholder="VD: Amiya" />
          </div>

          {/* Codename & Rarity */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Codename (ID)</label>
              <input className={styles.formInput} value={form.codename || ''} onChange={e => setField('codename', e.target.value)} placeholder="VD: char_002_amiya" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Rarity (1-6)</label>
              <input className={styles.formInput} type="number" min="1" max="6" value={form.rarity || ''} onChange={e => setField('rarity', parseInt(e.target.value) || null)} />
            </div>
          </div>

          {/* Class & Subclass */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Class</label>
              <div className={styles.selectWithAdd}>
                <select className={styles.formSelect} value={form.class_id || ''} onChange={e => setField('class_id', parseInt(e.target.value) || null)}>
                  <option value="">-- Chọn Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className={styles.btnIcon} onClick={() => setMetaPopup('class')} title="Thêm Class mới" type="button"><Plus size={16} /></button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sub-Class</label>
              <div className={styles.selectWithAdd}>
                <select className={styles.formSelect} value={form.subclass_id || ''} onChange={e => setField('subclass_id', parseInt(e.target.value) || null)}>
                  <option value="">-- Chọn Sub-class --</option>
                  {subclasses.filter(sc => !form.class_id || sc.class_id === form.class_id).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                </select>
                <button className={styles.btnIcon} onClick={() => setMetaPopup('subclass')} title="Thêm Sub-class mới" type="button"><Plus size={16} /></button>
              </div>
            </div>
          </div>

          {/* Factions */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Factions</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {allFactions.map(f => {
                const selected = factions.includes(f.id);
                return (
                  <button
                    key={f.id}
                    className={`${styles.skinBtn} ${selected ? styles.active : ''}`}
                    onClick={() => {
                      const next = selected ? factions.filter(id => id !== f.id) : [...factions, f.id];
                      setField('_factionIds', next);
                    }}
                    type="button"
                  >
                    {f.name}
                  </button>
                );
              })}
              <button className={styles.btnIcon} onClick={() => setMetaPopup('faction')} title="Thêm Faction mới" type="button"><Plus size={16} /></button>
            </div>
          </div>

          {/* Avatar URL */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Avatar / Portrait</label>
            <AssetPathInput prefix={ASSET_PREFIXES.portrait} value={form.avatar_url || ''} onChange={v => setField('avatar_url', v)} placeholder="amiya_default.png" />
          </div>
        </div>
      </div>

      {/* ── Skills ──────────────────────────────────────────────── */}
      <div className={styles.accordion}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Skills</h3>
          <button className={styles.btnSecondary} onClick={() => addCombatItem('skills', { id: `skill_${Date.now()}`, name: '', description: '', icon: '' })}>
            <Plus size={14} /> Thêm Skill
          </button>
        </div>
        {skills.map((skill, i) => (
          <EditableAccordion key={skill.id || i} title={`Skill ${i + 1}: ${skill.name || '...'}`} iconUrl={skill.icon} defaultOpen={false} onRemove={() => removeCombatItem('skills', i)}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên Skill</label>
                <input className={styles.formInput} value={skill.name || ''} onChange={e => updateCombatArray('skills', i, 'name', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Icon</label>
                <AssetPathInput prefix={ASSET_PREFIXES.icon} value={skill.icon || ''} onChange={v => updateCombatArray('skills', i, 'icon', v)} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mô tả</label>
              <textarea className={styles.formTextarea} value={skill.description || ''} onChange={e => updateCombatArray('skills', i, 'description', e.target.value)} rows={3} />
            </div>
          </EditableAccordion>
        ))}
      </div>

      {/* ── Talents ─────────────────────────────────────────────── */}
      <div className={styles.accordion}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Talents</h3>
          <button className={styles.btnSecondary} onClick={() => addCombatItem('talents', { name: '', description: '' })}>
            <Plus size={14} /> Thêm Talent
          </button>
        </div>
        {talents.map((talent, i) => (
          <EditableAccordion key={i} title={talent.name || 'Talent...'} defaultOpen={true} onRemove={() => removeCombatItem('talents', i)}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tên Talent</label>
              <input className={styles.formInput} value={talent.name || ''} onChange={e => updateCombatArray('talents', i, 'name', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mô tả</label>
              <textarea className={styles.formTextarea} value={talent.description || ''} onChange={e => updateCombatArray('talents', i, 'description', e.target.value)} rows={2} />
            </div>
          </EditableAccordion>
        ))}
      </div>

      {/* ── Modules ─────────────────────────────────────────────── */}
      <div className={styles.accordion}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Modules</h3>
          <button className={styles.btnSecondary} onClick={() => addCombatItem('modules', { id: `mod_${Date.now()}`, name: '', description: '', icon: '', image_url: '', story: '' })}>
            <Plus size={14} /> Thêm Module
          </button>
        </div>
        {modules.map((mod, i) => (
          <EditableAccordion key={mod.id || i} title={mod.name || 'Module...'} iconUrl={mod.icon} defaultOpen={false} onRemove={() => removeCombatItem('modules', i)}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên Module</label>
                <input className={styles.formInput} value={mod.name || ''} onChange={e => updateCombatArray('modules', i, 'name', e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Icon</label>
                <AssetPathInput prefix={ASSET_PREFIXES.icon} value={mod.icon || ''} onChange={v => updateCombatArray('modules', i, 'icon', v)} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hình ảnh Module</label>
              <AssetPathInput prefix={ASSET_PREFIXES.module} value={mod.image_url || ''} onChange={v => updateCombatArray('modules', i, 'image_url', v)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mô tả hiệu ứng</label>
              <textarea className={styles.formTextarea} value={mod.description || ''} onChange={e => updateCombatArray('modules', i, 'description', e.target.value)} rows={2} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Câu chuyện Module</label>
              <textarea className={styles.formTextarea} value={mod.story || ''} onChange={e => updateCombatArray('modules', i, 'story', e.target.value)} rows={4} />
            </div>
          </EditableAccordion>
        ))}
      </div>

      {/* ── Skins Management ─────────────────────────────────────── */}
      <div className={styles.accordion}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Skins</h3>
          <button className={styles.btnSecondary} onClick={() => {
            const newSkins = [...skins, { skin_id: `skin_${Date.now()}`, name: '', image_url: '', description: '' }];
            setField('skins', newSkins);
          }}>
            <Plus size={14} /> Thêm Skin
          </button>
        </div>
        {skins.map((skin, i) => (
          <EditableAccordion key={skin.skin_id || i} title={skin.name || `Skin ${i + 1}`} defaultOpen={false} onRemove={() => {
            setField('skins', skins.filter((_, idx) => idx !== i));
            if (selectedSkinIdx >= skins.length - 1) setSelectedSkinIdx(Math.max(0, skins.length - 2));
          }}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên Skin</label>
                <input className={styles.formInput} value={skin.name || ''} onChange={e => {
                  const arr = [...skins]; arr[i] = { ...arr[i], name: e.target.value }; setField('skins', arr);
                }} placeholder="VD: Elite 2" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hình ảnh</label>
                <AssetPathInput prefix={ASSET_PREFIXES.portrait} value={skin.image_url || ''} onChange={v => {
                  const arr = [...skins]; arr[i] = { ...arr[i], image_url: v }; setField('skins', arr);
                }} placeholder="amiya_e2.png" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mô tả Skin</label>
              <textarea className={styles.formTextarea} value={skin.description || ''} onChange={e => {
                const arr = [...skins]; arr[i] = { ...arr[i], description: e.target.value }; setField('skins', arr);
              }} rows={2} placeholder="Mô tả skin..." />
            </div>
          </EditableAccordion>
        ))}
      </div>

      {/* ── Metadata Popup ─────────────────────────────────────── */}
      {metaPopup && (
        <MetadataPopup
          type={metaPopup}
          onClose={() => setMetaPopup(null)}
          onCreated={() => { setMetaPopup(null); onMetadataRefresh?.(); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Profiles (Hồ sơ)
// ═══════════════════════════════════════════════════════════════════════════
function TabProfileEditor({ form, setField }) {
  const profiles = form.lore_info?.profiles || [];

  const updateProfile = (index, field, value) => {
    const arr = [...profiles];
    arr[index] = { ...arr[index], [field]: value };
    setField('lore_info', { ...form.lore_info, profiles: arr });
  };

  const addProfile = () => {
    const arr = [...profiles, { title: '', content: '' }];
    setField('lore_info', { ...form.lore_info, profiles: arr });
  };

  const removeProfile = (index) => {
    const arr = profiles.filter((_, i) => i !== index);
    setField('lore_info', { ...form.lore_info, profiles: arr });
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Hồ sơ Operator</h3>
        <button className={styles.btnSecondary} onClick={addProfile}>
          <Plus size={14} /> Thêm mục
        </button>
      </div>
      {profiles.length === 0 ? (
        <div className={styles.emptyState}>Chưa có thông tin hồ sơ. Bấm "Thêm mục" để bắt đầu.</div>
      ) : (
        <div className={styles.accordion}>
          {profiles.map((profile, i) => (
            <EditableAccordion key={i} title={profile.title || 'Mục mới...'} defaultOpen={i === profiles.length - 1} onRemove={() => removeProfile(i)}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tiêu đề</label>
                <input className={styles.formInput} value={profile.title || ''} onChange={e => updateProfile(i, 'title', e.target.value)} placeholder="VD: Hồ sơ y tế" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nội dung</label>
                <textarea className={styles.formTextarea} value={profile.content || ''} onChange={e => updateProfile(i, 'content', e.target.value)} rows={6} placeholder="Nhập nội dung hồ sơ..." />
              </div>
            </EditableAccordion>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: Dialogues (Thoại)
// ═══════════════════════════════════════════════════════════════════════════
function TabDialogueEditor({ form, setField, operatorId }) {
  const dialogues = form.dialogues || [];

  const addDialogue = () => {
    setField('dialogues', [...dialogues, {
      _isNew: true,
      _tempId: Date.now(),
      operator_id: operatorId,
      title: '',
      text_content: '',
      audio_url_jp: '',
      audio_url_en: '',
      audio_url_cn: '',
    }]);
  };

  const updateDialogue = (index, field, value) => {
    const arr = [...dialogues];
    arr[index] = { ...arr[index], [field]: value };
    setField('dialogues', arr);
  };

  const removeDialogue = (index) => {
    const dlg = dialogues[index];
    if (dlg.dialogue_id && !dlg._isNew) {
      if (!window.confirm('Thoại này sẽ bị xoá khỏi hệ thống. Tiếp tục?')) return;
      SupabaseAPI.deleteOperatorDialogue(dlg.dialogue_id).catch(console.error);
    }
    setField('dialogues', dialogues.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Voice Lines</h3>
        <button className={styles.btnSecondary} onClick={addDialogue}>
          <Plus size={14} /> Thêm thoại
        </button>
      </div>

      {dialogues.length === 0 ? (
        <div className={styles.emptyState}>Chưa có dữ liệu thoại.</div>
      ) : (
        <div className={styles.accordion}>
          {dialogues.map((dlg, i) => (
            <EditableAccordion
              key={dlg.dialogue_id || dlg._tempId}
              title={dlg.title || 'Câu thoại mới...'}
              defaultOpen={!!dlg._isNew}
              onRemove={() => removeDialogue(i)}
            >
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tiêu đề thoại</label>
                <input className={styles.formInput} value={dlg.title || ''} onChange={e => updateDialogue(i, 'title', e.target.value)} placeholder="VD: Greeting" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nội dung</label>
                <textarea className={styles.formTextarea} value={dlg.text_content || ''} onChange={e => updateDialogue(i, 'text_content', e.target.value)} rows={3} />
              </div>
              <div className={styles.formRowThree}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Audio JP</label>
                  <AssetPathInput prefix={ASSET_PREFIXES.audio} value={dlg.audio_url_jp || ''} onChange={v => updateDialogue(i, 'audio_url_jp', v)} placeholder="amiya_greeting_jp.mp3" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Audio EN</label>
                  <AssetPathInput prefix={ASSET_PREFIXES.audio} value={dlg.audio_url_en || ''} onChange={v => updateDialogue(i, 'audio_url_en', v)} placeholder="amiya_greeting_en.mp3" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Audio CN</label>
                  <AssetPathInput prefix={ASSET_PREFIXES.audio} value={dlg.audio_url_cn || ''} onChange={v => updateDialogue(i, 'audio_url_cn', v)} placeholder="amiya_greeting_cn.mp3" />
                </div>
              </div>
            </EditableAccordion>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDITOR VIEW — Mirrors Reader's OperatorDetailPage
// ═══════════════════════════════════════════════════════════════════════════
const EDITOR_TABS = [
  { key: 'general', label: 'Thông tin' },
  { key: 'profiles', label: 'Hồ Sơ' },
  { key: 'dialogues', label: 'Thoại' },
];

function OperatorEditor({ operator, classes, subclasses, factions, onBack, onSave, onDelete, showNotification, onMetadataRefresh }) {
  const isNew = !operator?.operator_id;
  const [form, setForm] = useState(() => ({
    name: '',
    codename: '',
    rarity: null,
    class_id: null,
    subclass_id: null,
    avatar_url: '',
    combat_info: { skills: [], talents: [], modules: [], operator_token: null },
    lore_info: { profiles: [] },
    _factionIds: [],
    dialogues: [],
    skins: [],
    ...operator,
  }));
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load Dialogues and Skins on mount
  useEffect(() => {
    if (operator?.operator_id && !dataLoaded) {
      Promise.all([
        SupabaseAPI.getOperatorDialogues(operator.operator_id),
        SupabaseAPI.getOperatorSkins(operator.operator_id)
      ])
        .then(([dlgs, sks]) => {
          setForm(prev => ({ ...prev, dialogues: dlgs, skins: sks }));
          setDataLoaded(true);
        })
        .catch(err => console.error("Could not load attached data", err));
    }
  }, [operator?.operator_id, dataLoaded]);

  const setField = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const uploadPendingAssets = async (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (obj.file instanceof File && typeof obj.path === 'string') {
      let success = false;
      let attempts = 0;
      while (!success && attempts < 3) {
        try {
          attempts++;
          await SupabaseAPI.uploadAssetToGithub(obj.file, obj.path);
          success = true;
        } catch (err) {
          console.error(`Upload error for ${obj.path} (Attempt ${attempts}):`, err);
          if (attempts >= 3) throw new Error(`Lỗi tải lên file ${obj.file.name}`);
        }
      }
      return obj.path; // Replace object with path string
    }

    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => uploadPendingAssets(item)));
    }

    const result = { ...obj };
    for (const key of Object.keys(result)) {
      if (result[key] && typeof result[key] === 'object') {
        result[key] = await uploadPendingAssets(result[key]);
      }
    }
    return result;
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      showNotification?.('Tên Operator không được để trống', 'error');
      return;
    }
    setSaving(true);
    try {
      // Nhánh 1: Scan toàn bộ form để tìm các đối tượng file chưa upload và upload chúng
      const formWithUploadedAssets = await uploadPendingAssets(form);

      // Nhánh 2: Chuẩn bị payload tĩnh
      const { _factionIds, _isNew, dialogues, skins, ...payload } = formWithUploadedAssets;
      
      // Gọi lên Manager để lưu Operator
      const savedOpId = await onSave(payload, _factionIds);

      // Nhánh 3: Lưu Dialogues mới/chỉnh sửa
      if (dialogues && savedOpId) {
        for (const dlg of dialogues) {
          const dlgPayload = {
            operator_id: savedOpId,
            title: dlg.title,
            text_content: dlg.text_content,
            audio_url_jp: dlg.audio_url_jp,
            audio_url_en: dlg.audio_url_en,
            audio_url_cn: dlg.audio_url_cn,
            skin_id: dlg.skin_id || null,
          };
          if (dlg._isNew) {
            await SupabaseAPI.createOperatorDialogue(dlgPayload);
          } else {
            await SupabaseAPI.updateOperatorDialogue(dlg.dialogue_id, dlgPayload);
          }
        }
      }

      // Nhánh 4: Lưu Skins
      if (skins && savedOpId) {
        for (const skin of skins) {
          const skinPayload = {
            operator_id: savedOpId,
            name: skin.name,
            image_url: skin.image_url,
            description: skin.description,
          };
          if (!skin.skin_id || String(skin.skin_id).startsWith('skin_')) {
            await SupabaseAPI.createOperatorSkin(skinPayload);
          } else {
            await SupabaseAPI.updateOperatorSkin(skin.skin_id, skinPayload);
          }
        }
      }

      showNotification?.('Đã lưu dữ liệu thành công!');
    } catch (err) {
      showNotification?.(`Lỗi lưu dữ liệu: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xoá Operator này?')) return;
    try {
      await onDelete(operator.operator_id);
      showNotification?.('Đã xoá Operator');
    } catch (err) {
      showNotification?.(`Lỗi: ${err.message}`, 'error');
    }
  };

  const cls = classes.find(c => c.id === form.class_id);
  const opFactions = factions.filter(f => form._factionIds?.includes(f.id));

  return (
    <div className={styles.editorInner}>
      {/* Back */}
      <button className={styles.backLink} onClick={onBack}>← Quay lại danh sách Operator</button>

      {/* Header */}
      <div className={styles.detailHeader}>
        <img
          src={getAssetUrl(form.avatar_url || '/assets/images/character/blank.png')}
          alt={form.name}
          className={styles.detailAvatar}
          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = getAssetUrl('/assets/images/character/blank.png'); }}
        />
        <div className={styles.detailHeaderInfo}>
          <h1 className={styles.detailName}>{form.name || (isNew ? 'Operator mới' : 'Unnamed')}</h1>
          <div className={styles.detailBadges}>
            {cls && (
              <span className={styles.badge}>
                {cls.icon_url && <img src={getAssetUrl(cls.icon_url)} alt="" className={styles.badgeIcon} />}
                {cls.name}
              </span>
            )}
            {opFactions.map(f => (
              <span key={f.id} className={styles.badge}>
                {f.icon_url && <img src={getAssetUrl(f.icon_url)} alt="" className={styles.badgeIcon} />}
                {f.name}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
          {!isNew && (
            <button className={styles.btnDanger} onClick={handleDelete}>
              <Trash2 size={14} /> Xoá
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        {EDITOR_TABS.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'general' && (
          <TabGeneralEditor
            form={form}
            setField={setField}
            classes={classes}
            subclasses={subclasses}
            factions={form._factionIds || []}
            allFactions={factions}
            onMetadataRefresh={onMetadataRefresh}
          />
        )}
        {activeTab === 'profiles' && (
          <TabProfileEditor form={form} setField={setField} />
        )}
        {activeTab === 'dialogues' && (
          <TabDialogueEditor form={form} setField={setField} operatorId={operator?.operator_id} />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: OperatorManager
// ═══════════════════════════════════════════════════════════════════════════
export default function OperatorManager({ showNotification }) {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'editor'
  const [selectedOperator, setSelectedOperator] = useState(null);

  // Data
  const [operators, setOperators] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subclasses, setSubclasses] = useState([]);
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all metadata
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ops, cls, sub, fac] = await Promise.all([
        SupabaseAPI.getOperators(),
        SupabaseAPI.getOperatorClasses(),
        SupabaseAPI.getOperatorSubclasses(),
        SupabaseAPI.getFactions(),
      ]);
      setOperators(ops);
      setClasses(cls);
      setSubclasses(sub);
      setFactions(fac);
    } catch (err) {
      console.error('Failed to load operator data:', err);
      showNotification?.('Lỗi tải dữ liệu Operator', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Handlers
  const handleSelectOperator = async (op) => {
    // Load factions for this operator
    try {
      const opFactions = await SupabaseAPI.getOperatorFactions(op.operator_id);
      setSelectedOperator({ ...op, _factionIds: opFactions.map(f => f.id) });
      setView('editor');
    } catch {
      setSelectedOperator({ ...op, _factionIds: [] });
      setView('editor');
    }
  };

  const handleCreateNew = () => {
    setSelectedOperator({ _isNew: true, _factionIds: [] });
    setView('editor');
  };

  const handleSave = async (payload, factionIds) => {
    if (selectedOperator?._isNew) {
      const created = await SupabaseAPI.createOperator(payload);
      if (factionIds?.length) {
        await SupabaseAPI.setOperatorFactions(created.operator_id, factionIds);
      }
      setSelectedOperator({ ...created, _factionIds: factionIds || [] });
    } else {
      const updated = await SupabaseAPI.updateOperator(payload.operator_id, payload);
      await SupabaseAPI.setOperatorFactions(payload.operator_id, factionIds || []);
      setSelectedOperator({ ...updated, _factionIds: factionIds || [] });
    }
    await loadData(); // Refresh list
  };

  const handleDelete = async (operatorId) => {
    await SupabaseAPI.deleteOperator(operatorId);
    setView('dashboard');
    setSelectedOperator(null);
    await loadData();
  };

  const handleBack = () => {
    setView('dashboard');
    setSelectedOperator(null);
  };

  // Render
  if (view === 'editor') {
    return (
      <div className={styles.manager}>
        <OperatorEditor
          operator={selectedOperator}
          classes={classes}
          subclasses={subclasses}
          factions={factions}
          onBack={handleBack}
          onSave={handleSave}
          onDelete={handleDelete}
          showNotification={showNotification}
          onMetadataRefresh={loadData}
        />
      </div>
    );
  }

  return (
    <div className={styles.manager}>
      <OperatorDashboard
        operators={operators}
        classes={classes}
        factions={factions}
        onSelect={handleSelectOperator}
        onCreate={handleCreateNew}
        loading={loading}
      />
    </div>
  );
}
