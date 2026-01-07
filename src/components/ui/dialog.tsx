"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

const DialogContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => { } })

export const Dialog: React.FC<DialogProps> = ({ children, open = false, onOpenChange = () => { } }) => {
    if (!open) return null
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 flex items-center justify-center p-4">
                {children}
            </div>
        </DialogContext.Provider>
    )
}

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
    const { onOpenChange } = React.useContext(DialogContext)

    return (
        <div
            className={cn(
                "relative w-full max-w-lg gap-4 border bg-zinc-950 p-5 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 rounded-xl border-zinc-800 sm:rounded-lg max-h-[85vh] overflow-y-auto",
                className
            )}
            {...props}
        >
            <button
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-zinc-950 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-zinc-800 data-[state=open]:text-zinc-400"
                onClick={() => onOpenChange(false)}
            >
                <X className="h-4 w-4 text-zinc-400" />
                <span className="sr-only">Close</span>
            </button>
            {children}
        </div>
    )
}

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-white", className)} {...props} />
)

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
    <p className={cn("text-sm text-zinc-400", className)} {...props} />
)
