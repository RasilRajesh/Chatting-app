"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, Moon, Sun, Monitor, Loader2, Type } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENTS = [
    { name: "Blue", id: "blue", hex: "#3b82f6" },
    { name: "Rose", id: "rose", hex: "#e11d48" },
    { name: "Green", id: "green", hex: "#166534" },
    { name: "Violet", id: "violet", hex: "#8b5cf6" },
    { name: "Orange", id: "orange", hex: "#f97316" },
    { name: "Slate", id: "slate", hex: "#64748b" },
];

const FONTS = [
    { id: "sans", name: "Modern Sans" },
    { id: "serif", name: "Classic Serif" },
    { id: "mono", name: "Clean Mono" },
];

const BACKGROUNDS = [
    { id: "default", name: "Default" },
    { id: "whatsapp", name: "WhatsApp" },
    { id: "blue", name: "Sky Blue" },
    { id: "slate", name: "Slate" },
];

const BUBBLE_STYLES = [
    { id: "rounded", name: "Rounded" },
    { id: "sharp", name: "Sharp" },
    { id: "glass", name: "Glass" },
];

export function ThemeSettingsModal({
    open,
    onOpenChange,
    currentUser,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUser: any;
}) {
    const updateTheme = useMutation(api.users.updateTheme);
    const [accent, setAccent] = useState(currentUser?.themeSettings?.accentColor || "blue");
    const [font, setFont] = useState(currentUser?.themeSettings?.fontFamily || "sans");
    const [bg, setBg] = useState(currentUser?.themeSettings?.chatBackground || "default");
    const [style, setStyle] = useState(currentUser?.themeSettings?.bubbleStyle || "rounded");
    const [mode, setMode] = useState(currentUser?.themeSettings?.mode || "system");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentUser?.themeSettings) {
            const { accentColor, fontFamily, chatBackground, bubbleStyle, mode } = currentUser.themeSettings;

            // Only set state if the value is one of our valid IDs
            if (ACCENTS.some(a => a.id === accentColor)) setAccent(accentColor);
            if (FONTS.some(f => f.id === fontFamily)) setFont(fontFamily);
            if (BACKGROUNDS.some(b => b.id === chatBackground)) setBg(chatBackground);
            if (BUBBLE_STYLES.some(s => s.id === bubbleStyle)) setStyle(bubbleStyle);
            if (mode) setMode(mode);
        }
    }, [currentUser]);

    const handleSave = async () => {
        setSaving(true);
        console.log("Saving theme settings:", { accent, font, bg, style, mode });
        try {
            await updateTheme({
                accentColor: accent,
                fontFamily: font,
                chatBackground: bg,
                bubbleStyle: style,
                mode: mode,
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update theme:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Appearance & Personalization</DialogTitle>
                    <DialogDescription>
                        Customize your interface to match your style.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Accent Color */}
                    <div className="space-y-3">
                        <Label>Accent Color</Label>
                        <div className="flex flex-wrap gap-3">
                            {ACCENTS.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => setAccent(a.id)}
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center",
                                        accent === a.id ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"
                                    )}
                                    style={{ backgroundColor: a.hex }}
                                    title={a.name}
                                >
                                    {accent === a.id && <Check className="h-4 w-4 text-white shadow-sm" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Selection */}
                    <div className="space-y-3">
                        <Label>Font Style</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {FONTS.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFont(f.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-2 rounded-md border-2 transition-all",
                                        font === f.id ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-muted-foreground/30"
                                    )}
                                >
                                    <Type className="h-4 w-4" />
                                    <span className={cn("text-[10px] leading-tight font-medium", f.id === "serif" ? "font-serif" : f.id === "mono" ? "font-mono" : "font-sans")}>
                                        {f.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Background */}
                    <div className="space-y-3">
                        <Label>Chat Wallpaper</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {BACKGROUNDS.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => setBg(b.id)}
                                    className={cn(
                                        "p-2 text-[10px] rounded-md border-2 transition-all font-medium",
                                        bg === b.id ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-muted-foreground/30"
                                    )}
                                >
                                    {b.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bubble Style */}
                    <div className="space-y-3">
                        <Label>Bubble Style</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {BUBBLE_STYLES.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStyle(s.id)}
                                    className={cn(
                                        "p-2 text-[10px] rounded-md border-2 transition-all font-medium",
                                        style === s.id ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-muted-foreground/30"
                                    )}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-3">
                        <Label>Display Mode</Label>
                        <div className="flex gap-2">
                            {[
                                { id: "light", icon: Sun, label: "Light" },
                                { id: "dark", icon: Moon, label: "Dark" },
                                { id: "system", icon: Monitor, label: "System" },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={cn(
                                        "flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                                        mode === m.id ? "border-primary bg-primary/5 shadow-sm font-bold" : "border-muted hover:border-muted-foreground/30"
                                    )}
                                >
                                    <m.icon className="h-4 w-4" />
                                    <span className="text-[10px]">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Apply changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
