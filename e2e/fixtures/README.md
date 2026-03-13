# specv E2E テストドキュメント

specv の各機能を確認するためのテスト用ドキュメントです。

---

## 画像表示 (Issue #7)

ローカル画像が正しく表示されることを確認してください。

### 同一ディレクトリ参照

![Test Image](./images/test.png)

上に青いグラデーションの画像（200x80）が表示されていれば OK です。

### 外部画像

![GitHub Mark](https://github.githubassets.com/favicons/favicon.svg)

GitHub のファビコンが表示されていれば OK です。

---

## リンクナビゲーション (Issue #8)

### 内部リンク

以下のリンクをクリックすると、サイドバーで別の `.md` ファイルが選択され、プレビューが切り替わります。

- [docs/linked.md](./docs/linked.md) — 同一階層のサブディレクトリへ
- [docs/guide/getting-started.md](./docs/guide/getting-started.md) — ネストされたディレクトリへ

### 外部リンク

以下のリンクは新しいタブで開きます（`target="_blank"` 属性付き）。

- [External Link](https://example.com) — 新しいタブで開くことを確認
- [GitHub](https://github.com) — 新しいタブで開くことを確認

---

## コードブロック (Issue #14)

コードブロックにマウスを乗せると、右上にコピーボタンが表示されます。

### JavaScript

```javascript
const greet = (name) => {
  return `Hello, ${name}!`;
};

console.log(greet("specv"));
```

### TypeScript

```typescript
interface User {
  name: string;
  age: number;
}

const formatUser = (user: User): string => {
  return `${user.name} (${user.age})`;
};
```

### Shell

```bash
# specv を起動
npx specv

# ポート指定
npx specv -p 3000
```

---

## GFM (GitHub Flavored Markdown)

### テーブル

| 機能                 | ステータス | Issue |
| -------------------- | ---------- | ----- |
| 画像パス解決         | 実装済み   | #7    |
| リンクナビゲーション | 実装済み   | #8    |
| コードブロックコピー | 実装済み   | #14   |

### タスクリスト

- [x] 画像が表示される
- [x] 内部リンクでファイル遷移する
- [x] 外部リンクが新しいタブで開く
- [x] コピーボタンが表示される
- [ ] このチェックボックスは未チェック

### 取り消し線

~~この機能は廃止されました~~

---

## テキスト装飾

- **太字テキスト**
- _斜体テキスト_
- `インラインコード`
- [リンクテキスト](https://example.com)

> これは引用ブロックです。
> 複数行にわたる引用も正しく表示されるはずです。

---

## 見出しレベル

見出し（h1, h2）には下線が表示されます。

# h1 見出し

## h2 見出し

### h3 見出し

#### h4 見出し

##### h5 見出し
