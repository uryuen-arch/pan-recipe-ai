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
  let groupKey = `${texture}_${method}`;
  const stepsType = recipeData?.profile?.steps_type;

  // 特殊製法テンプレートがあれば優先
  if (stepsType) {
    groupKey = stepsType;
  } else if (timeCondition === "一晩") {
    // 一晩発酵は専用テンプレート
    groupKey = "一晩_オーブン";
  }

  // 2. DBから全ステップ取得 (一括フェッチ)
  const { data: steps, error } = await supabase
    .from('master_steps')
    .select('*')
    .eq('group_key', groupKey)
    .order('step_order', { ascending: true });

  if (error || !steps || steps.length === 0) {
    console.error(`Steps fetch error for group_key: ${groupKey}`, error);
    // フォールバック: 最低限のデータを返すか、空配列
    return [];
  }

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
  return steps.map((s, i) => ({
    index: i + 1,
    label: s.label,
    desc: resolveTemplate(s.description_template, context),
    time: resolveTemplate(s.time_template, context),
  }));
}
