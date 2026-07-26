/// <reference types="vite-plugin-pwa/client" />
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useAutoSave } from '../../features/projects/useAutoSave'
import './UpdateToast.css'

export function UpdateToast() {
  const { triggerImmediateSave } = useAutoSave()

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error)
    },
  })

  const handleUpdate = async () => {
    // Before updating, save any pending changes
    triggerImmediateSave()
    // Small delay to ensure save completes (in reality we should await it if triggerImmediateSave returned a promise)
    // Wait for auto save to finish
    await new Promise((resolve) => setTimeout(resolve, 500))
    updateServiceWorker(true)
  }

  const handleClose = () => {
    setNeedRefresh(false)
  }

  if (!needRefresh) return null

  return (
    <div className="update-toast">
      <div className="update-toast-content">
        <p>新しいバージョンが利用可能です。</p>
        <div className="update-toast-actions">
          <button className="update-toast-btn primary" onClick={handleUpdate}>
            更新する
          </button>
          <button className="update-toast-btn" onClick={handleClose}>
            あとで
          </button>
        </div>
      </div>
    </div>
  )
}
