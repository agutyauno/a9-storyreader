import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ChevronRight } from 'lucide-react';
import styles from './EditorHub.module.css';

const MODULES = [
  {
    id: 'game',
    title: 'Game Content',
    description: 'Kịch bản, Khu vực và Sự kiện',
    icon: BookOpen,
    color: 'var(--color-accent-light)',
    path: '/editor/game',
  },
  {
    id: 'operator',
    title: 'Operator Database',
    description: 'Nhân vật, Factions và Classes',
    icon: Users,
    color: '#4ade80',
    path: '/editor/operator',
  },
];

export default function EditorHub() {
  const navigate = useNavigate();

  return (
    <div className={styles.hub}>
      <div className={styles.hubInner}>
        <div className={styles.hubHeader}>
          <h2 className={styles.hubTitle}>Chọn module</h2>
        </div>

        <div className={styles.cardGrid}>
          {MODULES.map(mod => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                className={styles.card}
                onClick={() => navigate(mod.path)}
                style={{ '--card-accent': mod.color }}
              >
                <div className={styles.cardIcon}>
                  <Icon size={20} />
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{mod.title}</h3>
                  <p className={styles.cardDesc}>{mod.description}</p>
                </div>
                <div className={styles.cardArrow}>
                  <ChevronRight size={16} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
