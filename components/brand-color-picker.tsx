"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    ColorPicker,
    ColorPickerAlphaSlider,
    ColorPickerArea,
    ColorPickerContent,
    ColorPickerEyeDropper,
    ColorPickerFormatSelect,
    ColorPickerHueSlider,
    ColorPickerInput,
    ColorPickerSwatch,
    ColorPickerTrigger,
} from "@/components/ui/color-picker";

const presetColors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#64748b", // gray
];

type BrandColorPickerProps = {
    value?: string;
    onChange?: (value: string) => void;
};

export function BrandColorPicker({ value = "#3b82f6", onChange }: BrandColorPickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleColorChange = React.useCallback(
        (newColor: string) => {
            onChange?.(newColor);
        },
        [onChange]
    );

    const onReset = React.useCallback(() => {
        const resetColor = "#000000";
        onChange?.(resetColor);
        setIsOpen(false);
    }, [onChange]);

    const onPresetSelect = React.useCallback(
        (presetColor: string) => {
            onChange?.(presetColor);
        },
        [onChange]
    );

    return (
        <div className="flex flex-row gap-4 items-center">
            <div className="flex items-center gap-3">
                <ColorPicker
                    value={value}
                    onValueChange={handleColorChange}
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    defaultFormat="hex"
                >
                    <ColorPickerTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                            <ColorPickerSwatch className="size-4" />
                            {value?.toUpperCase() || "Brand Color"}
                        </Button>
                    </ColorPickerTrigger>
                    <ColorPickerContent>
                        <ColorPickerArea />
                        <div className="flex items-center gap-2">
                            <ColorPickerEyeDropper />
                            <div className="flex flex-1 flex-col gap-2">
                                <ColorPickerHueSlider />
                                <ColorPickerAlphaSlider />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <ColorPickerFormatSelect />
                            <ColorPickerInput />
                        </div>

                        {/* Optional reset button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={onReset}
                        >
                            Reset
                        </Button>
                    </ColorPickerContent>
                </ColorPicker>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                    {presetColors.map((presetColor) => (
                        <button
                            key={presetColor}
                            type="button"
                            className="cursor-pointer size-8 rounded border-2 border-transparent hover:border-border focus:border-ring focus:outline-none"
                            style={{ backgroundColor: presetColor }}
                            onClick={() => onPresetSelect(presetColor)}
                            aria-label={`Select color ${presetColor}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}