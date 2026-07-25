import './Screens.css'

export function HelpScreen() {
  return (
    <div className="screen-container">
      <div className="screen-header">
        <h1>ヘルプ・使い方</h1>
        <button className="button-secondary" onClick={() => window.history.back()}>
          戻る
        </button>
      </div>

      <div className="screen-content help-content">
        <section>
          <h2>基本手順</h2>
          <ol>
            <li>「新規プロジェクト」からキャンバスサイズを選んで作成します。</li>
            <li>左の「素材」タブから攻略画像などを読み込みます。</li>
            <li>読み込んだ画像をドラッグしてキャンバスに配置します。</li>
            <li>「テキスト」や「図形」「スタンプ」を使って装飾や注釈を入れます。</li>
            <li>右上の「PNG出力」ボタンで1枚の画像として書き出します。</li>
          </ol>
        </section>

        <section>
          <h2>ショートカットキー</h2>
          <ul>
            <li>
              <strong>Ctrl+Z / Cmd+Z</strong>: 元に戻す
            </li>
            <li>
              <strong>Ctrl+Y / Cmd+Shift+Z</strong>: やり直し
            </li>
            <li>
              <strong>Ctrl+S / Cmd+S</strong>: 手動保存（ブラウザ内保存）
            </li>
            <li>
              <strong>Ctrl+Shift+S / Cmd+Shift+S</strong>: .kampeファイルの書き出し
            </li>
            <li>
              <strong>Delete / Backspace</strong>: 選択した要素の削除
            </li>
            <li>
              <strong>Ctrl+C / Cmd+C</strong>: 選択した要素のコピー
            </li>
            <li>
              <strong>Ctrl+V / Cmd+V</strong>: コピーした要素の貼り付け
            </li>
            <li>
              <strong>Ctrl+G / Cmd+G</strong>: 選択した要素のグループ化
            </li>
            <li>
              <strong>Ctrl+Shift+G / Cmd+Shift+G</strong>: グループ解除
            </li>
            <li>
              <strong>スペースキー + ドラッグ</strong>: キャンバスのパン（移動）
            </li>
            <li>
              <strong>Ctrl + マウスホイール</strong>: キャンバスの拡大・縮小
            </li>
          </ul>
        </section>

        <section>
          <h2>データの保存について</h2>
          <p>
            このアプリは<strong>端末内処理（ローカル）</strong>
            で動作しており、画像などのデータが外部サーバーに送信されることはありません。
            プロジェクトはブラウザ内（IndexedDB）に自動保存されます。
          </p>
          <p>
            別のブラウザや端末にデータを移行したい場合は、一覧画面やショートカットから
            <strong>.kampe</strong>ファイルとして書き出し、移行先で読み込んでください。
          </p>
        </section>

        <section>
          <h2>著作権上の注意</h2>
          <p>
            攻略サイトなどのスクリーンショットや画像を読み込む際は、各サイト・著作者の利用規約に従って私的利用の範囲内などでご利用ください。
            第三者の権利を侵害する画像の公開や共有には十分ご注意ください。
          </p>
        </section>
      </div>
    </div>
  )
}
