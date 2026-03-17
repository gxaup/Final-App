import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isReportGenerated = title === "Report Generated";
        return (
          <Toast 
            key={id} 
            {...props}
            className={isReportGenerated ? "toast-slide-left overflow-hidden" : ""}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            {isReportGenerated && (
              <div 
                className="toast-countdown-bar absolute bottom-0 left-0 h-1 rounded-full"
                style={{ animationDuration: "5s" }}
              />
            )}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
