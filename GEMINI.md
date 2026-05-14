# Project Instructions: pan-recipe-ai

このファイルには、プロジェクト全体の設計方針、コーディング規約、および開発時の注意事項が記載されています。

## プロジェクト概要
Next.jsベースのAIパンレシピ生成・管理アプリケーション。

## 技術スタック
- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript / JavaScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand (`src/store/useRecipeStore.ts`)
- **DB/Auth**: Supabase
- **AI生成**: Google Generative AI, Groq

## 主要ディレクトリと役割
- `src/app/`: ルーティングとAPI
    - `api/generate/route.js`: AIレシピ生成のメインロジック
- `src/lib/`: コアロジック
    - `baker.js`: パン作りの専門ロジック（配合計算など）
    - `matcher.js`: マッチングアルゴリズム
    - `recommend.js`: 推奨ロジック
- `src/components/`: UIコンポーネント
- `src/store/`: Zustandストア

## 開発ガイドライン

### 1. 状態管理とデータ連携
- コードの修正や提案を行う際は、必ず **Zustandストア (`src/store/`)** の状態と、**Supabase** との連携を意識してください。
- データの整合性を保つため、コンポーネント内での局所的な状態管理よりもストアの活用を優先してください。

### 2. スタイリング
- UIの修正やコンポーネントの新規作成時は、**Tailwind CSS** を使用してください。
- 一貫性を保つため、プロジェクト内の既存の配色やスペーシングに従ってください。

### 3. ドメインロジック（パン作り）
- `src/lib/baker.js` などのパン作りに関する専門的なロジックを修正する際は、既存の配合計算や工程の整合性を崩さないよう、細心の注意を払ってください。
- 変更を加える場合は、パン作りの理論的な背景を考慮し、必要に応じて既存の関数を再利用してください。

### 4. AI連携
- AIプロンプトの調整やAPIの修正を行う際は、`src/app/api/generate/route.js` を中心に確認してください。
- レスポンスのパースやエラーハンドリングを適切に行い、ユーザーに分かりやすいフィードバックを提供してください。
