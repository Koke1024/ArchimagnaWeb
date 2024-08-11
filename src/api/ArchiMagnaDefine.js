export const TeamInfo = {
  1: {Color: "#F00", Name: "崩滅"},
  2: {Color: "#AAA", Name: "擁衛"},
  3: {Color: "#00F", Name: "佑寵"},
  4: {Color: "#A0A", Name: "断淵"},
}

export const PhaseInfo = {
  1: "外交",
  2: "詠唱",
  3: "陣営会議",
  4: "裁定",
  5: "戦闘",
}

export const RoleInfo = {
  1: "崩滅",
  2: "擁衛",
  3: "佑寵",
  4: "断淵",
  5: "勝利",
  6: "呼剝",
  7: "忍耐",
  8: "推理",
}

export const ActionInfo = {
  1: {ID: 1, Name: "察知", Role: [5], Phase: [], Target: false, Mana: 1},
  2: {ID: 2, Name: "凝視", Role: [6], Phase: [], Target: true, Mana: 1},
  3: {ID: 3, Name: "忠誠", Role: [7], Phase: [], Target: false, Mana: 1},
  4: {ID: 4, Name: "見分", Role: [8], Phase: [], Target: true, Mana: 1},
  5: {ID: 5, Name: "戦闘", Role: [1,2,3,4,5,6,7,8], Phase: [], Target: true, Mana: 1},
  6: {ID: 6, Name: "呼剥", Role: [1,2,3,4,5,6,7,8], Phase: [], Target: true, Mana: 1},
  7: {ID: 7, Name: "裁定", Role: [1,2,3,4,5,6,7,8], Phase: [], Target: false, Mana: 1},
  8: {ID: 8, Name: "絶結", Role: [1,2,3,4], Phase: [], Target: true, Mana: 1},
}