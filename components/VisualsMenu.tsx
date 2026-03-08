import React from 'react';
import type { VisualSettings } from '../types';

interface VisualsMenuProps {
    settings: VisualSettings;
    onUpdate: (newSettings: Partial<VisualSettings>) => void;
    onClose: () => void;
    isTouchDevice: boolean;
}

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-lg text-gray-100">{label}</span>
        <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="toggle-checkbox absolute block w-7 h-7 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <label className="toggle-label block overflow-hidden h-7 rounded-full bg-gray-600 cursor-pointer"></label>
        </div>
    </div>
);

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1">
            <span className="text-lg text-gray-100">{label}</span>
            <span className="text-lg font-bold text-white bg-black/40 px-2 py-0.5 rounded">{Math.round(value * 100)}%</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#e6c58d]"
        />
    </div>
);

const Select: React.FC<{ label: string; value: string; options: {value: string, label: string}[]; onChange: (value: any) => void }> = ({ label, value, options, onChange}) => (
     <div className="flex items-center justify-between">
        <span className="text-lg text-gray-100">{label}</span>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="ui-button !py-2 !px-3"
        >
            {options.map(opt => <option className="bg-[#824f21] font-bold" key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);


const VisualsMenu: React.FC<VisualsMenuProps> = ({ settings, onUpdate, onClose, isTouchDevice }) => {

    const resetToDefaults = () => {
        onUpdate({
            pixelPerfect: true,
            screenShake: true,
            particleDensity: 1.0,
            floatingText: true,
            backgroundEffects: true,
            characterAttachments: true,
            touchControlsOpacity: 0.5,
            showTouchControls: false,
        });
    };

    return (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm" onClick={onClose}>
            <div className="ui-panel w-full max-w-xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h2 className="ui-title text-center mb-8">VISUAL SETTINGS</h2>
                
                <div className="space-y-6 bg-black/30 p-4 rounded-lg border-2 border-[#5c3716]">
                     <ToggleSwitch 
                        label="Pixel-Perfect Rendering"
                        checked={settings.pixelPerfect}
                        onChange={(v) => onUpdate({ pixelPerfect: v })}
                    />
                    <hr className="border-[#5c3716]/50" />
                    <ToggleSwitch 
                        label="Screen Shake"
                        checked={settings.screenShake}
                        onChange={(v) => onUpdate({ screenShake: v })}
                    />
                     <ToggleSwitch 
                        label="Floating Text"
                        checked={settings.floatingText}
                        onChange={(v) => onUpdate({ floatingText: v })}
                    />
                    <ToggleSwitch 
                        label="Background Effects"
                        checked={settings.backgroundEffects}
                        onChange={(v) => onUpdate({ backgroundEffects: v })}
                    />
                    <ToggleSwitch 
                        label="Character Attachments"
                        checked={settings.characterAttachments}
                        onChange={(v) => onUpdate({ characterAttachments: v })}
                    />
                    <Slider 
                        label="Particle Density"
                        value={settings.particleDensity}
                        onChange={(v) => onUpdate({ particleDensity: v })}
                        min={0} max={1.5} step={0.05}
                    />
                    {isTouchDevice && (
                        <>
                            <hr className="border-[#5c3716]/50" />
                            <ToggleSwitch 
                                label="Show On-Screen Controls"
                                checked={settings.showTouchControls}
                                onChange={(v) => onUpdate({ showTouchControls: v })}
                            />
                            <Slider 
                                label="Touch Controls Opacity"
                                value={settings.touchControlsOpacity}
                                onChange={(v) => onUpdate({ touchControlsOpacity: v })}
                                min={0} max={1} step={0.01}
                            />
                        </>
                    )}
                </div>

                <div className="flex justify-between items-center mt-10">
                     <button onClick={resetToDefaults} className="ui-button !bg-yellow-600 !border-yellow-400 hover:!bg-yellow-500 disabled:!bg-gray-600">
                        Reset
                    </button>
                    <button onClick={onClose} className="ui-button">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisualsMenu;