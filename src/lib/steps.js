// ─────────────────────────────────────
// 工程テンプレート
// 食感×調理方法×時間条件で工程を生成
// ─────────────────────────────────────

const BASE_STEPS = {
  "ふんわり_オーブン": [
    {
      label: "下準備",
      desc: (r) => `無塩バターは室温に戻す。${r.method === "オーブン" ? "型に薄く油を塗る。" : ""}牛乳は人肌（35℃程度）に温める。`,
      time: null,
    },
    {
      label: "混ぜる",
      desc: () => "ボウルに強力粉・砂糖・塩を入れて軽く混ぜる。温めた牛乳にドライイーストを溶かして加え、カードや手でひとまとめにする。",
      time: null,
    },
    {
      label: "捏ね",
      desc: () => "台に出して8〜10分こねる。表面がなめらかになったら室温のバターを加え、さらに5分こねる。生地を薄く伸ばして半透明の膜（グルテン膜）ができればOK。",
      time: "約15分",
    },
    {
      label: "一次発酵",
      desc: (r) => `丸めてボウルに入れラップをかけ、${r.fermentConfig.first.temp}℃で発酵させる。指で押して跡がゆっくり戻ればOK。`,
      time: (r) => `${r.fermentConfig.first.temp}℃・${r.fermentConfig.first.time}分`,
    },
    {
      label: "ガス抜き・分割",
      desc: () => "打ち粉をした台に出し、手のひらで軽く押してガスを抜く。均等に分割して丸め直す。",
      time: null,
    },
    {
      label: "ベンチタイム",
      desc: () => "丸めた生地に濡れ布巾をかけて休ませる。生地がリラックスして成形しやすくなる。",
      time: "10〜15分",
    },
    {
      label: "成形",
      desc: () => "ガスを抜きながら好みの形に成形する。とじ目をしっかり閉じて型や天板に並べる。",
      time: null,
    },
    {
      label: "二次発酵",
      desc: (r) => `${r.fermentConfig.second.temp}℃で発酵させる。型の8〜9分目まで膨らめばOK。`,
      time: (r) => `${r.fermentConfig.second.temp}℃・${r.fermentConfig.second.time}分`,
    },
    {
      label: "焼成",
      desc: (r) => `オーブンを${r.bakingConfig.temp}℃に予熱する。${r.bakingConfig.time}分焼く。焼き色がついたらアルミホイルをかぶせてOK。`,
      time: (r) => `${r.bakingConfig.temp}℃・${r.bakingConfig.time}分`,
    },
    {
      label: "仕上げ",
      desc: () => "焼き上がったらすぐ型から出し、網の上で側面を下にして冷ます。粗熱が取れたら完成。",
      time: null,
    },
  ],

  "ハード系_オーブン": [
    {
      label: "下準備",
      desc: () => "水は人肌（30℃程度）に温める。オーブン庫内に天板を入れて予熱の準備をする。",
      time: null,
    },
    {
      label: "混ぜる",
      desc: () => "ボウルに強力粉・塩・砂糖を入れて混ぜる。水にドライイーストを溶かして加え、ひとまとめにする。",
      time: null,
    },
    {
      label: "捏ね",
      desc: () => "台に出して10〜15分こねる。ハード系は少し硬めの生地感でOK。表面がなめらかになれば完了。グルテン膜ができるまでしっかりこねる。",
      time: "約15分",
    },
    {
      label: "一次発酵",
      desc: (r) => `丸めてボウルに入れラップをかけ、${r.fermentConfig.first.temp}℃で発酵させる。2倍程度に膨らめばOK。`,
      time: (r) => `${r.fermentConfig.first.temp}℃・${r.fermentConfig.first.time}分`,
    },
    {
      label: "ガス抜き・分割",
      desc: () => "打ち粉をした台に出し、やさしくガスを抜く。均等に分割して丸め直す。",
      time: null,
    },
    {
      label: "ベンチタイム",
      desc: () => "濡れ布巾をかけて休ませる。",
      time: "15〜20分",
    },
    {
      label: "成形",
      desc: () => "バゲットは細長く、ブールは丸く成形する。とじ目を下にして天板のクッキングシートに並べる。",
      time: null,
    },
    {
      label: "二次発酵",
      desc: (r) => `${r.fermentConfig.second.temp}℃で発酵させる。1.5倍程度に膨らめばOK。`,
      time: (r) => `${r.fermentConfig.second.temp}℃・${r.fermentConfig.second.time}分`,
    },
    {
      label: "クープ・スチーム",
      desc: () => "表面にクープ（切り込み）を斜めに入れる。オーブンに入れる直前に庫内に熱湯を少量入れてスチームを出す（パリッとした皮のため）。",
      time: null,
    },
    {
      label: "焼成",
      desc: (r) => `${r.bakingConfig.temp}℃に予熱したオーブンで${r.bakingConfig.time}分焼く。最初の10分は高温でしっかり焼き色をつける。`,
      time: (r) => `${r.bakingConfig.temp}℃・${r.bakingConfig.time}分`,
    },
    {
      label: "仕上げ",
      desc: () => "網の上で冷ます。粗熱が取れてからカットすると断面がきれい。",
      time: null,
    },
  ],

  "ふんわり_フライパン": [
    {
      label: "下準備",
      desc: () => "無塩バターは室温に戻す。牛乳は人肌（35℃程度）に温める。フライパンにクッキングシートを敷く。",
      time: null,
    },
    {
      label: "混ぜる",
      desc: () => "ボウルに強力粉・砂糖・塩を入れて混ぜる。温めた牛乳にイーストを溶かして加え、ひとまとめにする。",
      time: null,
    },
    {
      label: "捏ね",
      desc: () => "台に出して8〜10分こねる。バターを加えてさらに5分こねる。グルテン膜ができればOK。",
      time: "約15分",
    },
    {
      label: "一次発酵",
      desc: (r) => `ラップをかけて${r.fermentConfig.first.temp}℃で発酵させる。`,
      time: (r) => `${r.fermentConfig.first.temp}℃・${r.fermentConfig.first.time}分`,
    },
    {
      label: "ガス抜き・分割・ベンチタイム",
      desc: () => "ガスを抜いて分割し、丸め直す。濡れ布巾をかけて10分休ませる。",
      time: "10分",
    },
    {
      label: "成形・二次発酵",
      desc: (r) => `丸く成形してフライパンに並べる。${r.fermentConfig.second.temp}℃で発酵させる。`,
      time: (r) => `${r.fermentConfig.second.temp}℃・${r.fermentConfig.second.time}分`,
    },
    {
      label: "焼成",
      desc: () => "フライパンにふたをして弱火〜中火で8分焼く。裏返してさらに5分焼く。竹串を刺して何もついてこなければ完成。",
      time: "約13分（弱火〜中火）",
    },
    {
      label: "仕上げ",
      desc: () => "網の上で冷ます。温かいうちに食べると一番おいしい。",
      time: null,
    },
  ],

  "ふんわり_ホームベーカリー": [
    {
      label: "材料をセット",
      desc: () => "ホームベーカリーのパンケースに材料を入れる。液体（牛乳）を先に入れ、粉類を入れ、最後にイーストをドライイースト専用ケースに入れる。バターは後入れ専用ポケットがあれば使う。",
      time: null,
    },
    {
      label: "コース選択・スタート",
      desc: () => "「食パン」または「ソフトパン」コースを選択。タイマー設定も可能。スタートボタンを押す。",
      time: null,
    },
    {
      label: "焼き上がり",
      desc: () => "ブザーが鳴ったらすぐにパンケースを取り出す。長時間放置すると蒸れてべたつく原因になる。",
      time: "コースによる（約3〜4時間）",
    },
    {
      label: "仕上げ",
      desc: () => "羽根を取り外し、網の上で横向きに寝かせて冷ます。完全に冷めてからカットするときれい。",
      time: null,
    },
  ],

  "一晩_オーブン": [
    {
      label: "下準備（前日夜）",
      desc: () => "材料を計量する。水は冷水（10℃程度）を使う。バターは小さく切っておく。",
      time: null,
    },
    {
      label: "混ぜる・捏ね（前日夜）",
      desc: () => "粉類と水・イーストを混ぜてひとまとめにし、バターを加えて8〜10分こねる。グルテン膜ができればOK。",
      time: "約15分",
    },
    {
      label: "冷蔵発酵（前日夜〜翌朝）",
      desc: () => "丸めてラップをしっかりかけ、冷蔵庫（5℃）に入れる。長時間発酵でグルテンが熟成し、風味豊かな生地になる。",
      time: "冷蔵庫・8〜12時間",
    },
    {
      label: "復温（翌朝）",
      desc: () => "冷蔵庫から出して室温に30分置き、生地を常温に戻す。",
      time: "30分",
    },
    {
      label: "ガス抜き・分割・ベンチタイム",
      desc: () => "ガスを抜いて分割し、丸め直す。濡れ布巾をかけて15分休ませる。",
      time: "15分",
    },
    {
      label: "成形",
      desc: () => "好みの形に成形し、型や天板に並べる。",
      time: null,
    },
    {
      label: "二次発酵",
      desc: (r) => `${r.fermentConfig.second.temp}℃で発酵させる。型の8〜9分目まで膨らめばOK。`,
      time: (r) => `${r.fermentConfig.second.temp}℃・${r.fermentConfig.second.time}分`,
    },
    {
      label: "焼成",
      desc: (r) => `${r.bakingConfig.temp}℃に予熱したオーブンで${r.bakingConfig.time}分焼く。`,
      time: (r) => `${r.bakingConfig.temp}℃・${r.bakingConfig.time}分`,
    },
    {
      label: "仕上げ",
      desc: () => "型から出して網の上で冷ます。",
      time: null,
    },
  ],
};

// ─────────────────────────────────────
// 工程テンプレートを取得
// ─────────────────────────────────────
export function getStepsTemplate(texture, method, timeCondition, recipeData) {
  // 一晩発酵は専用テンプレート
  if (timeCondition === "一晩") {
    const template = BASE_STEPS["一晩_オーブン"];
    return resolveSteps(template, recipeData);
  }

  const key = `${texture}_${method}`;
  const template = BASE_STEPS[key]
    || BASE_STEPS[`${texture}_オーブン`]
    || BASE_STEPS["ふんわり_オーブン"];

  return resolveSteps(template, recipeData);
}

// テンプレートの関数を実際の値に解決
function resolveSteps(template, recipeData) {
  return template.map((step, i) => ({
    index: i + 1,
    label: step.label,
    desc: typeof step.desc === "function" ? step.desc(recipeData) : step.desc,
    time: typeof step.time === "function" ? step.time(recipeData) : step.time,
  }));
}
