import './PropertyPanel.css'

export function PropertyPanel() {
  return (
    <div className="property-panel">
      <div className="property-panel-header">
        <h2 className="property-panel-title">プロパティ</h2>
      </div>
      <div className="property-panel-content">
        <p className="property-panel-placeholder">要素を選択してください</p>
      </div>
    </div>
  )
}
