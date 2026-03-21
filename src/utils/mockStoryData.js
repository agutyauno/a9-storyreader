export const mockStoryData = {
  name: "Giao diện Test StoryPage",
  description: "Dữ liệu giả lập để kiểm thử UI với mọi trường tuỳ chọn.",
  event_id: null,
  story_content: {
    characters: {
      "doctor": {
        "avatar": "/assets/images/character/doctor/doctor_avatar.png",
        "full_image": "/assets/images/character/doctor/doctor.png"
      },
      "hibiscus": {
        "avatar": "/assets/images/character/hibiscus/hibiscus_avatar.webp",
        "full_image": "/assets/images/character/hibiscus/hibiscus.png"
      }
    },
    sections: [
      {
        "type": "dialogue_section",
        "elements": [
          {
            "type": "background",
            "image": "/assets/images/art gallery/Amiya_Awakening.png",
            "bgm": {
              "id": "m_test_music",
              "intro": "/assets/audio/bgm/music_act15d0d0_m_avg_tense_intro.wav",
              "loop": "/assets/audio/bgm/m_avg_tense_loop.wav"
            },
            "dialogues": [
              {
                "type": "dialogue",
                "left": "doctor",
                "right": "",
                "name": "Doctor",
                "text": "Đây là đâu? Ký ức của tôi hoàn toàn trống rỗng..."
              },
              {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              },
              {
                "type": "sfx",
                "src": "/assets/audio/sfx/dummy.mp3",
                "name": "[Tiếng máy móc kêu bíp bíp]"
              },
              {
                "type": "decision",
                "group_id": "decision_1",
                "left": "doctor",
                "right": "hibiscus",
                "choices": [
                  "Cô là ai?",
                  "Rhode Island là gì?"
                ]
              },
              {
                "type": "choice_response",
                "group_id": "decision_1",
                "choice_value": "1",
                "left": "doctor",
                "right": "hibiscus",
                "name": "Doctor",
                "text": "Cô là ai? Trông cô rất quen..."
              },
              {
                "type": "choice_response",
                "group_id": "decision_1",
                "choice_value": "2",
                "left": "doctor",
                "right": "hibiscus",
                "name": "Doctor",
                "text": "Tôi nghe cô nhắc tới Rhode Island - đó là trụ sở nào vậy?"
              },
              {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              },
              {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              },
            ]
          },
          {
            "type": "background",
            "image": "/assets/images/art gallery/Amiya_Awakening.png",
            "bgm": {
              "id": "",
              "intro": "",
              "loop": ""
            },
            "dialogues": [
              {
                "type": "dialogue",
                "left": "doctor",
                "right": "",
                "name": "Doctor",
                "text": "Đây là đâu? Ký ức của tôi hoàn toàn trống rỗng..."
              },
              {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              },
              {
                "type": "sfx",
                "src": "/assets/audio/sfx/avg_d_avg_bowstring.wav",
                "name": "bowstring"
              },
              {
                "type": "sfx",
                "src": "/assets/audio/sfx/avg_d_avg_glass_break.wav",
                "name": "glass break"
              },
              {
                "type": "decision",
                "group_id": "decision_1",
                "left": "doctor",
                "right": "hibiscus",
                "choices": [
                  "Cô là ai?",
                  "Rhode Island là gì?"
                ]
              },
              {
                "type": "choice_response",
                "group_id": "decision_1",
                "choice_value": "1",
                "left": "doctor",
                "right": "hibiscus",
                "name": "Doctor",
                "text": "Cô là ai? Trông cô rất quen..."
              },
              {
                "type": "choice_response",
                "group_id": "decision_1",
                "choice_value": "2",
                "left": "doctor",
                "right": "hibiscus",
                "name": "Doctor",
                "text": "Tôi nghe cô nhắc tới Rhode Island - đó là trụ sở nào vậy?"
              },
              {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              },
              {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              }, {
                "type": "dialogue",
                "left": "",
                "right": "hibiscus",
                "name": "Hibiscus",
                "text": "Bác sĩ! Ngài đã tỉnh lại rồi ư? Hãy nghỉ ngơi, đừng vội ngồi dậy!"
              },
            ]
          },
          {
            "type": "video",
            "src": "https://www.w3schools.com/html/mov_bbb.mp4"
          }
        ]
      }
    ]
  }
};
