export const TeamInfo = {
  1: {Color: "#FF8888", Name: "崩滅"},
  2: {Color: "#BBBBBB", Name: "擁衛"},
  3: {Color: "#5588FF", Name: "佑寵"},
  4: {Color: "#88FF88", Name: "断淵"},
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
  1: {ID: 1, Name: "察知", Role: [5], Phase: [3], Target: 0, Mana: 1, Description: "魔力を 1 消費する。陣営会議開始時点で魔力が最も高いプレイヤーが誰かを知る。"},
  2: {ID: 2, Name: "凝視", Role: [6], Phase: [3], Target: 1, Mana: 1, Description: "魔力を 4 消費する。対象がアーヴかアルカナかを知る。"},
  3: {ID: 3, Name: "忠誠", Role: [7], Phase: [3], Target: 0, Mana: 1, Description: "魔力を 4 消費する。この日、アルカナが受けるダメージを 1 だけ自身が代わり\n" +
      "に受ける。"},
  4: {ID: 4, Name: "見分", Role: [8], Phase: [3], Target: 1, Mana: 1, Description: "魔力を 1 消費する。任意の対象の昨夜の戦闘力を知る。"},
  5: {ID: 5, Name: "裁定", Role: [1,2,3,4,5,6,7,8], Phase: [4], Target: false, Mana: 1, Description: "昨晩戦闘に勝利したもの一名 ( ただし自身とツインを除く ) と、その戦闘対象の両者を記述する。正解し\n" +
      "ていた場合、魔力を 4 獲得する。失敗した場合魔力が -1 される。"},
  6: {ID: 6, Name: "呼剥", Role: [1,2,3,4,5,6,7,8], Phase: [5], Target: 2, Mana: 1, Description: "自分以外の脱落していない PC を指定し対象の精霊を記述する。的中していた場合、対象の魔力を半減さ\n" +
      "せたうえで ( 端数切り上げ ) 魔力を 4 獲得する。間違っていた場合、魔力を 2 失う。"},
  7: {ID: 7, Name: "攻撃", Role: [1,2,3,4,5,6,7,8], Phase: [7], Target: 1, Mana: 1, Description: "魔力を使用して自身の精霊の戦闘力を高めて攻撃を行う。"},
  8: {ID: 8, Name: "絶結", Role: [1,2,3,4], Phase: [3], Target: 2, Mana: 0, Description: "生存している二名を指定する。二人がツインであった場合、対象のアーヴのライフを 1, アルカ\n" +
      "ナの魔力を 8 減少させたうえで、自身の魔力を 6 増加させる。失敗した場合、魔力が 6 減少する。"},
  9: {ID: 9, Name: "GM：HP操作", Role: [0], Phase: [], Target: true, Mana: 0, Description: ""},
  10: {ID: 10, Name: "GM：魔力操作", Role: [0], Phase: [], Target: true, Mana: 0, Description: ""},
  11: {ID: 11, Name: "使い魔", Role: [], Phase: [3], Target: 1, Mana: 1, Description: "魔力を 1 支払う。任意の人物に文章を送る。"},
  12: {ID: 12, Name: "命約", Role: [], Phase: [1,2], Target: 8, Mana: 0, Description: ""},
  13: {ID: 13, Name: "護衛", Role: [5,6,7,8], Phase: [3], Target: 0, Mana: 5, Description: "魔力を 5 支払う。その日のアルカナの精霊が命約違反によるダメージ以外で死亡する際、代わ\n" +
      "りに自身の精霊を死亡させる。"},
  14: {ID: 14, Name: "攻撃無", Role: [1,2,3,4,5,6,7,8], Phase: [7], Target: 1, Mana: 1, Description: "戦闘フェイズに戦闘を行わない。"},
}

export const DefaultHP = 3;

export const TargetSelectFormat = (args, actionId, value) => {
  switch (actionId) {
    case 5:
      return `裁定「昨晩、${args[0] ?? '?'}が${args[1] ?? '?'}との戦闘に勝利した」`;
    case 6:
      return `呼剥「${args[0] ?? '?'}の精霊は${args[1] ?? '?'}である」`;
    case 7:
      return `${args[0] ?? '?'}に対して魔力を${value? value: '?'}消費して攻撃を行う`;
    case 8:
      return `絶結「${args[0] ?? '?'}と${args[1] ?? '?'}はツインである」`;
    case 9:
      return `GM操作：HP　${args[0] > 0? "+": ""}${args[0]}`;
    case 10:
      return `GM操作：魔力${args[0] > 0? "+": ""}${args[0]}`;
    case 11:
      return `${args[0] ?? '?'}に使い魔「${(value.length === 0)? '?': value}」`;
    case 12:
      return `命約「${(value.length === 0)? '?': value}」　承認者：${args.join(",")}`;
    case 14:
      return `攻撃しない`;
    default:
      return (ActionInfo[actionId].Target ? `${args[0] ?? '?'}に対して` : '') + `${ActionInfo[actionId].Name}を行う`;
  }
}