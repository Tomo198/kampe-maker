import { navigationService } from '../services/navigationService'
import { APP_DISPLAY_NAME } from '../constants/app'
import './Screens.css'

export function HelpScreen() {
  const handleBack = () => {
    navigationService.navigate('/projects')
  }

  return (
    <div className="screen-container">
      <header className="screen-header">
        <h1>{APP_DISPLAY_NAME} - ヘルプ＆使い方ガイド</h1>
        <button className="button-secondary" onClick={handleBack}>
          ← 戻る
        </button>
      </header>

      <main className="screen-content">
        <div className="help-content">
          <section className="help-section">
            <h2>💡 基本操作とキャンバス操作</h2>
            <ul>
              <li>
                <strong>ズーム＆パン:</strong> PCではCtrl +
                マウスホイールで拡大縮小、スペースキーを押しながらドラッグでキャンバス移動。スマホ/タブレットでは2本指のピンチズーム・パンに対応。
              </li>
              <li>
                <strong>全体表示 (Fit):</strong>{' '}
                上部ツールバーの「Fit」ボタンを押すと、キャンバス全体が画面に収まる最適な位置と倍率にリセットされます。
              </li>
              <li>
                <strong>選択と変形:</strong>{' '}
                要素をタップ/クリックで選択し、ハンドルをドラッグして拡大縮小や回転ができます。複数選択はShiftキー＋クリックまたは空領域からのドラッグ。
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h2>🖼️ 素材・スタンプ・テキストの編集</h2>
            <ul>
              <li>
                <strong>画像トリミング:</strong>{' '}
                画像を選択してダブルクリックまたはプロパティの「トリミング」を押すと、画像の自由な切り抜きが可能です。
              </li>
              <li>
                <strong>スタンプとテキスト:</strong>{' '}
                定型スタンプやカスタムテキストを追加して、レイアウトを自在に構成できます。
              </li>
              <li>
                <strong>自動保存:</strong>{' '}
                編集内容はすべてお使いのブラウザ内（IndexedDB）にリアルタイムで自動保存されます。
              </li>
            </ul>
          </section>

          <section className="help-section">
            <h2>📦 データ書き出しとオフライン利用</h2>
            <ul>
              <li>
                <strong>画像書き出し:</strong>{' '}
                上部ツールバーの「画像を保存」ボタンを押すと、高解像度のPNG画像として保存できます。
              </li>
              <li>
                <strong>PWA (オフライン):</strong>{' '}
                このアプリはPWAに対応しており、通信環境がないオフライン状態でもスムーズに利用できます。アプリの更新がある場合は画面右下に通知が表示されます。
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
