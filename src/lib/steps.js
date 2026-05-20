import { supabase } from "./supabase";

/**
 * プレースホルダーを置換するヘルパー
 */
function resolveTemplate(template, context) {
  if (!template) return null;
  return template.replace(/\{\{(.+?)\}\}/g, (match, key) => {
    return context[key] !== undefined ? context[key] : match;
  });
}

/**
 * 工程テンプレートを取得 (DB駆動版)
 */
export async function getStepsTemplate(texture, method, timeCondition, recipeData) {
  // 1. group_key の決定
  const baseKey = `${texture}_${method}`;
  const stepsType = recipeData?.profile?.steps_type;
  
  let groupKey = baseKey;

  // 特殊製法（croissant, bagel等）があれば優先
  // "standard" は汎用的な値なので、baseKey（ふんわり_オーブン等）を優先する
  if (stepsType && stepsType !== "standard") {
    groupKey = stepsType;
  } else if (timeCondition === "一晩") {
    groupKey = "一晩_オーブン";
  }

  console.log(`[getStepsTemplate] Fetching steps for groupKey: ${groupKey} (base: ${baseKey}, type: ${stepsType})`);

  // 2. DBから全ステップ取得
  let { data: steps, error } = await supabase
    .from('master_steps')
    .select('*')
    .eq('group_key', groupKey)
    .order('step_order', { ascending: true });

  // データが空の場合の最終フォールバック
  if ((!steps || steps.length === 0) && groupKey !== "ふんわり_オーブン") {
    console.warn(`[getStepsTemplate] Steps empty for ${groupKey}, trying fallback to ふんわり_オーブン`);
    const fallbackRes = await supabase
      .from('master_steps')
      .select('*')
      .eq('group_key', "ふんわり_オーブン")
      .order('step_order', { ascending: true });
    steps = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) {
    console.error(`[getStepsTemplate] DB Error:`, error);
    return [];
  }

  if (!steps || steps.length === 0) {
    console.error(`[getStepsTemplate] No steps found in DB for ${groupKey} or fallback.`);
    return [];
  }

  console.log(`[getStepsTemplate] Successfully fetched ${steps.length} steps.`);

  // 3. プレースホルダー用のコンテキスト準備
  const hasButter = (recipeData.profile?.butter || 0) > 0;
  const isHard = texture === "ハード系";

  const context = {
    texture: texture,
    method: method,
    baking_temp: recipeData.bakingConfig?.temp || 180,
    baking_time: recipeData.bakingConfig?.time || 15,
    f1_temp: recipeData.fermentConfig?.first?.temp || 30,
    f1_time: recipeData.fermentConfig?.first?.time || 30,
    f2_temp: recipeData.fermentConfig?.second?.temp || 35,
    f2_time: recipeData.fermentConfig?.second?.time || 20,
    butter_note: hasButter ? "無塩バターは室温に戻す。" : "",
    butter_note_short: hasButter ? "バターは小さく切っておく。" : "",
    
    // 一晩発酵用の複雑な分岐の事前計算
    overnight_knead_desc: hasButter
      ? "粉類と水・イーストを混ぜてひとまとめにし、バターを加えて8〜10分こねる。グルテン膜ができればOK。"
      : "粉類と水・イーストを混ぜてひとまとめにし、10〜15分こねる。グルテン膜ができればOK。",
    overnight_shaping_desc: isHard
      ? "バゲットは細長く、ブールは丸く成形する。とじ目を下にしてクッキングシートを敷いた天板に並べる。"
      : "好みの形に成形し、とじ目を下にして型や天板に並べる。",
    overnight_baking_desc: isHard
      ? `表面にクープ（切り込み）を入れる。${recipeData.bakingConfig?.temp || 220}℃に予熱したオーブンで${recipeData.bakingConfig?.time || 18}分焼く。最初の10分は蒸気を出すと皮がパリッと仕上がる。`
      : `${recipeData.bakingConfig?.temp || 180}℃に予熱したオーブンで${recipeData.bakingConfig?.time || 15}分焼く。焼き色がついたらアルミホイルをかぶせてOK。`,
    overnight_finishing_desc: isHard
      ? "網の上で冷ます。粗熱が取れてからカットすると断面がきれい。"
      : "型から出して網の上で冷ます。",

    // クロワッサン用
    croissant_butter_dough: recipeData.profile?.butter ? Math.round(recipeData.profile.butter * 0.3) + "%" : "少量",
    croissant_butter_sheet: Math.round((recipeData.profile?.butter || 30) * 0.7)
  };

  // 4. 置換して返却
  return steps.map((s, i) => {
    // ステップごとに個別の置換を行うが、バター系の注釈は全体で制御
    let desc = resolveTemplate(s.description_template, context);
    
    // ハード系かつバター0の場合、バターに関する記述を強制的に削除または空文字にする
    if (!hasButter && desc) {
      desc = desc.replace("無塩バターは室温に戻す。", "").replace("バターは小さく切っておく。", "");
    }

    return {
      index: i + 1,
      label: s.label,
      desc: desc,
      time: resolveTemplate(s.time_template, context),
    };
  });
}
