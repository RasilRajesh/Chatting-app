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
    { name: "Blue", id: "blue", hex: "#60a5fa" },
    { name: "Rose", id: "rose", hex: "#fb7185" },
    { name: "Green", id: "green", hex: "#4ade80" },
    { name: "Violet", id: "violet", hex: "#a78bfa" },
    { name: "Orange", id: "orange", hex: "#fb923c" },
    { name: "Slate", id: "slate", hex: "#94a3b8" },
];

const FONTS = [
    { id: "sans", name: "Modern Sans" },
    { id: "serif", name: "Classic Serif" },
    { id: "mono", name: "Clean Mono" },
    { id: "playful", name: "Playful" },
];

const BACKGROUNDS = [
    { id: "default", name: "Default", color: "bg-background" },
    { id: "whatsapp", name: "WhatsApp", color: "bg-[#e5ddd5]" },
    { id: "blue", name: "Sky Blue", color: "bg-[#d1e1f0]" },
    { id: "midnight", name: "Midnight", color: "bg-[#020617]" },
    { id: "olive", name: "Olive", color: "bg-[#f7fee7]" },
    { id: "lavender", name: "Lavender", color: "bg-[#f5f3ff]" },
    { id: "sepia", name: "Sepia", color: "bg-[#fdf6e3]" },
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
                                    <span className={cn(
                                        "text-[10px] leading-tight font-medium",
                                        f.id === "serif" ? "font-serif" :
                                            f.id === "mono" ? "font-mono" :
                                                f.id === "playful" ? "font-theme-playful" :
                                                    "font-sans"
                                    )}>
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
                                        "flex flex-col items-center gap-1.5 p-2 rounded-md border-2 transition-all",
                                        bg === b.id ? "border-primary bg-primary/5 shadow-sm" : "border-muted hover:border-muted-foreground/30"
                                    )}
                                >
                                    <div className={cn("h-4 w-full rounded-sm shadow-inner", b.color)} />
                                    <span className="text-[9px] font-medium leading-none">{b.name}</span>
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
