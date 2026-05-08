// ─────────────────────────────────────
// 工程テンプレート
// 食感×調理方法×時間条件で工程を生成
// ─────────────────────────────────────

const BASE_STEPS = {
  "ふんわり_オーブン": [
    {
      label: "下準備",
      desc: (r) => {
        const hasButterInProfile = (r.profile?.butter || 0) > 0;
        const isHard = r.texture === "ハード系";
        if (isHard) return "水は人肌（30℃程度）に温める。オーブン庫内に天板を入れて予熱の準備をする。";
        return `${hasButterInProfile ? "無塩バターは室温に戻す。" : ""}型に薄く油を塗る。牛乳は人肌（35℃程度）に温める。`;
      },
      time: null,
    },
    {
      label: "混ぜる",
      desc: (r) => {
        const isHard = r.texture === "ハード系";
        return isHard
          ? "ボウルに強力粉・塩・砂糖を入れて混ぜる。水にドライイーストを溶かして加え、ひとまとめにする。"
          : "ボウルに強力粉・砂糖・塩を入れて軽く混ぜる。温めた牛乳にドライイーストを溶かして加え、カードや手でひとまとめにする。";
      },
      time: null,
    },
    {
      label: "捏ね",
      desc: (r) => {
        const hasButterInProfile = (r.profile?.butter || 0) > 0;
        const isHard = r.texture === "ハード系";
        if (isHard) return "台に出して10〜15分こねる。ハード系は少し硬めの生地感でOK。表面がなめらかになれば完了。";
        return hasButterInProfile
          ? "台に出して8〜10分こねる。表面がなめらかになったら室温のバターを加え、さらに5分こねる。薄く伸ばして半透明の膜（グルテン膜）ができればOK。"
          : "台に出して10〜15分こねる。表面がなめらかになれば完了。グルテン膜ができるまでしっかりこねる。";
      },
      time: "約15分",
    },
    {
      label: "一次発酵",
      desc: (r) => `丸めてボウルに入れラップをかけ、${r.fermentConfig.first.temp}℃で発酵させる。${r.texture === "ハード系" ? "2倍程度に膨らめばOK。" : "指で押して跡がゆっくり戻ればOK。"}`,
      time: (r) => `${r.fermentConfig.first.temp}℃・${r.fermentConfig.first.time}分`,
    },
    {
      label: "ガス抜き・分割",
      desc: (r) => r.texture === "ハード系"
        ? "打ち粉をした台に出し、やさしくガスを抜く。均等に分割して丸め直す。"
        : "打ち粉をした台に出し、手のひらで軽く押してガスを抜く。均等に分割して丸め直す。",
      time: null,
    },
    {
      label: "ベンチタイム",
      desc: () => "丸めた生地に濡れ布巾をかけて休ませる。生地がリラックスして成形しやすくなる。",
      time: "10〜15分",
    },
    {
      label: "成形",
      desc: (r) => r.texture === "ハード系"
        ? "バゲットは細長く、ブールは丸く成形する。とじ目を下にしてクッキングシートを敷いた天板に並べる。"
        : "ガスを抜きながら好みの形に成形する。とじ目をしっかり閉じて型や天板に並べる。",
      time: null,
    },
    {
      label: "二次発酵",
      desc: (r) => r.texture === "ハード系"
        ? `${r.fermentConfig.second.temp}℃で発酵させる。1.5倍程度に膨らめばOK。`
        : `${r.fermentConfig.second.temp}℃で発酵させる。型の8〜9分目まで膨らめばOK。`,
      time: (r) => `${r.fermentConfig.second.temp}℃・${r.fermentConfig.second.time}分`,
    },
    {
      label: "焼成",
      desc: (r) => r.texture === "ハード系"
        ? `表面にクープ（切り込み）を入れる。${r.bakingConfig.temp}℃に予熱したオーブンで${r.bakingConfig.time}分焼く。最初の10分は蒸気を出すと皮がパリッと仕上がる。`
        : `オーブンを${r.bakingConfig.temp}℃に予熱する。${r.bakingConfig.time}分焼く。焼き色がついたらアルミホイルをかぶせてOK。`,
      time: (r) => `${r.bakingConfig.temp}℃・${r.bakingConfig.time}分`,
    },
    {
      label: "仕上げ",
      desc: (r) => r.texture === "ハード系"
        ? "網の上で冷ます。粗熱が取れてからカットすると断面がきれい。"
        : "焼き上がったらすぐ型から出し、網の上で側面を下にして冷ます。粗熱が取れたら完成。",
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
      desc: (r) => {
        const hasButterInProfile = (r.profile?.butter || 0) > 0;
        return `材料を計量する。水は冷水（10℃程度）を使う。${hasButterInProfile ? "バターは小さく切っておく。" : ""}`;
      },
      time: null,
    },
    {
      label: "混ぜる・捏ね（前日夜）",
      desc: (r) => {
        const hasButterInProfile = (r.profile?.butter || 0) > 0;
        return hasButterInProfile
          ? "粉類と水・イーストを混ぜてひとまとめにし、バターを加えて8〜10分こねる。グルテン膜ができればOK。"
          : "粉類と水・イーストを混ぜてひとまとめにし、10〜15分こねる。グルテン膜ができればOK。";
      },
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
      desc: (r) => r.texture === "ハード系"
        ? "バゲットは細長く、ブールは丸く成形する。とじ目を下にしてクッキングシートを敷いた天板に並べる。"
        : "好みの形に成形し、とじ目を下にして型や天板に並べる。",
      time: null,
    },
    {
      label: "二次発酵",
      desc: (r) => r.texture === "ハード系"
        ? `${r.fermentConfig.second.temp}℃で発酵させる。1.5倍程度に膨らめばOK。`
        : `${r.fermentConfig.second.temp}℃で発酵させる。型の8〜9分目まで膨らめばOK。`,
      time: (r) => `${r.fermentConfig.second.temp}℃・${r.fermentConfig.second.time}分`,
    },
    {
      label: "クープ・焼成",
      desc: (r) => r.texture === "ハード系"
        ? `表面にクープ（切り込み）を入れる。${r.bakingConfig.temp}℃に予熱したオーブンで${r.bakingConfig.time}分焼く。最初の10分は蒸気を出すと皮がパリッと仕上がる。`
        : `${r.bakingConfig.temp}℃に予熱したオーブンで${r.bakingConfig.time}分焼く。焼き色がついたらアルミホイルをかぶせてOK。`,
      time: (r) => `${r.bakingConfig.temp}℃・${r.bakingConfig.time}分`,
    },
    {
      label: "仕上げ",
      desc: (r) => r.texture === "ハード系"
        ? "網の上で冷ます。粗熱が取れてからカットすると断面がきれい。"
        : "型から出して網の上で冷ます。",
      time: null,
    },
  ],
};

// ─────────────────────────────────────
// 特殊製法テンプレート
// ─────────────────────────────────────
const SPECIAL_STEPS = {

  "croissant": [
    { label: "生地捏ね", desc: (r) => `水と折り込み用バター以外の材料（強力粉・砂糖・塩・イースト・バター${r.profile?.butter ? Math.round(r.profile.butter * 0.3) + "%" : "少量"}）をボウルで混ぜ合わせる。`, time: null },
    { label: "水を加えて混ぜる", desc: () => "水を加えてひとまとめにし、なめらかになるまでこねる。こねすぎないこと。", time: "約8分" },
    { label: "一次発酵・冷却", desc: () => "丸めてラップをかけ冷蔵庫に入れる。60分後、生地がしっかり冷えたら取り出す。", time: "冷蔵庫・60分" },
    { label: "折り込み用バターの準備", desc: (r) => `折り込み用バター（粉量の${Math.round((r.profile?.butter || 30) * 0.7)}%）を厚手のフィルムで挟み、めん棒でたたいて12cm正方形に伸ばす。冷蔵庫で冷やす。`, time: null },
    { label: "生地を伸ばす", desc: () => "生地を20cm正方形に伸ばし、ラップに包んで冷凍庫で10分冷やす。", time: "10分" },
    { label: "バターを包む", desc: () => "生地をひし形に置き、中心にバターを置く。四方から包みしっかり接着する。めん棒で優しく40cmほど伸ばす。", time: null },
    { label: "折り込み①", desc: () => "40cmに伸ばしたら4つ折りにする。90度向きを変え、再度40cmまで伸ばして4つ折りにする。ラップに包んで冷凍庫で冷やす。", time: "冷凍庫・30分" },
    { label: "折り込み②", desc: () => "再度取り出し同様に伸ばして4つ折り×2回。生地の厚さを1cm程度にし、ラップに包んで冷凍庫で冷やす。", time: "冷凍庫・60分" },
    { label: "成形", desc: () => "生地を短辺20cm・長辺30cmに伸ばす。長辺の両端を切り落とし、底辺10cmの二等辺三角形にカットする。底辺を少し折り曲げて芯を作り、きつく巻く。", time: null },
    { label: "二次発酵", desc: () => "巻き終わりを下にして天板に並べ、30℃未満の環境で二次発酵させる。バターが溶けないよう温度管理が重要。", time: "約60分（30℃未満）" },
    { label: "焼成", desc: (r) => `溶き卵をうっすら塗る。${r.bakingConfig?.temp || 200}℃に予熱したオーブンで${r.bakingConfig?.time || 15}分焼く。きれいな焼き色がついたら完成。`, time: (r) => `${r.bakingConfig?.temp || 200}℃・${r.bakingConfig?.time || 15}分` },
    { label: "仕上げ", desc: () => "網の上に移し粗熱をとる。冷めると層がはっきり見えてきれい。", time: null },
  ],

  "bagel": [
    { label: "生地を作る", desc: () => "ボウルに強力粉・砂糖・塩・イーストを入れて混ぜ、水を加えてひとまとめにする。油脂なしでこねる。", time: null },
    { label: "捏ね", desc: () => "台に出して10〜12分しっかりこねる。バゲル生地は硬めでOK。表面がなめらかになれば完了。", time: "約12分" },
    { label: "一次発酵", desc: (r) => `丸めてラップをかけ${r.fermentConfig?.first?.temp || 28}℃で発酵させる。1.5倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 40}分` },
    { label: "分割・成形", desc: () => "6等分にして丸め直し、10分ベンチタイム。指で穴を開けてドーナツ型に成形する。均等な太さになるよう伸ばす。", time: "10分" },
    { label: "二次発酵", desc: (r) => `天板に並べて${r.fermentConfig?.second?.temp || 35}℃で発酵させる。1.5倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.second?.temp || 35}℃・${r.fermentConfig?.second?.time || 20}分` },
    { label: "ケトリング（ゆでる）", desc: () => "大きな鍋にお湯を沸かし、はちみつまたは砂糖大さじ1を加える。片面30秒ずつゆでて取り出す。これがもっちり食感の秘訣。", time: "片面30秒×2" },
    { label: "焼成", desc: (r) => `${r.bakingConfig?.temp || 200}℃に予熱したオーブンで${r.bakingConfig?.time || 18}分焼く。表面がツヤッとしてきれいな焼き色になればOK。`, time: (r) => `${r.bakingConfig?.temp || 200}℃・${r.bakingConfig?.time || 18}分` },
    { label: "仕上げ", desc: () => "網の上で冷ます。完全に冷めるとさらにもっちり感が増す。", time: null },
  ],

  "focaccia": [
    { label: "生地を作る", desc: () => "ボウルに強力粉・塩・イーストを入れ混ぜる。水を加えてひとまとめにし、オリーブオイルを加えてなめらかになるまでこねる。", time: "約10分" },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 30}℃で発酵させる。2倍に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 30}℃・${r.fermentConfig?.first?.time || 30}分` },
    { label: "型に入れる", desc: () => "オリーブオイルを塗った天板（またはバット）に生地を広げる。指で全体を押し広げ、均等な厚さ（約2cm）にする。", time: null },
    { label: "二次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.second?.temp || 35}℃で発酵させる。ふっくら膨らめばOK。`, time: (r) => `${r.fermentConfig?.second?.temp || 35}℃・${r.fermentConfig?.second?.time || 20}分` },
    { label: "トッピング", desc: () => "指でくぼみ（ディンプル）を全体に作る。オリーブオイルをたっぷりかけ、塩・ローズマリー・お好みのトッピングをのせる。", time: null },
    { label: "焼成", desc: (r) => `${r.bakingConfig?.temp || 220}℃に予熱したオーブンで${r.bakingConfig?.time || 20}分焼く。表面がこんがりきつね色になればOK。`, time: (r) => `${r.bakingConfig?.temp || 220}℃・${r.bakingConfig?.time || 20}分` },
    { label: "仕上げ", desc: () => "焼き上がったらすぐ型から出して網の上で冷ます。温かいうちが一番おいしい。", time: null },
  ],
};

// ─────────────────────────────────────
// 工程テンプレートを取得
// ─────────────────────────────────────
export function getStepsTemplate(texture, method, timeCondition, recipeData) {
  const stepsType = recipeData?.profile?.steps_type;

  // 特殊製法テンプレートがあれば優先
  if (stepsType && SPECIAL_STEPS[stepsType]) {
    return resolveSteps(SPECIAL_STEPS[stepsType], { ...recipeData, texture });
  }

  // 一晩発酵は専用テンプレート
  if (timeCondition === "一晩") {
    const template = BASE_STEPS["一晩_オーブン"];
    return resolveSteps(template, { ...recipeData, texture });
  }

  const key = `${texture}_${method}`;
  const template = BASE_STEPS[key]
    || BASE_STEPS[`${texture}_オーブン`]
    || BASE_STEPS["ふんわり_オーブン"];

  return resolveSteps(template, { ...recipeData, texture });
}

function resolveSteps(template, recipeData) {
  return template.map((step, i) => ({
    index: i + 1,
    label: step.label,
    desc: typeof step.desc === "function" ? step.desc(recipeData) : step.desc,
    time: typeof step.time === "function" ? step.time(recipeData) : step.time,
  }));
}
