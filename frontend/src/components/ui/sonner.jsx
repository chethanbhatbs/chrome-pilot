import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({
  ...props
}) => {
  // Detect theme from document class (CRA — no next-themes)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <Sonner
      theme={isDark ? 'dark' : 'light'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:text-[11px] group-[.toaster]:font-body",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[10px]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:text-[10px] group-[.toast]:font-heading group-[.toast]:font-semibold",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:text-[10px]",
          success:
            "group-[.toaster]:!border-primary/30 group-[.toaster]:!bg-primary/10 group-[.toaster]:!text-primary [&>svg]:!text-primary",
          error:
            "group-[.toaster]:!border-destructive/30 group-[.toaster]:!bg-destructive/10 group-[.toaster]:!text-destructive [&>svg]:!text-destructive",
          info:
            "group-[.toaster]:!border-primary/20 group-[.toaster]:!bg-primary/5 group-[.toaster]:!text-foreground [&>svg]:!text-primary",
        },
      }}
      {...props} />
  );
}

export { Toaster, toast }
