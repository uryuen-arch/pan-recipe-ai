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
        : `${r.fermentConfig.second.temp}℃で発酵させる。1.5倍程度に膨らめばOK。`,
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
        : `${r.fermentConfig.second.temp}℃で発酵させる。1.5倍程度に膨らめばOK。`,
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

  "stollen": [
    { label: "下準備", desc: () => "ドライフルーツ類はラム酒またはブランデーに一晩漬けておく。バターは室温に戻す。", time: "一晩漬け込み" },
    { label: "生地を作る", desc: () => "ボウルに強力粉・砂糖・塩・イーストを入れ混ぜる。牛乳・卵・バターを加えてひとまとめにし、なめらかになるまでこねる。", time: "約15分" },
    { label: "具材を混ぜる", desc: () => "漬け込んだドライフルーツ・ナッツ類・スパイス（シナモン・カルダモンなど）を生地に折り込むように混ぜる。", time: null },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 28}℃で発酵させる。1.5倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 60}分` },
    { label: "成形", desc: () => "生地を楕円形に伸ばし、中央より少しずらした位置で折り畳む（シュトーレン形）。型は使わず天板のクッキングシートの上に置く。", time: null },
    { label: "二次発酵", desc: (r) => `${r.fermentConfig?.second?.temp || 35}℃で発酵させる。ひとまわり大きくなればOK。`, time: (r) => `${r.fermentConfig?.second?.temp || 35}℃・${r.fermentConfig?.second?.time || 30}分` },
    { label: "焼成", desc: (r) => `${r.bakingConfig?.temp || 170}℃に予熱したオーブンで${r.bakingConfig?.time || 40}分焼く。表面がきつね色になり竹串を刺して何もつかなければOK。`, time: (r) => `${r.bakingConfig?.temp || 170}℃・${r.bakingConfig?.time || 40}分` },
    { label: "仕上げ（重要）", desc: () => "焼き上がったら熱いうちに溶かしバターを表面全体にたっぷり塗る。粗熱が取れたら粉糖をたっぷりふりかける。ラップで包んで数日〜数週間熟成させると味が深まる。", time: null },
  ],

  "brioche": [
    { label: "下準備", desc: () => "バターは室温に戻してやわらかくしておく。ブリオッシュ型またはマフィン型に薄くバターを塗る。", time: null },
    { label: "生地を作る", desc: () => "ボウルに強力粉・砂糖・塩・イーストを入れ混ぜる。溶き卵と牛乳を加えてひとまとめにし、なめらかになるまでこねる。", time: "約10分" },
    { label: "バターを加える", desc: () => "やわらかくしたバターを少しずつ加えながらこねる。バターが多いので根気よく混ぜ込む。生地がなめらかでツヤが出ればOK。", time: "約15分" },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 28}℃で発酵させる。2倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 60}分` },
    { label: "パンチ・冷蔵発酵", desc: () => "軽くガスを抜いてラップに包み、冷蔵庫で一晩休ませる。冷やすことでバターが締まり成形しやすくなる。", time: "冷蔵庫・8時間以上" },
    { label: "分割・成形", desc: () => "冷蔵庫から出して常温に15分置く。分割して丸め、型に入れる。テット（頭つき）にする場合は大小2個に分けて重ねる。", time: "15分" },
    { label: "二次発酵", desc: (r) => `${r.fermentConfig?.second?.temp || 35}℃で発酵させる。型の8分目まで膨らめばOK。`, time: (r) => `${r.fermentConfig?.second?.temp || 35}℃・${r.fermentConfig?.second?.time || 40}分` },
    { label: "焼成", desc: (r) => `表面に溶き卵黄を薄く塗る。${r.bakingConfig?.temp || 180}℃に予熱したオーブンで${r.bakingConfig?.time || 18}分焼く。きれいな黄金色になればOK。`, time: (r) => `${r.bakingConfig?.temp || 180}℃・${r.bakingConfig?.time || 18}分` },
    { label: "仕上げ", desc: () => "型からすぐに出して網の上で冷ます。リッチな香りが広がる。", time: null },
  ],

  "pretzel": [
    { label: "生地を作る", desc: () => "ボウルに強力粉・砂糖・塩・イーストを入れ混ぜる。水とバターを加えてひとまとめにし、なめらかになるまでこねる。", time: "約10分" },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 28}℃で発酵させる。1.5倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 30}分` },
    { label: "分割・成形", desc: () => "8等分にして細長く伸ばし（約60cm）、U字に曲げてねじってプレッツェル形に成形する。天板に並べて冷凍庫で15分冷やす。", time: "15分" },
    { label: "重曹液の準備", desc: () => "大きな鍋に水1Lを沸かし、重曹大さじ3（またはラウゲン液）を加える。プレッツェルを片面30秒ずつくぐらせる。これが独特の茶色い皮と風味の秘訣。", time: "片面30秒×2" },
    { label: "仕上げ・焼成", desc: (r) => `クッキングシートを敷いた天板に並べ、岩塩を振る。${r.bakingConfig?.temp || 200}℃に予熱したオーブンで${r.bakingConfig?.time || 15}分焼く。深い茶色になればOK。`, time: (r) => `${r.bakingConfig?.temp || 200}℃・${r.bakingConfig?.time || 15}分` },
    { label: "完成", desc: () => "網の上で冷ます。温かいうちが一番おいしい。マスタードやチーズディップと一緒に。", time: null },
  ],

  "donut": [
    { label: "生地を作る", desc: () => "ボウルに強力粉・砂糖・塩・イーストを入れ混ぜる。卵・牛乳・バターを加えてひとまとめにし、なめらかになるまでこねる。", time: "約12分" },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 28}℃で発酵させる。2倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 60}分` },
    { label: "成形", desc: () => "生地を1cm厚さに伸ばし、ドーナツ型（直径8cmと3cm）で抜く。または分割して丸め、指で穴を開ける。クッキングシートの上に並べる。", time: null },
    { label: "二次発酵", desc: (r) => `${r.fermentConfig?.second?.temp || 35}℃で発酵させる。ひとまわり大きくふっくらすればOK。`, time: (r) => `${r.fermentConfig?.second?.temp || 35}℃・${r.fermentConfig?.second?.time || 30}分` },
    { label: "揚げる", desc: () => "揚げ油を170℃に熱する。シートごとそっと油に入れ、シートをはずす。片面2分ずつこんがりきつね色になるまで揚げる。", time: "片面約2分" },
    { label: "仕上げ", desc: () => "油をきって粗熱をとる。グラニュー糖をまぶすか、チョコレートやアイシングをかける。", time: null },
  ],

  "panettone": [
    { label: "下準備", desc: () => "ドライフルーツはラム酒に一晩漬け込む。バターは室温に戻す。パネトーネ専用型（または深めのマフィン型）を用意する。", time: "一晩漬け込み" },
    { label: "生地を作る", desc: () => "強力粉・砂糖・塩・イーストを混ぜ、卵・牛乳・バターを加えてなめらかになるまでよくこねる。リッチな生地なのでしっかりこねること。", time: "約20分" },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 28}℃でゆっくり発酵させる。2倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 90}分` },
    { label: "具材を混ぜる", desc: () => "漬け込んだドライフルーツをよく水気を切って生地に折り込む。オレンジピール・レモンピールも加える。", time: null },
    { label: "型に入れる・二次発酵", desc: (r) => `型に入れて${r.fermentConfig?.second?.temp || 35}℃で発酵させる。型の8分目まで膨らめばOK。`, time: (r) => `${r.fermentConfig?.second?.temp || 35}℃・${r.fermentConfig?.second?.time || 60}分` },
    { label: "焼成", desc: (r) => `表面に十字の切り込みを入れ、バターを少量置く。${r.bakingConfig?.temp || 170}℃に予熱したオーブンで${r.bakingConfig?.time || 40}分焼く。竹串を刺して何もつかなければOK。`, time: (r) => `${r.bakingConfig?.temp || 170}℃・${r.bakingConfig?.time || 40}分` },
    { label: "逆さ吊り冷却（重要）", desc: () => "焼き上がったらすぐに型ごと逆さにして吊るして冷ます。これにより生地が自重で潰れず、ふんわりした食感が保たれる。竹串を横に刺して逆さに吊るすと良い。", time: "完全に冷めるまで（約2時間）" },
  ],

  "pizza": [
    { label: "生地を作る", desc: () => "ボウルに強力粉・塩・イーストを入れ混ぜる。水とオリーブオイルを加えてひとまとめにし、なめらかになるまでこねる。", time: "約8分" },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 28}℃で発酵させる。2倍程度に膨らめばOK。冷蔵庫で一晩発酵させると風味が増す。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 30}分` },
    { label: "分割・ベンチタイム", desc: () => "2〜3等分にして丸め、濡れ布巾をかけて15分休ませる。生地がリラックスして伸ばしやすくなる。", time: "15分" },
    { label: "成形", desc: () => "打ち粉をした台の上で手またはめん棒で薄く丸く伸ばす（直径25〜30cm・厚さ3mm程度）。クッキングシートを敷いた天板にのせる。", time: null },
    { label: "トッピング", desc: () => "トマトソースを薄く塗り、お好みの具材をのせ、チーズを散らす。生地の端（耳）はトッピングしない。", time: null },
    { label: "焼成", desc: (r) => `${r.bakingConfig?.temp || 250}℃（最高温度）に予熱したオーブンで${r.bakingConfig?.time || 10}分焼く。チーズがとろけて端がこんがりすればOK。`, time: (r) => `${r.bakingConfig?.temp || 250}℃・${r.bakingConfig?.time || 10}分` },
    { label: "仕上げ", desc: () => "お好みでバジルをのせて完成。熱いうちに食べるのが一番おいしい。", time: null },
  ],

  "cinnamon_roll": [
    { label: "生地を作る", desc: () => "ボウルに強力粉・砂糖・塩・イーストを入れ混ぜる。牛乳・卵・バターを加えてなめらかになるまでこねる。", time: "約12分" },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 28}℃で発酵させる。2倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 60}分` },
    { label: "フィリングを作る", desc: () => "室温のバター・砂糖・シナモンパウダーをよく混ぜ合わせてフィリングを作る。", time: null },
    { label: "成形", desc: () => "生地を25×35cmの長方形に伸ばす。フィリングを端1cmを残して均一に塗る。手前からきつく巻いてロール状にする。", time: null },
    { label: "カット・二次発酵", desc: (r) => `3cm幅にカットして型や天板に並べる。${r.fermentConfig?.second?.temp || 35}℃で発酵させる。ひとまわり大きくなればOK。`, time: (r) => `${r.fermentConfig?.second?.temp || 35}℃・${r.fermentConfig?.second?.time || 30}分` },
    { label: "焼成", desc: (r) => `${r.bakingConfig?.temp || 180}℃に予熱したオーブンで${r.bakingConfig?.time || 18}分焼く。表面がきつね色になればOK。`, time: (r) => `${r.bakingConfig?.temp || 180}℃・${r.bakingConfig?.time || 18}分` },
    { label: "アイシング", desc: () => "粉砂糖に牛乳を少量加えてとろりとしたアイシングを作る。焼き上がった熱いうちにかける。", time: null },
  ],

  "grissini": [
    { label: "生地を作る", desc: () => "ボウルに強力粉・塩・イーストを入れ混ぜる。水とオリーブオイルを加えてひとまとめにし、なめらかになるまでこねる。", time: "約8分" },
    { label: "一次発酵", desc: (r) => `ラップをかけて${r.fermentConfig?.first?.temp || 28}℃で発酵させる。1.5倍程度に膨らめばOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 30}分` },
    { label: "成形", desc: () => "生地を薄く伸ばし、1cm幅に切る。両手で転がしながら30〜40cmの細長い棒状に成形する。天板に並べる。", time: null },
    { label: "仕上げ・焼成", desc: (r) => `表面にオリーブオイルを薄く塗り、岩塩やゴマ・ハーブをお好みでふる。${r.bakingConfig?.temp || 200}℃に予熱したオーブンで${r.bakingConfig?.time || 15}分焼く。全体がカリッと乾いた感じになればOK。`, time: (r) => `${r.bakingConfig?.temp || 200}℃・${r.bakingConfig?.time || 15}分` },
    { label: "冷ます", desc: () => "網の上で完全に冷ます。冷めるとさらにカリカリになる。密閉容器で2〜3日保存可能。", time: null },
  ],

  "ciabatta": [
    { label: "生地を作る（パンチのみ）", desc: () => "ボウルに強力粉・塩・イーストを入れ混ぜる。水を一度に加えてひとまとめにする。こねない。超高加水なので非常にべたつくが正常。", time: null },
    { label: "フォールド（折りたたみ）①", desc: () => "30分後、濡れた手で生地の端を引っ張って中央に折り込む（4方向から）。これを「コイルフォールド」と呼ぶ。こねる代わりにこの作業でグルテンを作る。", time: "30分後" },
    { label: "フォールド②③④", desc: () => "さらに30分ごとに同じ折りたたみを3回繰り返す。回を重ねるごとに生地に弾力が出てくる。", time: "30分×3回" },
    { label: "一次発酵", desc: (r) => `最後のフォールドから${r.fermentConfig?.first?.temp || 28}℃でさらに発酵させる。生地が2倍になりプツプツと気泡が見えればOK。`, time: (r) => `${r.fermentConfig?.first?.temp || 28}℃・${r.fermentConfig?.first?.time || 60}分` },
    { label: "成形（最小限に）", desc: () => "打ち粉をたっぷりした台に生地をそっと出す。生地を傷めないよう最小限の動作で長方形に整える。カードで2〜3分割する。", time: null },
    { label: "二次発酵", desc: (r) => `打ち粉をした布の上に置いて${r.fermentConfig?.second?.temp || 28}℃で発酵させる。ふっくら膨らめばOK。`, time: (r) => `${r.fermentConfig?.second?.temp || 28}℃・${r.fermentConfig?.second?.time || 30}分` },
    { label: "焼成", desc: (r) => `${r.bakingConfig?.temp || 230}℃に予熱したオーブンと天板を準備。生地をそっと熱した天板に移す。蒸気を出して${r.bakingConfig?.time || 25}分焼く。表面がパリッとして中に大きな気泡ができればOK。`, time: (r) => `${r.bakingConfig?.temp || 230}℃・${r.bakingConfig?.time || 25}分` },
    { label: "仕上げ", desc: () => "網の上で冷ます。切ると大きな不規則な気泡（チャバタの特徴）が見える。完全に冷めてからカットすると断面がきれい。", time: null },
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
