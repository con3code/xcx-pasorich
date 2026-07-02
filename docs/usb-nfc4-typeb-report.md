# USB-NFC4 / ISO/IEC 14443 Type B（マイナンバーカード）対応 技術調査レポート

作成日: 2026-07-03
対象: PaSoRich（Xcratch 拡張機能）

## 背景と目的

PaSoRich は WebUSB API を用いて SONY 製 IC カードリーダー RC-S380 / RC-S300 から
FeliCa（Type F）カードの IDm を読み取る Xcratch 拡張機能である。
今後、マイナンバーカード等の ISO/IEC 14443 Type B 準拠カードの ID 読み取りと、
アイ・オー・データ機器製リーダー USB-NFC4 への対応可能性を検討した。

## 結論（要約）

| 検討項目 | 結論 |
| --- | --- |
| USB-NFC4 を WebUSB から直接利用 | **不可能**（CCID 専用リーダーであり、Chrome が Smart Card クラスの claim をブロックするため） |
| Type B カードの読み取り自体 | **既対応の RC-S300 で技術的に可能**（透過セッションのプロトコル切替で実現できる見込み） |
| Type B カードの「固有 ID」取得 | **原理的に不可**（PUPI は読み取りのたびにランダム生成される仕様のため、FeliCa の IDm のような不変 ID にならない） |

## 1. USB-NFC4 を直接サポートできない理由

### 1.1 USB-NFC4 は純粋な CCID / PC-SC リーダー

- USB-NFC4 は Windows 上でスマートカードリーダー「**CIR315 CL**」（Circle 社チップ）として認識される。
- [公式仕様](https://www.iodata.jp/product/interface/iccardreader/usb-nfc4/spec.htm)で対応 API は **PC/SC** のみ。
  対応カードは ISO 14443 Type A/B、ISO 15693、FeliCa。
- つまり USB 上では標準の **CCID（Smart Card デバイスクラス, interfaceClass 0x0B）** としてのみ振る舞い、
  OS の CCID ドライバ（Windows: usbccid / WinSCard、macOS: CryptoTokenKit・pcscd）が占有する。

### 1.2 Chrome の WebUSB は Smart Card クラスを「保護インターフェイスクラス」としてブロック

- Chromium は WebUSB からの `claimInterface()` に対し、Audio / Video / HID / Mass Storage /
  **Smart Card (0x0B)** / Wireless Controller の各クラスを保護対象としてブロックし、`SecurityError` を返す
  （[Intent to Implement and Ship: WebUSB Interface Class Filtering](https://groups.google.com/a/chromium.org/g/blink-dev/c/LZXocaeCwDw)）。
- これはブラウザ側の恒久的なセキュリティポリシーであり、OS レベルのドライバ差し替え等の回避策も塞がれている。
- **PaSoRich が RC-S300 を WebUSB で扱えているのは、RC-S300 が CCID インターフェイスとは別に
  ベンダー固有クラス（interfaceClass 255）のインターフェイスを持っている**ためである
  （現行コードの `setupDevice()` は class 255 のインターフェイスを選択して claim している）。
  USB-NFC4 にはこのようなベンダー固有インターフェイスが存在しないため、同じ手法は使えない。

### 1.3 Web Smart Card API も現状は利用不可

- W3C WICG で [Web Smart Card API](https://wicg.github.io/web-smart-card/) （ブラウザから PC/SC を叩く API）が
  策定中だが、[Chrome の実装](https://chromestatus.com/feature/6411735804674048)は
  **ChromeOS 限定かつ Isolated Web Apps（IWA）限定**である。
  通常の Web ページとして動く Xcratch からは利用できず、Windows / macOS への展開時期も未定。

### 1.4 USB-NFC4 を使う唯一の現実的手段: ネイティブブリッジ

USB-NFC4（および任意の PC/SC リーダー）を使うには、ブラウザの外に PC/SC を叩く常駐アプリを置き、
拡張機能とは WebSocket（`ws://localhost:...`）等で通信する構成しかない。

```
[Xcratch/PaSoRich] ⇔ WebSocket ⇔ [常駐ブリッジアプリ (PC/SC)] ⇔ USB-NFC4
```

- 利点: USB-NFC4 に限らず市販の PC/SC リーダー全般が使える。Type B の APDU 交換も自由。
- 欠点: **利用者ごとにアプリのインストールが必要**で、教育現場での配布・保守のハードルが高い。
  Windows / macOS それぞれのビルド・署名・配布の維持コストも大きい。
  「URL を読み込むだけで動く」という Xcratch 拡張の利点が失われる。

## 2. 代替案: 既対応の RC-S300 で Type B を読む（将来実装の推奨ルート)

RC-S300 のハードウェア自体は ISO 14443 Type A/B 対応であり（マイナンバーカード対応を公式に謳う）、
PaSoRich が現在使っているベンダーインターフェイス経由の**透過セッション（PC/SC 2.0 Part 3 擬似 APDU）**で
プロトコルを Type B に切り替えれば、**追加ハードなし・WebUSB のまま** Type B カードを検出できる見込みである。

現行実装（Type F）のコマンド列:

```
FF 50 00 02 04 8F 02 03 00 00   ... Switch Protocol → Type F (FeliCa)
FF 50 00 01 ... (Transparent Exchange: FeliCa Polling)
```

Type A の実績（RC-S300 + WebUSB で MIFARE UID を読んだ公開事例あり）:

```
FF 50 00 02 04 8F 02 00 03 00   ... Switch Protocol → ISO 14443 Type A
FF CA 00 00                     ... GET DATA (UID 取得)
```

Type B はこれの類推で、Switch Protocol のデータオブジェクト `8F 02 <standard> <layer>` を
Type B（ISO 14443-3 B）に向けたうえで `FF CA 00 00`（GET DATA）または
Transparent Exchange で REQB を送り、ATQB 応答から PUPI（4 バイト）を得る流れになる。
正確なパラメーター値は PC/SC 2.0 Part 3 仕様と実機での検証が必要だが、
リーダーのハード・既存の通信路がそのまま使えるため実装リスクは小さい。

なお RC-S380 は nfcpy 等の実績から Type A/B のポーリング（InSetRF のパラメーター変更）が可能であり、
同様の拡張余地がある。

## 3. 重要な制約: Type B カードに「固有 ID」は存在しない

- FeliCa の IDm、MIFARE(Type A) の UID に相当する Type B の識別子は **PUPI
  (Pseudo-Unique PICC Identifier)** だが、マイナンバーカードを含む近年の Type B カードは
  **プライバシー保護のため読み取り（活性化）のたびにランダムな PUPI を返す**。
- したがって「カードをかざしたことの検知」はできるが、**PUPI を出席確認などの個人識別 ID として
  使うことはできない**。この点は Type B 対応を実装する場合、ブロックの説明やドキュメントに明記すべきである。
- 安定した不変 ID が必要な場合の代替は、JPKI（公的個人認証）の**利用者証明用電子証明書のシリアル番号**を
  APDU（SELECT AP → READ BINARY）で読み出す方式である。証明書の読み出し自体は PIN 不要だが、
  ISO 14443-4 (ISO-DEP) 上での本格的な APDU 交換の実装が必要で、かつ電子証明書という
  個人情報に紐づくデータを扱うため、教育用途では慎重な検討（利用目的・保存方法・同意）が必要。

## 4. 推奨まとめ

1. **USB-NFC4 の直接対応は見送る**。技術的にブラウザ（WebUSB）からアクセス不能であり、
   回避には常駐アプリの配布が必要になるため、Xcratch 拡張の配布モデルと合わない。
2. Type B 検出のニーズが確定したら、**RC-S300 の透過セッション拡張**として実装するのが最小コスト。
   その際は「PUPI は毎回変わる（個人識別には使えない）」ことを仕様として明記する。
3. Web Smart Card API が Windows / macOS の通常 Web ページに開放された場合は、
   USB-NFC4 を含む PC/SC リーダー対応を再検討する価値がある（要ウォッチ）。

## 参考資料

- [USB-NFC4 製品ページ](https://www.iodata.jp/product/interface/iccardreader/usb-nfc4/) /
  [仕様](https://www.iodata.jp/product/interface/iccardreader/usb-nfc4/spec.htm)（PC/SC のみ、CIR315 CL として認識）
- [Intent to Implement and Ship: WebUSB Interface Class Filtering（blink-dev）](https://groups.google.com/a/chromium.org/g/blink-dev/c/LZXocaeCwDw)
- [Web Smart Card API（WICG Draft）](https://wicg.github.io/web-smart-card/) /
  [Chrome Platform Status](https://chromestatus.com/feature/6411735804674048) /
  [HOWTO（ChromeOS + IWA 限定）](https://github.com/WICG/web-smart-card/blob/main/HOWTO.md)
- [Sony RC-S300 製品情報（Type A/B・マイナンバーカード対応）](https://www.sony.co.jp/Products/felica/consumer/products/RC-S300.html)
- [RC-S300 × WebUSB で FeliCa IDm と MIFARE UID を読む実装事例（Qiita）](https://qiita.com/MarioninC/items/b5c59e78f3e23c06b83f)
- [RC-S300 × WebUSB で Read Without Encryption する事例（Qiita）](https://qiita.com/sabaaba/items/29e127274a3c6a83ee3d)
- [NFC のセキュリティの話（ネットエージェント）— Type B の PUPI がランダムであることの解説](https://www.netagent.co.jp/study/blog/hard/20180628.html)
