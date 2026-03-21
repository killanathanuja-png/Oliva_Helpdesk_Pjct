import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, AlertTriangle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

let globalId = 0;

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++globalId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const colors = {
    success: "bg-white border-success/30 text-green-700",
    error: "bg-destructive/10 border-destructive/30 text-destructive",
    info: "bg-primary/10 border-primary/30 text-primary",
  };

  const icons = {
    success: <CheckCircle className="h-4 w-4 shrink-0" />,
    error: <AlertTriangle className="h-4 w-4 shrink-0" />,
    info: <Info className="h-4 w-4 shrink-0" />,
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm animate-fade-in text-sm font-medium ${colors[toast.type]}`}>
      {icons[toast.type]}
      <span>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-60 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
