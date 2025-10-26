import PtoPie from "./PtoPie";

export default function PieDemoPage() {
  // 例：有給の内訳（今年）
  // - 取得済み
  // - 承認待ち（見込み）
  // - 差戻/却下（将来分母に入れないなら 0 に）
  // - 残り日数
  const granted = 12;        // 取得済
  const pending = 2;         // 承認待ち（見込み）
  const rejected = 0;        // 却下・差戻（分母に含めない想定なら 0 に）
  const remaining = 8;       // 残り

  // 分母を「今年の付与総日数」に固定したい場合は totalOverride に設定
  const totalGrantedThisYear = 20;

  const data = [
    { label: "取得済", value: granted },
    { label: "承認待ち", value: pending },
    { label: "残り", value: remaining },
    // { label: "却下/差戻", value: rejected }, // 分母に入れたい時だけ使う
  ];

  return (
    <div className="container py-4">
      <h2 className="mb-3">有給取得サマリ（お試し）</h2>
      <PtoPie
        data={data}
        size={280}
        thickness={48}               // 0にするとドーナツではなく扇形の円グラフ
        totalOverride={totalGrantedThisYear}
        title="今年の有給内訳"
      />
      <p className="text-muted mt-3">
        ※ ダミーデータでの表示。実装時は API の「残日数」「承認待ち合計」「取得済合計」等を差し込みます。
      </p>
    </div>
  );
}
