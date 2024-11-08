export const TeamInfo = {
  1: {Color: "red", Name: "崩滅"},
  2: {Color: "white", Name: "擁衛"},
  3: {Color: "cyan", Name: "佑寵"},
  4: {Color: "green", Name: "断淵"},
}

export const PhaseInfo = {
  1: "外交",
  2: "詠唱",
  3: "陣営会議",
  4: "裁定",
  5: "呼剥",
  6: "休憩",
  7: "戦闘",
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
  1: {ID: 1, Name: "察知", Role: [5], Phase: [3], Target: 0, Mana: 1},
  2: {ID: 2, Name: "凝視", Role: [6], Phase: [3], Target: 1, Mana: 1},
  3: {ID: 3, Name: "忠誠", Role: [7], Phase: [3], Target: 0, Mana: 1},
  4: {ID: 4, Name: "見分", Role: [8], Phase: [3], Target: 1, Mana: 1},
  5: {ID: 5, Name: "裁定", Role: [1,2,3,4,5,6,7,8], Phase: [4], Target: false, Mana: 1},
  6: {ID: 6, Name: "呼剥", Role: [1,2,3,4,5,6,7,8], Phase: [5], Target: 2, Mana: 1},
  7: {ID: 7, Name: "戦闘", Role: [1,2,3,4,5,6,7,8], Phase: [7], Target: 1, Mana: 1},
  8: {ID: 8, Name: "絶結", Role: [1,2,3,4], Phase: [3], Target: 2, Mana: 1},
  9: {ID: 9, Name: "GM：HP操作", Role: [0], Phase: [], Target: true, Mana: 1},
  10: {ID: 10, Name: "GM：魔力操作", Role: [0], Phase: [], Target: true, Mana: 1},
  11: {ID: 11, Name: "使い魔", Role: [], Phase: [3], Target: 1, Mana: 1},
  12: {ID: 12, Name: "命約", Role: [], Phase: [1,2], Target: 8, Mana: 1},
}

export const DefaultHP = 3;


export const TargetSelectFormat = (args, actionId, value) => {
  // if(actionId === 9){
    console.log(actionId)
    console.log(args)
  // }
  switch (actionId) {
    case 5:
      return `裁定「昨晩、${args[0] ?? '?'}が${args[1] ?? '?'}との戦闘に勝利した」`;
    case 6:
      return `呼剥「${args[0] ?? '?'}の精霊は${args[1] ?? '?'}である」`;
    case 7:
      return `${args[0] ?? '?'}に対して魔力を${value}消費して戦闘を行う`;
    case 8:
      return `絶結「${args[0] ?? '?'}と${args[1] ?? '?'}はツインである」`;
    case 9:
      return `GM操作：HP　${args[0] > 0? "+": ""}${args[0]}`;
    case 10:
      return `GM操作：マナ${args[0] > 0? "+": ""}${args[0]}`;
    case 11:
      return `${args[0] ?? '?'}に使い魔を送る`;
    case 12:
      return `命約「${(value.length === 0)? '?': value}」　締結者：${args.join(",")}`;
    default:
      return (ActionInfo[actionId].Target ? `${args[0] ?? '?'}に対して` : '') + `${ActionInfo[actionId].Name}を行う`;
  }
}