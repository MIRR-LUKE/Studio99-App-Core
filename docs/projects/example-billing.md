# サンプルプロジェクト billing メモ

- planKey: `example-starter`
- billing の前提は `billing-settings` に揃える
- entitlement check は project 固有の処理より先に shared helper を通す
- 料金や seat 数の細かい条件は project 側にだけ残す
- `console/billing` で見たときに分かる文言にしておく
