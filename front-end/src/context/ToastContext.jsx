import { createContext, useCallback, useContext, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import './Toast.css'

const ToastContext = createContext({ pushToast: () => {} })

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback(({ message, level = 'warning', title }) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, level, title }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 6000)
  }, [])

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.level}`}>
            <AlertTriangle size={16} />
            <div className="toast-body">
              {t.title && <strong>{t.title}</strong>}
              <span>{t.message}</span>
            </div>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Đóng">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
