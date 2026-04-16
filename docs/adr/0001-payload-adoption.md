# ADR 0001: Payload を core の基盤に採用する

## 状態

Accepted

## 背景

Studio99 Application Core では、auth、admin、collection、global、versions、jobs をひとまとめで扱いたい。

## 決定

Payload を core の基盤に採用する。

- collection / global / access / hook を同じ設計で持てる
- Admin UI と API を同じ schema から持てる
- versions と Local API を共通土台として使える
- jobs と restore の考え方を core に寄せやすい

## 理由

- 毎回 auth と admin を作り直すコストを下げられる
- tenant boundary を access で固定しやすい
- `src/core` に責務を寄せやすい
- project 側は独自 UX に集中できる

## 結果

- core の data model は Payload を軸に固定する
- generated types と import map を運用に含める
- Payload 以外の役割は project / worker / infra に分ける

