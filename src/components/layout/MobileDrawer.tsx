import React, { useEffect, useRef } from 'react'
import './MobileDrawer.css'

type MobileDrawerProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  position?: 'bottom' | 'left' | 'right'
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="mobile-drawer-overlay"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className={`mobile-drawer-content position-${position}`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
        ref={drawerRef}
      >
        <div className="mobile-drawer-header">
          <h2 className="mobile-drawer-title">{title}</h2>
          <button
            className="mobile-drawer-close"
            onClick={onClose}
            aria-label="閉じる"
            title="閉じる"
          >
            ✕
          </button>
        </div>
        <div className="mobile-drawer-body">{children}</div>
      </div>
    </div>
  )
}
