# SRP（単一責任の原則）

単一責任の原則に基づくレビュー基準。関数・モジュール・クラスが「変更理由」を 1 つに保てているかを審査する。

## 原則

| 原則                          | 基準                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| 単一の変更理由                | 1 関数 / 1 モジュールに対し、変更を引き起こす理由は 1 つだけ |
| 責務名と実装の一致            | 関数名・型名が示す責務と実装内容が乖離していない             |
| ファサード／orchestrator 純度 | 呼び出しの組み立てとビジネスロジックを同一層に同居させない   |
| テスタビリティ                | 依存を外部から差し替えられ、責務単位で単体テストできる       |

## 単一の変更理由

1 つの関数 / モジュールが複数の変更理由を持つ場合、片方の都合で他方が壊れる。「整形」「永続化」「通知」のように要求元が異なる処理を 1 関数に詰め込まない。

| 判定   | 基準                                                             |
| ------ | ---------------------------------------------------------------- |
| REJECT | 1 関数が要求元の異なる 2 つ以上の処理を抱えている                |
| REJECT | 仕様変更時に同じ関数を別チーム・別都合で同時に編集する必要がある |
| OK     | 関数ごとに変更理由が 1 つに収まり、改修対象が一意に決まる        |

```typescript
// REJECT - 整形・永続化・通知の 3 つの変更理由を 1 関数が抱える
async function registerUser(input: UserInput) {
  const user = { ...input, name: input.name.trim() }; // 整形ルール変更で改修
  await db.users.insert(user); // 永続化方式変更で改修
  await mailer.send(user.email, "welcome"); // 通知文面変更で改修
}

// OK - 変更理由ごとに関数を分離
function normalizeUser(input: UserInput): User {
  return { ...input, name: input.name.trim() };
}
async function saveUser(user: User) {
  await db.users.insert(user);
}
async function notifyWelcome(user: User) {
  await mailer.send(user.email, "welcome");
}
```

## 責務名と実装の一致

関数名・型名は責務の宣言。名前が宣言する範囲を超えた処理を実装に紛れ込ませない。読み手は名前を信じてコードを追うため、名前と実装の乖離はバグの温床になる。

| 判定   | 基準                                                                        |
| ------ | --------------------------------------------------------------------------- |
| REJECT | `formatX` / `parseX` / `getX` などの命名で、副作用（DB 書き込み等）が起きる |
| REJECT | 名前から推測できない処理（バリデーション・送信・ログ出力）が含まれる        |
| OK     | 関数名が宣言する責務と実装内容が一致している                                |

```typescript
// REJECT - formatUser が整形に加えてバリデーションと永続化までこなす
function formatUser(input: UserInput): User {
  if (!input.email.includes("@")) throw new Error("invalid email");
  const user = { ...input, name: input.name.trim() };
  db.users.insert(user); // 名前に表れない副作用
  return user;
}

// OK - 整形のみ。バリデーションと永続化は呼び出し側で別関数として組み立てる
function formatUser(input: UserInput): User {
  return { ...input, name: input.name.trim() };
}
function validateUser(input: UserInput): void {
  if (!input.email.includes("@")) throw new Error("invalid email");
}
```

## ファサード／orchestrator の純度

ファサード・ユースケース層・orchestrator は「下位層の呼び出しを順序立てて組み立てる」ことが責務。ここにビジネスルールを書き込むと、再利用とテストの両方が崩れる。

| 判定   | 基準                                                                 |
| ------ | -------------------------------------------------------------------- |
| REJECT | orchestrator が if 分岐や計算式でビジネスルールを表現している        |
| REJECT | サービス層と orchestrator の両方に同じドメインロジックが分散している |
| OK     | orchestrator は呼び出しの順序制御のみ。判定・計算はサービスに委ねる  |

```typescript
// REJECT - orchestrator が割引計算（ドメインロジック）を抱えている
async function checkout(cart: Cart) {
  const subtotal = cart.items.reduce((sum, i) => sum + i.price, 0);
  const discount = cart.coupon === "VIP" ? subtotal * 0.2 : 0; // ドメインルール
  await payment.charge(cart.user, subtotal - discount);
  await mailer.send(cart.user.email, "receipt");
}

// OK - 計算はサービスに集約し、orchestrator は呼び出し順だけを担う
async function checkout(cart: Cart) {
  const total = pricing.calculateTotal(cart);
  await payment.charge(cart.user, total);
  await mailer.send(cart.user.email, "receipt");
}
```

## テスタビリティ

責務が分離されていても、依存が硬く結合していれば単体テストが書けない。外部リソース・現在時刻・ランダム値のような揺らぐ依存は、引数または DI で外から差し替えられる形にする。

| 判定   | 基準                                                                          |
| ------ | ----------------------------------------------------------------------------- |
| REJECT | 関数内で `new` した依存・モジュールスコープのグローバルに直接アクセスしている |
| REJECT | `Date.now()` / `Math.random()` / 環境変数を関数内で直接参照している           |
| OK     | 依存が引数または DI で受け取れ、モックに差し替えて単体テストできる            |

```typescript
// REJECT - 内部で new するため Repository / 時計を差し替えられない
class OrderService {
  place(order: Order) {
    const repo = new OrderRepository();
    repo.save({ ...order, placedAt: Date.now() });
  }
}

// OK - 依存を外から受け取り、テストでモック・固定時計を注入できる
class OrderService {
  constructor(
    private repo: OrderRepository,
    private now: () => number
  ) {}
  place(order: Order) {
    this.repo.save({ ...order, placedAt: this.now() });
  }
}
```
