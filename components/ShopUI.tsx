import React, { useState } from 'react';
import { UPGRADES, UPGRADE_ORDER, LIFE_COST } from '../constants/upgrades';
import type { UpgradesState, UpgradeId } from '../types';

interface ShopUIProps {
    coins: number;
    upgrades: UpgradesState;
    onBuyLife: () => boolean;
    onBuyUpgrade: (upgradeId: UpgradeId) => boolean;
    onClose: () => void;
}

const ShopUI: React.FC<ShopUIProps> = ({ coins, upgrades, onBuyLife, onBuyUpgrade, onClose }) => {
    const [feedback, setFeedback] = useState('');
    const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('error');

    const handleBuy = (buyFn: () => boolean) => {
        const success = buyFn();
        if (success) {
            setFeedback('Purchase successful!');
            setFeedbackType('success');
        } else {
            setFeedback("Not enough coins!");
            setFeedbackType('error');
        }
        setTimeout(() => setFeedback(''), 2000);
    };

    const canAffordLife = coins >= LIFE_COST;

    return (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40 backdrop-blur-sm" onClick={onClose}>
            <div className="ui-panel w-full max-w-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b-4 border-[#5c3716] pb-4">
                    <h2 className="ui-title">UPGRADES</h2>
                    <div className="bg-[#5c3716] border-2 border-[#e6c58d] rounded-lg px-4 py-2 flex items-center gap-2">
                        <span className="text-3xl font-bold text-yellow-300">💰</span>
                        <span className="text-3xl font-bold text-white">{coins}</span>
                    </div>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {/* Item Row: Life */}
                    <div className="bg-black/30 p-4 rounded-lg flex items-center justify-between border-2 border-transparent hover:border-[#e6c58d] transition-all">
                        <div className="flex items-center gap-4">
                            <span className="text-5xl drop-shadow-lg">❤️</span>
                            <div>
                                <h3 className="text-2xl font-semibold text-white text-left">Extra Life</h3>
                                <p className="text-lg text-yellow-300 font-bold">Cost: {LIFE_COST} Coins</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleBuy(onBuyLife)}
                            disabled={!canAffordLife}
                            className="ui-button !bg-green-600 !border-green-400 hover:!bg-green-500 disabled:!bg-gray-600"
                        >
                            Buy
                        </button>
                    </div>

                    {/* Upgrade Rows */}
                    {UPGRADE_ORDER.map(upgradeId => {
                        const upgrade = UPGRADES[upgradeId];
                        const currentLevel = upgrades[upgradeId];
                        const isMaxLevel = currentLevel >= upgrade.maxLevel;
                        const cost = isMaxLevel ? 0 : upgrade.costs[currentLevel];
                        const canAffordUpgrade = coins >= cost;
                        
                        return (
                            <div key={upgrade.id} className="bg-black/30 p-4 rounded-lg flex items-center justify-between border-2 border-transparent hover:border-[#e6c58d] transition-all">
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl drop-shadow-lg">{upgrade.icon}</span>
                                    <div className="text-left">
                                        <h3 className="text-2xl font-semibold text-white">{upgrade.name}</h3>
                                        <p className="text-lg text-gray-300">
                                            Level {currentLevel} / {upgrade.maxLevel}
                                        </p>
                                        {!isMaxLevel && (
                                            <p className="text-lg text-yellow-300 font-bold">
                                                Next: {upgrade.effectDescription(currentLevel)} &middot; Cost: {cost}
                                            </p>
                                        )}
                                        {isMaxLevel && (
                                             <p className="text-lg text-green-400 font-bold">Max Level Reached!</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleBuy(() => onBuyUpgrade(upgrade.id))}
                                    disabled={!canAffordUpgrade || isMaxLevel}
                                    className="ui-button !bg-blue-600 !border-blue-400 hover:!bg-blue-500 disabled:!bg-gray-600 w-32"
                                >
                                    {isMaxLevel ? 'MAX' : 'Upgrade'}
                                </button>
                            </div>
                        )
                    })}
                </div>
                
                {feedback && (
                    <p className={`mt-4 text-lg text-center font-semibold ${feedbackType === 'success' ? 'text-green-300' : 'text-red-400'}`}>
                        {feedback}
                    </p>
                )}

                <button onClick={onClose} className="mt-8 ui-button w-full">
                    Close
                </button>
            </div>
        </div>
    );
};

export default ShopUI;