/**
 * ============================================================
 *  MOCK DATABASE
 * ============================================================
 * Mirrors the Supabase DB schema for local development/testing.
 * Each key corresponds to a Supabase table.
 *
 * TO SWITCH TO SUPABASE: set USE_MOCK_DB = false in supabaseApi.js
 * ============================================================
 */
export const mockDatabase = {
  // ─── regions ────────────────────────────────────────────────────────────────
  regions: [
    { region_id: 'region_1', name: 'Rhodes Island', description: 'The mobile city-state Rhodes Island', icon_url: '/assets/images/icon/main_story.png', display_order: 1 },
    { region_id: 'region_2', name: 'Lungmen', description: 'The prosperous mobile city of Lungmen', icon_url: '', display_order: 2 },
    { region_id: 'region_3', name: 'Kazdel', description: 'The ancient land of the Sarkaz', icon_url: '', display_order: 3 }
  ],

  // ─── arcs ───────────────────────────────────────────────────────────────────
  arcs: [
    { arc_id: 'arc_1', region_id: 'region_1', name: 'Main Theme', description: 'The main storyline of Rhodes Island', display_order: 1 },
    { arc_id: 'arc_2', region_id: 'region_1', name: 'Side Stories', description: 'Stories of individual operators', display_order: 2 },
    { arc_id: 'arc_3', region_id: 'region_2', name: 'Lungmen Downtown', description: 'Events in Lungmen city center', display_order: 1 },
    { arc_id: 'arc_4', region_id: 'region_3', name: 'Babel Memories', description: 'History of the Kazdel civil war', display_order: 1 }
  ],

  // ─── events ─────────────────────────────────────────────────────────────────
  events: [
    { event_id: 'event_1', arc_id: 'arc_1', name: 'Awakening', description: 'The Doctor awakens from cryosleep', image_url: '/assets/images/art gallery/Amiya_Awakening.png', display_order: 1 },
    { event_id: 'event_2', arc_id: 'arc_1', name: 'Escape from Chernobog', description: 'Rhodes Island team escapes the fallen city', image_url: '/assets/images/art gallery/Amiya_Awakening.png', display_order: 2 },
    { event_id: 'event_3', arc_id: 'arc_2', name: 'Operator Records', description: 'Personal stories of operators', image_url: '', display_order: 1 },
    { event_id: 'event_4', arc_id: 'arc_3', name: 'City Incident', description: 'A crisis in the heart of Lungmen', image_url: '', display_order: 1 },
    { event_id: 'event_5', arc_id: 'arc_4', name: 'Darknights Memoir', description: "W's story during the civil war", image_url: '/assets/images/art gallery/Amiya_Awakening.png', display_order: 1 }
  ],

  // ─── stories ────────────────────────────────────────────────────────────────
  stories: [
    {
      story_id: 'story_1',
      event_id: 'event_1',
      name: 'Prologue - Awakening',
      description: 'The Doctor awakens from a long sleep aboard Rhodes Island.',
      display_order: 1,
      story_content: {
        characters: {
          'doctor': { avatar: '/assets/images/character/doctor/doctor_avatar.png', full_image: '/assets/images/character/doctor/doctor.png' },
          'hibiscus': { avatar: '/assets/images/character/hibiscus/hibiscus_avatar.webp', full_image: '/assets/images/character/hibiscus/hibiscus.png' }
        },
        sections: [
          {
            type: 'dialogue_section',
            elements: [
              {
                type: 'background',
                image: '/assets/images/art gallery/Amiya_Awakening.png',
                bgm: { id: 'bgm_1', intro: '/assets/audio/bgm/music_act15d0d0_m_avg_tense_intro.wav', loop: '/assets/audio/bgm/m_avg_tense_loop.wav' },
                dialogues: [
                  { type: 'dialogue', left: 'doctor', right: '', name: 'Doctor', text: 'Đây là đâu? Ký ức của tôi hoàn toàn trống rỗng...' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!' },
                  { type: 'sfx', src: '/assets/audio/sfx/avg_d_avg_glass_break.wav', name: 'Glass break' },
                  { type: 'decision', group_id: 'decision_1', left: 'doctor', right: 'hibiscus', choices: ['Cô là ai?', 'Rhode Island là gì?'] },
                  { type: 'choice_response', group_id: 'decision_1', choice_value: '1', left: 'doctor', right: 'hibiscus', name: 'Doctor', text: 'Cô là ai? Trông cô rất quen...' },
                  { type: 'choice_response', group_id: 'decision_1', choice_value: '2', left: 'doctor', right: 'hibiscus', name: 'Doctor', text: 'Rhode Island — đó là trụ sở nào vậy?' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                ]
              },
              {
                type: 'background',
                image: '/assets/images/art gallery/Amiya_Awakening.png',
                bgm: { id: '', intro: '', loop: '' },
                dialogues: [
                  { type: 'dialogue', left: 'doctor', right: '', name: 'Doctor', text: 'Đây là đâu? Ký ức của tôi hoàn toàn trống rỗng...' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!' },
                  { type: 'sfx', src: '/assets/audio/sfx/avg_d_avg_glass_break.wav', name: 'Glass break' },
                  { type: 'decision', group_id: 'decision_1', left: 'doctor', right: 'hibiscus', choices: ['Cô là ai?', 'Rhode Island là gì?'] },
                  { type: 'choice_response', group_id: 'decision_1', choice_value: '1', left: 'doctor', right: 'hibiscus', name: 'Doctor', text: 'Cô là ai? Trông cô rất quen...' },
                  { type: 'choice_response', group_id: 'decision_1', choice_value: '2', left: 'doctor', right: 'hibiscus', name: 'Doctor', text: 'Rhode Island — đó là trụ sở nào vậy?' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                  { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                ]
              },
              { type: 'video', _asset_id: 'vid_pv', src: '/assets/videos/ak_chap10_pv.mp4' }
            ]
          }
        ]
      }
    },
    {
      story_id: 'story_2',
      event_id: 'event_1',
      name: 'second Mission',
      description: 'Meeting the operators for the second time.',
      display_order: 2,
      story_content: {
        characters: {}, sections: [{
          type: 'dialogue_section',
          elements: [
            {
              type: 'background',
              image: '/assets/images/art gallery/Amiya_Awakening.png',
              bgm: { id: '', intro: '', loop: '' },
              dialogues: [
                { type: 'dialogue', left: 'doctor', right: '', name: 'Doctor', text: 'Đây là đâu? Ký ức của tôi hoàn toàn trống rỗng...' },
                { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!' },
                { type: 'sfx', src: '/assets/audio/sfx/avg_d_avg_glass_break.wav', name: 'Glass break' },
                { type: 'decision', group_id: 'decision_1', left: 'doctor', right: 'hibiscus', choices: ['Cô là ai?', 'Rhode Island là gì?'] },
                { type: 'choice_response', group_id: 'decision_1', choice_value: '1', left: 'doctor', right: 'hibiscus', name: 'Doctor', text: 'Cô là ai? Trông cô rất quen...' },
                { type: 'choice_response', group_id: 'decision_1', choice_value: '2', left: 'doctor', right: 'hibiscus', name: 'Doctor', text: 'Rhode Island — đó là trụ sở nào vậy?' },
                { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
                { type: 'dialogue', left: '', right: 'hibiscus', name: 'Hibiscus', text: 'Bác sĩ, không cần vội. Chúng ta có thể từ từ nói chuyện.' },
              ]
            },]
        }]
      }
    },
    {
      story_id: 'story_3',
      event_id: 'event_2',
      name: 'Escape Plan',
      description: 'Planning the escape from Chernobog.',
      display_order: 1,
      story_content: { characters: {}, sections: [] }
    },
    {
      story_id: 'story_4',
      event_id: 'event_3',
      name: 'Amiya - Leader',
      description: "Amiya's path as a leader.",
      display_order: 1,
      story_content: { characters: {}, sections: [] }
    },
    {
      story_id: 'story_5',
      event_id: 'event_4',
      name: 'Arrival at Lungmen',
      description: 'The team arrives at Lungmen.',
      display_order: 1,
      story_content: { characters: {}, sections: [] }
    },
    {
      story_id: 'story_6',
      event_id: 'event_5',
      name: 'The Mercenary',
      description: "W joins Babel.",
      display_order: 1,
      story_content: { characters: {}, sections: [] }
    }
  ],

  // ─── characters ─────────────────────────────────────────────────────────────
  characters: [
    { character_id: 'char_doctor', name: 'Doctor', description: 'The player character' },
    { character_id: 'char_hibiscus', name: 'Hibiscus', description: 'Medic operator' },
    { character_id: 'char_amiya', name: 'Amiya', description: 'Leader of Rhodes Island' },
    { character_id: 'char_w', name: 'W', description: 'Sarkaz Mercenary' }
  ],

  // ─── character_expressions (note: intentional typo from DB) ──────────────────
  character_expressions: [
    // Doctor
    { id: 1, character_id: 'char_doctor', name: 'default', avatar_url: '/assets/images/character/doctor/doctor_avatar.png', full_url: '/assets/images/character/doctor/doctor.png' },
    // Hibiscus
    { id: 2, character_id: 'char_hibiscus', name: 'default', avatar_url: '/assets/images/character/hibiscus/hibiscus_avatar.webp', full_url: '/assets/images/character/hibiscus/hibiscus.png' },
    // Amiya
    { id: 3, character_id: 'char_amiya', name: 'default', avatar_url: '/assets/images/character/avg_npc_417/avg_npc_417_avatar.webp', full_url: '/assets/images/character/avg_npc_417/avg_npc_417.png' },
    { id: 4, character_id: 'char_amiya', name: 'happy', avatar_url: '/assets/images/character/avg_npc_417/avg_npc_417_avatar.webp', full_url: '/assets/images/character/avg_npc_417/avg_npc_417.png' },
    { id: 5, character_id: 'char_amiya', name: 'sad', avatar_url: '/assets/images/character/avg_npc_417/avg_npc_417_avatar.webp', full_url: '/assets/images/character/avg_npc_417/avg_npc_417.png' }
  ],

  // ─── assets ─────────────────────────────────────────────────────────────────
  assets: [
    // Background
    { asset_id: 'bg_amiya_awake', type: 'image', category: 'background', name: 'Amiya Awakening', url: '/assets/images/art gallery/Amiya_Awakening.png' },

    // Gallery
    { asset_id: 'gallery_amiya', type: 'image', category: 'gallery', name: 'Amiya Art', url: '/assets/images/art gallery/Amiya_Awakening.png' },

    // BGM
    { asset_id: 'bgm_tense', type: 'audio', category: 'bgm', name: 'Tense Loop', url: '/assets/audio/bgm/m_avg_tense_loop.wav' },
    { asset_id: 'bgm_intro', type: 'audio', category: 'bgm', name: 'Tense Intro', url: '/assets/audio/bgm/music_act15d0d0_m_avg_tense_intro.wav' },
    { asset_id: 'bgm_jealous_intro', type: 'audio', category: 'bgm', name: 'Jealous Intro', url: '/assets/audio/bgm/music_act15d0d0_m_avg_jealous_intro.wav' },

    // SFX
    { asset_id: 'sfx_applause', type: 'audio', category: 'sfx', name: 'Applause', url: '/assets/audio/sfx/avg_d_avg_applause.wav' },
    { asset_id: 'sfx_audience_chaos', type: 'audio', category: 'sfx', name: 'Audience Chaos', url: '/assets/audio/sfx/avg_d_avg_audience_chaos.wav' },
    { asset_id: 'sfx_bowstring', type: 'audio', category: 'sfx', name: 'Bowstring', url: '/assets/audio/sfx/avg_d_avg_bowstring.wav' },
    { asset_id: 'sfx_footstep', type: 'audio', category: 'sfx', name: 'Footstep', url: '/assets/audio/sfx/avg_d_avg_footstep_stonestep.wav' },
    { asset_id: 'sfx_glass', type: 'audio', category: 'sfx', name: 'Glass Break', url: '/assets/audio/sfx/avg_d_avg_glass_break.wav' },
    { asset_id: 'sfx_magic', type: 'audio', category: 'sfx', name: 'Magic Cast', url: '/assets/audio/sfx/avg_d_avg_magic_1.wav' },
    { asset_id: 'sfx_monsterroar', type: 'audio', category: 'sfx', name: 'Monster Roar', url: '/assets/audio/sfx/avg_d_avg_monsterroar.wav' },
    { asset_id: 'sfx_originium', type: 'audio', category: 'sfx', name: 'Originium Cast', url: '/assets/audio/sfx/avg_d_avg_originiumcastshort.wav' },
    { asset_id: 'sfx_sword_exsheath', type: 'audio', category: 'sfx', name: 'Sword Exsheath', url: '/assets/audio/sfx/avg_d_avg_swordexsheath.wav' },
    { asset_id: 'sfx_sword_tsing', type: 'audio', category: 'sfx', name: 'Sword Tsing', url: '/assets/audio/sfx/avg_d_avg_swordtsing1.wav' },
    { asset_id: 'sfx_sword_swing', type: 'audio', category: 'sfx', name: 'Sword Swing', url: '/assets/audio/sfx/avg_d_avg_swordy.wav' },
    { asset_id: 'sfx_walk_stage', type: 'audio', category: 'sfx', name: 'Walk Stage', url: '/assets/audio/sfx/avg_d_avg_walk_stage.wav' },
    { asset_id: 'sfx_walk_water', type: 'audio', category: 'sfx', name: 'Walk Water', url: '/assets/audio/sfx/avg_d_avg_walk_water.wav' },
    { asset_id: 'sfx_walkfast', type: 'audio', category: 'sfx', name: 'Walk Fast', url: '/assets/audio/sfx/avg_d_avg_walkfast.wav' },
    { asset_id: 'sfx_walk_gen', type: 'audio', category: 'sfx', name: 'Walk General', url: '/assets/audio/sfx/avg_d_gen_walk_n.wav' },
    { asset_id: 'sfx_crowns_flash', type: 'audio', category: 'sfx', name: 'Crowns Flash', url: '/assets/audio/sfx/enemy_e_skill_e_skill_crownsflash.wav' },
    { asset_id: 'sfx_mon3tr', type: 'audio', category: 'sfx', name: 'Mon3tr AOE', url: '/assets/audio/sfx/player_p_aoe_p_aoe_Mon3tr2_n.wav' },
    { asset_id: 'sfx_rifle', type: 'audio', category: 'sfx', name: 'Assault Rifle', url: '/assets/audio/sfx/player_p_imp_p_imp_assaultrifle_n.wav' },

    // Video
    { asset_id: 'vid_pv', type: 'video', category: 'video', name: 'Chapter 10 PV', url: '/assets/videos/ak_chap10_pv.mp4' }
  ],

  // ─── gallery ────────────────────────────────────────────────────────────────
  gallery: [
    { gallery_id: 'gal_1', event_id: 'event_1', title: 'Amiya Awakening', image_url: '/assets/images/art gallery/Amiya_Awakening.png', display_order: 1 },
    { gallery_id: 'gal_2', event_id: 'event_1', title: 'Escape Plan', image_url: '/assets/images/art gallery/Amiya_Awakening.png', display_order: 2 },
    { gallery_id: 'gal_3', event_id: 'event_5', title: 'Kazdel War', image_url: '/assets/images/art gallery/Amiya_Awakening.png', display_order: 1 }
  ],

  // ─── event_characters ───────────────────────────────────────────────────────
  event_characters: [
    { event_id: 'event_1', character_id: 'char_doctor', name: 'Doctor', description: 'Awakened from sleep', avatar_url: '/assets/images/character/doctor/doctor_avatar.png', image_url: '/assets/images/character/doctor/doctor.png', display_order: 1 },
    { event_id: 'event_1', character_id: 'char_hibiscus', name: 'Hibiscus', description: 'Tending to the Doctor', avatar_url: '/assets/images/character/hibiscus/hibiscus_avatar.webp', image_url: '/assets/images/character/hibiscus/hibiscus.png', display_order: 2 },
    { event_id: 'event_5', character_id: 'char_w', name: 'W', description: 'Mercenary of Kazdel', avatar_url: '/assets/images/character/doctor/doctor_avatar.png', image_url: '/assets/images/character/doctor/doctor.png', display_order: 1 }
  ]
};

// ─── Compatibility export ────────────────────────────────────────────────────
// Keep this export if any legacy code still uses `mockStoryData` directly.
// Safe to remove once everything goes through SupabaseAPI.
export const mockStoryData = mockDatabase.stories[0];
