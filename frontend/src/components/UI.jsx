import React from 'react';
import { X } from 'lucide-react';

// Import shadcn components
import { Button as ShadcnButton } from "@/components/ui/button"
import { Input as ShadcnInput } from "@/components/ui/input"
import { Badge as ShadcnBadge } from "@/components/ui/badge"
import { Card as ShadcnCard, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Select as ShadcnSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// --- Adapters ---

export const Card = ({ children, className = "" }) => (
    <ShadcnCard className={`shadow-sm ${className}`}>
        {/* We use CardContent to ensure proper padding usually, but generic wrapper works too */}
        <div className="p-6">{children}</div>
    </ShadcnCard>
);

export const Button = ({ children, onClick, variant = "primary", className = "", size = "md" }) => {
    // Map your custom variants to shadcn variants
    const variantMap = {
        primary: "default",
        secondary: "secondary",
        outline: "outline",
        danger: "destructive",
        ghost: "ghost"
    };

    // Map sizes
    const sizeMap = {
        sm: "sm",
        md: "default",
        icon: "icon"
    };

    return (
        <ShadcnButton
            onClick={onClick}
            variant={variantMap[variant] || "default"}
            size={sizeMap[size] || "default"}
            className={className}
        >
            {children}
        </ShadcnButton>
    );
};

export const Input = ({ value, onChange, type = "text", placeholder, className = "", step, min, prefix, suffix, disabled }) => (
    <div className="relative w-full">
        {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
                {prefix}
            </div>
        )}
        <ShadcnInput
            disabled={disabled}
            type={type}
            value={value}
            onChange={onChange}
            step={step}
            min={min}
            placeholder={placeholder}
            className={`${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} ${className}`}
        />
        {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 text-sm">
                {suffix}
            </div>
        )}
    </div>
);

export const Select = ({ value, onChange, options, className = "" }) => {
    // Shadcn Select is complex (composed), so we wrap it to look like a simple HTML select to the parent
    const handleValueChange = (val) => {
        // Create a fake event object to match your existing handlers (e.target.value)
        onChange({ target: { value: val } });
    };

    return (
        <ShadcnSelect value={String(value)} onValueChange={handleValueChange}>
            <SelectTrigger className={`w-full ${className}`}>
                <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </ShadcnSelect>
    );
};

export const Badge = ({ children, color = "blue" }) => {
    // Shadcn badges are usually black/white, but we can stick to 'secondary' or 'outline' 
    // or use custom classes for your colors. For now, let's map to Shadcn variants.
    let variant = "secondary";
    let customClass = "";

    // Optional: Keep your custom colors if you really want them, usually shadcn uses variant="outline" for this
    if (color === "green") customClass = "bg-green-100 text-green-800 hover:bg-green-100";
    if (color === "red") variant = "destructive";
    if (color === "blue") customClass = "bg-blue-100 text-blue-800 hover:bg-blue-100";
    if (color === "orange") customClass = "bg-orange-100 text-orange-800 hover:bg-orange-100";
    if (color === "purple") customClass = "bg-purple-100 text-purple-800 hover:bg-purple-100";

    return (
        <ShadcnBadge variant={variant} className={`font-normal ${customClass}`}>
            {children}
        </ShadcnBadge>
    );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// --- Utils (Keep exactly as before) ---
export const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
export const formatPercent = (val) => `${Number(val).toFixed(1)}%`;
export const calculatePMT = (principal, annualRate, years) => {
    if (principal === 0 || annualRate === 0) return 0;
    const r = (annualRate / 100) / 12;
    const n = years * 12;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};