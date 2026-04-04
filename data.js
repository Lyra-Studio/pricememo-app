// ============================================================
// DATA
// ============================================================
// 【データの場所】SAMPLE_DATA 配列を編集してください。
// 【各フィールドの意味】
//   productName  : 商品名（必須）
//   store        : 店名（必須）
//   mainCategory : 大カテゴリ — 食品 / コスメ / 日用品 など（必須）
//   subCategory  : 比較カテゴリ — 豆腐 / 日焼け止め など（必須）
//   price        : 価格・円（必須）
//   amount       : 量（省略可）
//   unit         : 単位 g / ml / 個 / 本 など（省略可）
//   memo         : メモ（省略可）
// ※ unit が g または ml のとき unitPrice を自動計算
// ============================================================
const SAMPLE_DATA = [
  // ── 食品：カット野菜 ──
  { productName:'野菜セット',                                                                              store:'セブン',        mainCategory:'食品', subCategory:'カット野菜',           price: 127, amount:260,  unit:'g',  memo:'少し量が多い' },
  { productName:'ニラもやし炒め',                                                                           store:'ファミマ',       mainCategory:'食品', subCategory:'カット野菜',           price: 116, amount:225,  unit:'g',  memo:'ポイントがたまる' },
  // ── 食品：豆腐 ──
  { productName:'国産木綿豆腐',                                                                             store:'セブン',        mainCategory:'食品', subCategory:'豆腐',                 price: 149, amount:450,  unit:'g',  memo:'' },
  { productName:'カナダorアメリカ産 木綿豆腐',                                                              store:'マックスバリュ', mainCategory:'食品', subCategory:'豆腐',                 price:  88, amount:450,  unit:'g',  memo:'' },
  { productName:'カナダorアメリカ産 木綿豆腐',                                                              store:'ファミマ',       mainCategory:'食品', subCategory:'豆腐',                 price: 128, amount:450,  unit:'g',  memo:'' },
  // ── 食品：卵 ──
  { productName:'卵',                                                                                      store:'マックスバリュ', mainCategory:'食品', subCategory:'卵',                   price: 258, amount:10,   unit:'個', memo:'' },
  // ── 食品：そば ──
  { productName:'そば',                                                                                    store:'マックスバリュ', mainCategory:'食品', subCategory:'そば',                 price: 246, amount:400,  unit:'g',  memo:'' },
  { productName:'そば',                                                                                    store:'ファミマ',       mainCategory:'食品', subCategory:'そば',                 price: 248, amount:300,  unit:'g',  memo:'' },
  // ── 食品：米 ──
  { productName:'玄米 新潟県産こしいぶき 2kg 令和7年産',                                                    store:'Amazon',        mainCategory:'食品', subCategory:'米',                   price:1609, amount:2000, unit:'g',  memo:'' },
  { productName:'パールライス 秋田県産 玄米 あきたこまち 2kg',                                               store:'Amazon',        mainCategory:'食品', subCategory:'米',                   price:1757, amount:2000, unit:'g',  memo:'' },
  { productName:'パールライス 新潟県産 玄米 コシヒカリ 2kg',                                                 store:'Amazon',        mainCategory:'食品', subCategory:'米',                   price:1891, amount:2000, unit:'g',  memo:'' },
  { productName:'ミツハシ 【玄米】 美食玄米 900g ( 岩手県産 ひとめぼれ 使用 )',                               store:'Amazon',        mainCategory:'食品', subCategory:'米',                   price:1300, amount:900,  unit:'g',  memo:'' },
  { productName:'もち',                                                                                    store:'マックスバリュ', mainCategory:'食品', subCategory:'米',                   price: 645, amount:700,  unit:'g',  memo:'' },
  // ── 食品：ナッツ ──
  { productName:'素焼きミックスナッツ',                                                                      store:'ファミマ',       mainCategory:'食品', subCategory:'ナッツ',               price: 398, amount:70,   unit:'g',  memo:'' },
  { productName:'ナチュラルナッツ 個包装 7袋',                                                              store:'スギ薬局',       mainCategory:'食品', subCategory:'ナッツ',               price: 429, amount:70,   unit:'g',  memo:'' },
  // ── 食品：ごま ──
  { productName:'すりごま',                                                                                 store:'スギ薬局',       mainCategory:'食品', subCategory:'ごま',                 price: 127, amount:55,   unit:'g',  memo:'' },
  // ── 食品：海藻類 ──
  { productName:'あおさ',                                                                                   store:'スギ薬局',       mainCategory:'食品', subCategory:'海藻類',               price: 127, amount:8,    unit:'g',  memo:'' },
  // ── 食品：パスタソース ──
  { productName:'ママー パスタキッチン カルボナーラ',                                                         store:'マックスバリュ', mainCategory:'食品', subCategory:'パスタソース',         price: 158, amount:1,    unit:'袋', memo:'湯せん' },
  // ── 食品：惣菜 ──
  { productName:'コロッケ（小）2個',                                                                        store:'マックスバリュ', mainCategory:'食品', subCategory:'惣菜',                 price: 128, amount:2,    unit:'個', memo:'' },
  // ── 食品：チルド菓子 ──
  { productName:'牛乳と卵のエクレア',                                                                       store:'マックスバリュ', mainCategory:'食品', subCategory:'チルド菓子',           price:  88, amount:55,   unit:'g',  memo:'' },
  { productName:'シュークリーム',                                                                           store:'スギ薬局',       mainCategory:'食品', subCategory:'チルド菓子',           price: 105, amount:1,    unit:'個', memo:'' },
  // ── 食品：カフェインレスコーヒー ──
  { productName:'ネスカフェ ゴールドブレンド カフェインレス(40杯分) 瓶',                                      store:'Amazon',        mainCategory:'食品', subCategory:'カフェインレスコーヒー', price:1219, amount:80,   unit:'g',  memo:'' },
  { productName:'ネスカフェ ゴールドブレンド カフェインレス(40杯分) 瓶',                                      store:'スギ薬局',       mainCategory:'食品', subCategory:'カフェインレスコーヒー', price:1382, amount:80,   unit:'g',  memo:'' },
  // ── 食品：スティック飲料 ──
  { productName:'ネスレ ふわラテ 香るミルクティー 26P',                                                      store:'Amazon',        mainCategory:'食品', subCategory:'スティック飲料',       price: 519, amount:26,   unit:'本', memo:'' },
  { productName:'ネスレ ふわラテ 香るミルクティー 26P',                                                      store:'スギ薬局',       mainCategory:'食品', subCategory:'スティック飲料',       price: 537, amount:26,   unit:'本', memo:'' },
  { productName:'ネスレ ふわラテ ミルクココア 20P',                                                          store:'マックスバリュ', mainCategory:'食品', subCategory:'スティック飲料',       price: 516, amount:20,   unit:'本', memo:'' },
  { productName:'ネスレ ふわラテ ミルクココア 20P',                                                          store:'スギ薬局',       mainCategory:'食品', subCategory:'スティック飲料',       price: 537, amount:20,   unit:'本', memo:'' },
  { productName:'ネスカフェ ふわラテ ほっこりカフェインレス 20P',                                             store:'スギ薬局',       mainCategory:'食品', subCategory:'スティック飲料',       price: 537, amount:20,   unit:'本', memo:'' },
  // ── 食品：調味料 ──
  { productName:'七味唐辛子',                                                                              store:'Can★Do',        mainCategory:'食品', subCategory:'調味料',               price: 108, amount:15,   unit:'g',  memo:'' },
  { productName:'七味唐辛子',                                                                              store:'スギ薬局',       mainCategory:'食品', subCategory:'調味料',               price: 159, amount:15,   unit:'g',  memo:'' },
  // ── 食品：お菓子 ──
  { productName:'マカダミアチョコ',                                                                         store:'コクミン薬局',   mainCategory:'食品', subCategory:'お菓子',               price: 257, amount:9,    unit:'個', memo:'' },
  { productName:'マカダミアチョコ',                                                                         store:'マックスバリュ', mainCategory:'食品', subCategory:'お菓子',               price: 300, amount:9,    unit:'個', memo:'' },
  // ── コスメ：日焼け止め ──
  { productName:'カインズ UVスプレー SPF50+ PA++++ 250g 顔 髪 からだ',                                       store:'カインズ',       mainCategory:'コスメ', subCategory:'日焼け止め',         price: 980, amount:250,  unit:'g',  memo:'手で塗らなくていい' },
  { productName:'SKIN AQUA トーンアップ 日焼け止め サボンの香り ラベンダー SPF50+ PA++++',                    store:'Amazon',        mainCategory:'コスメ', subCategory:'日焼け止め',         price: 600, amount:80,   unit:'ml', memo:'香りがいい' },
  { productName:'セザンヌ 皮脂テカリ防止下地 ライトブルー',                                                   store:'Amazon',        mainCategory:'コスメ', subCategory:'日焼け止め',         price: 660, amount:30,   unit:'ml', memo:'' },
  // ── コスメ：アイライナー ──
  { productName:'UZU アイオープニングライナー [ブラウンブラック] リキッドアイライナー',                         store:'Amazon',        mainCategory:'コスメ', subCategory:'アイライナー',       price:1100, amount:1,    unit:'本', memo:'出にくい時がある' },
  { productName:'KATE スーパーシャープライナーEX4.0 (ショート筆) BK-1 ホルダー・レフィルセット',               store:'マツキヨ',       mainCategory:'コスメ', subCategory:'アイライナー',       price:1430, amount:1,    unit:'本', memo:'細く書きやすい' },
  { productName:'KATE(ケイト) スーパーシャープライナーEX4.0 BK-1',                                           store:'Amazon',        mainCategory:'コスメ', subCategory:'アイライナー',       price:1430, amount:1,    unit:'本', memo:'インクが出すぎるときがある' },
  // ── コスメ：マスカラ ──
  { productName:'セザンヌ グロウコートマスカラ 01 シアーブラック 6.0g',                                        store:'Amazon',        mainCategory:'コスメ', subCategory:'マスカラ',           price: 660, amount:1,    unit:'本', memo:'' },
  { productName:'MAYBELLINE マスカラ お湯オフ ラッシュニスタ N 01 ブラック',                                   store:'Amazon',        mainCategory:'コスメ', subCategory:'マスカラ',           price:1370, amount:1,    unit:'本', memo:'' },
  { productName:'Milk Touch オールデイスキニー&ロング マスカラ (ブラック) お湯落ち フィルムマスカラ 繊維なし 超極細ブラシ', store:'Amazon', mainCategory:'コスメ', subCategory:'マスカラ',   price:1628, amount:1,    unit:'本', memo:'下睫毛にとても良い。少しダマになりやすい。' },
  // ── コスメ：眉マスカラ ──
  { productName:'rom&nd HAN ALL BROW CARA(02 マイルドウッディー)',                                          store:'Amazon',        mainCategory:'コスメ', subCategory:'眉マスカラ',         price:1210, amount:1,    unit:'本', memo:'' },
  // ── コスメ：ボディローション ──
  { productName:'ヴァセリン アドバンスドリペア ボディローション 600ml',                                        store:'Amazon',        mainCategory:'コスメ', subCategory:'ボディローション',   price:1339, amount:600,  unit:'ml', memo:'' },
  // ── 日用品 ──
  { productName:'Dr.Scholl 靴専用 瞬間消臭×抗菌・防カビ 48時間消臭効果持続',                                  store:'Amazon',        mainCategory:'日用品', subCategory:'靴スプレー',         price: 745, amount:150,  unit:'ml', memo:'' },
  { productName:'ナプキン 16個入り',                                                                        store:'スギ薬局',       mainCategory:'日用品', subCategory:'生理用品',           price: 437, amount:16,   unit:'個', memo:'' },
  { productName:'ナプキン 16個入り',                                                                        store:'マツキヨ',       mainCategory:'日用品', subCategory:'生理用品',           price: 570, amount:16,   unit:'個', memo:'' },
  // ── 美容 ──
  { productName:'ヘアカット、ヘアカラー、白髪染め',                                                           store:'little×RINNE',  mainCategory:'美容',   subCategory:'美容',               price:7900, amount:1,    unit:'回', memo:'' },
  { productName:'フット ネイルケア フットバス＋角質除去＋保湿トリートメント',                                    store:'リッシュ トロワ', mainCategory:'美容',  subCategory:'美容',               price:2200, amount:1,    unit:'回', memo:'' },
];

