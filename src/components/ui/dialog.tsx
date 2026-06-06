import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

let openDialogCount = 0;
const prev = {
  rootPointerEvents: "",
  bodyPosition: "",
  bodyTop: "",
  bodyLeft: "",
  bodyWidth: "",
  bodyHeight: "",
  bodyOverflow: "",
  bodyOverscroll: "",
  htmlOverscroll: "",
  scrollY: 0,
};

const lockBackground = () => {
  if (typeof document === "undefined") return;
  if (openDialogCount === 0) {
    const root = document.getElementById("root");
    const html = document.documentElement;
    const body = document.body;
    prev.scrollY = window.scrollY;
    if (root) {
      prev.rootPointerEvents = root.style.pointerEvents;
      root.style.pointerEvents = "none";
    }
    prev.bodyPosition = body.style.position;
    prev.bodyTop = body.style.top;
    prev.bodyLeft = body.style.left;
    prev.bodyWidth = body.style.width;
    prev.bodyHeight = body.style.height;
    prev.bodyOverflow = body.style.overflow;
    prev.bodyOverscroll = body.style.overscrollBehavior;
    prev.htmlOverscroll = html.style.overscrollBehavior;
    body.style.position = "fixed";
    body.style.top = `-${prev.scrollY}px`;
    body.style.left = "0";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    html.style.overscrollBehavior = "none";
  }
  openDialogCount += 1;
};

const unlockBackground = () => {
  if (typeof document === "undefined") return;
  openDialogCount = Math.max(0, openDialogCount - 1);
  if (openDialogCount === 0) {
    const root = document.getElementById("root");
    const html = document.documentElement;
    const body = document.body;
    if (root) {
      root.style.pointerEvents = prev.rootPointerEvents || "auto";
    }
    body.style.position = prev.bodyPosition;
    body.style.top = prev.bodyTop;
    body.style.left = prev.bodyLeft;
    body.style.width = prev.bodyWidth;
    body.style.height = prev.bodyHeight;
    body.style.overflow = prev.bodyOverflow;
    body.style.overscrollBehavior = prev.bodyOverscroll || "";
    html.style.overscrollBehavior = prev.htmlOverscroll || "";
    window.scrollTo(0, prev.scrollY);
  }
};


const Dialog = ({ open, defaultOpen, onOpenChange, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const isOpen = open ?? internalOpen;

  React.useEffect(() => {
    if (!isOpen) return;
    lockBackground();
    return unlockBackground;
  }, [isOpen]);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  return <DialogPrimitive.Root open={open} defaultOpen={defaultOpen} onOpenChange={handleOpenChange} {...props} />;
};

const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-dialog-scroll-area="true"
      style={{ pointerEvents: "auto", overscrollBehaviorY: "contain" }}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
