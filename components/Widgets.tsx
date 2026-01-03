import React, { useState, useEffect } from 'react';
import { Calculator, X, Zap, Upload, Sparkles, Sword, Brain, Feather, Dna, Activity, Ghost } from 'lucide-react';
import { NenType } from '../types';

// Utils for color and icons
const ATTR_ICONS: any = { strength: Sword, intelligence: Brain, charisma: Feather, determination: Dna, constitution: Activity, prestidigitation: Ghost };
const PALETTE = ['#e74c3c', '#8e44ad', '#3498db', '#f1c40f', '#2ecc71', '#e67e22', '#1abc9c', '#9b59b6', '#34495e'];
const getColor = (key: string, index: number) => (ATTR_ICONS[key] ? undefined : PALETTE[index % PALETTE.length]); // Use predefined colors in App.tsx logic usually, but here we helper

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon?: React.ReactNode;
  isEditing: boolean;
  onChange?: (val: number) => void;
  onMaxChange?: (val: number) => void;
  onOpenCalculator?: () => void;
}

export const StatBar: React.FC<StatBarProps> = ({ label, current, max, color, icon, isEditing, onChange, onMaxChange, onOpenCalculator }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className="flex flex-col w-full mb-4 group relative z-10">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-[0.2em] opacity-90" style={{ color: color, textShadow: `0 0 10px ${color}` }}>
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center text-lg font-bold font-mono text-white">
          {!isEditing && onOpenCalculator && (
            <button onClick={onOpenCalculator} className="mr-2 text-gray-500 hover:text-white transition-colors opacity-50 hover:opacity-100 z-20 relative" title="Calculadora">
              <Calculator size={14} />
            </button>
          )}
          <input type="number" readOnly={!isEditing} value={current} onChange={(e) => onChange?.(parseInt(e.target.value) || 0)} className="w-12 bg-transparent text-right outline-none text-white font-bold border-b border-transparent focus:border-white/50 relative z-20" />
          <span className="mx-1 text-gray-600">/</span>
          {isEditing ? <input type="number" value={max} onChange={(e) => onMaxChange?.(parseInt(e.target.value) || 0)} className="w-12 bg-white/5 rounded px-1 text-center outline-none border border-white/10 text-white relative z-20" /> : <span className="text-gray-500 w-12 text-center">{max}</span>}
        </div>
      </div>
      <div className="relative h-4 bg-black/60 border border-white/10 rounded-full overflow-hidden shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
        <div className="h-full transition-all duration-700 ease-out relative z-10" style={{ width: `${percentage}%`, background: `linear-gradient(180deg, ${color}60 0%, ${color} 50%, ${color}30 100%)`, boxShadow: `0 0 20px ${color}` }}>
          <div className="absolute top-1 left-0 right-0 h-[2px] bg-white/40 blur-[1px]"></div>
        </div>
      </div>
    </div>
  );
};

export const CalculatorModal: React.FC<{ isOpen: boolean; onClose: () => void; target: any; onConfirm: (val: number) => void }> = ({ isOpen, onClose, target, onConfirm }) => {
    const [value, setValue] = useState('');
    useEffect(() => { if (isOpen) setValue(''); }, [isOpen]);
    if (!isOpen || !target) return null;

    const handleApply = (type: 'add' | 'sub') => {
        const numVal = parseInt(value) || 0;
        if (numVal === 0) return;
        onConfirm(type === 'sub' ? -numVal : numVal);
        onClose();
    };
    const isHp = target.field.toLowerCase().includes('hp');
    
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-xs p-8 neon-border relative flex flex-col items-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors z-20"><X size={20}/></button>
              <h3 className="text-xs font-tech text-theme uppercase tracking-[0.2em] mb-4 text-glow">{target.label}</h3>
              
              <div className="text-5xl font-mono font-bold text-white mb-6 flex items-baseline gap-2 drop-shadow-lg">
                  <span>{target.current}</span>
                  <span className="text-xl text-gray-600">/</span>
                  <span className="text-xl text-gray-500">{target.max}</span>
              </div>

              <div className="w-full bg-black/60 border border-white/20 p-4 mb-6 flex items-center justify-center rounded-lg relative z-10 shadow-inner">
                   <input type="number" autoFocus placeholder="0" className="bg-transparent text-center text-4xl font-mono text-white w-full placeholder-gray-700 focus:outline-none"
                      value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleApply('sub'); }} />
              </div>

              <div className="flex gap-2 mb-6 w-full justify-center relative z-10">
                  {[1, 5, 10, 50].map(v => (
                      <button key={v} onClick={() => setValue(v.toString())} className="bg-white/5 hover:bg-white/20 border border-white/10 text-xs font-mono py-2 px-4 rounded text-gray-400 hover:text-white transition-colors">{v}</button>
                  ))}
              </div>

              <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                  <button onClick={() => handleApply('sub')} className={`py-4 ${isHp ? 'bg-red-500/10 hover:bg-red-500/30 border-red-500/50 text-red-400' : 'bg-orange-500/10 hover:bg-orange-500/30 border-orange-500/50 text-orange-400'} border rounded font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg`}>
                      {isHp ? 'Dano (-)' : 'Gastar (-)'}
                  </button>
                  <button onClick={() => handleApply('add')} className={`py-4 ${isHp ? 'bg-green-500/10 hover:bg-green-500/30 border-green-500/50 text-green-400' : 'bg-blue-500/10 hover:bg-blue-500/30 border-blue-500/50 text-blue-400'} border rounded font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg`}>
                      {isHp ? 'Curar (+)' : 'Recuperar (+)'}
                  </button>
              </div>
          </div>
      </div>
    );
};

export const AttributesRadar: React.FC<{ attributes: any; labels: any; size?: number; color: string }> = ({ attributes, labels, size = 200, color }) => {
    const keys = Object.keys(attributes);
    const count = keys.length;
    if(count < 3) return null;

    const center = size / 2;
    const radius = size * 0.35; 
    const maxVal = 10; const minVal = -2; const range = maxVal - minVal;

    const getPoint = (val: number, i: number) => {
        const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
        const normalized = Math.max(0, (Math.min(maxVal, val) - minVal) / range);
        const r = radius * normalized;
        return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
    };
    const polyPoints = keys.map((k, i) => getPoint(attributes[k], i).join(',')).join(' ');

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none pointer-events-none drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
            <defs><filter id="radar-glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            {/* Background Web */}
            {[0.25, 0.5, 0.75, 1].map((scale, idx) => (
                <polygon key={idx} points={keys.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
                    return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
                }).join(' ')} fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray={idx === 3 ? "0" : "2 2"} />
            ))}
            {/* Axes & Labels */}
            {keys.map((k, i) => {
                 const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
                 const labelRadius = radius + 25;
                 
                 const lx = center + Math.cos(angle) * labelRadius;
                 const ly = center + Math.sin(angle) * labelRadius;
                 
                 const Icon = ATTR_ICONS[k] || Sparkles;
                 const attrColor = ATTR_ICONS[k] ? '#e0e0e0' : (PALETTE[i % PALETTE.length]); // Simplified color logic
                 const val = attributes[k];
                 const valText = val >= 0 ? `+${val}` : val;
                 
                 return (
                    <g key={i}>
                        <line x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="rgba(255,255,255,0.05)" />
                        <foreignObject x={lx - 10} y={ly - 10} width={20} height={20}>
                            <div className="flex items-center justify-center w-full h-full"><Icon size={14} style={{color: attrColor}} /></div>
                        </foreignObject>
                        <text x={lx} y={ly + 12} textAnchor="middle" dominantBaseline="middle" fill={attrColor} fontSize="10" className="font-mono font-bold" style={{textShadow: `0 0 5px ${attrColor}`}}>{valText}</text>
                    </g>
                 )
            })}
            {/* Data */}
            <polygon points={polyPoints} fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" style={{filter: 'url(#radar-glow)'}} className="transition-all duration-500"/>
            {keys.map((k, i) => {
                const [x, y] = getPoint(attributes[k], i) as [number, number];
                return <circle key={i} cx={x} cy={y} r="3" fill="white" className="transition-all duration-500 shadow-lg"/>
            })}
        </svg>
    )
};

interface AttributeCardProps {
    label: string;
    value: number;
    icon: React.ElementType;
    imageUrl?: string;
    color: string;
    isEditing: boolean;
    onRoll?: () => void;
    onChange: (val: number) => void;
    onLabelChange: (val: string) => void;
    onUpload: () => void;
    onDelete?: () => void;
}

export const AttributeCard: React.FC<AttributeCardProps> = ({ label, value, icon: Icon, imageUrl, color, isEditing, onRoll, onChange, onLabelChange, onUpload, onDelete }) => {
    return (
        <div className="relative w-full aspect-square flex flex-col items-center justify-center p-2 group cursor-pointer" onClick={!isEditing ? onRoll : undefined}>
            <div className="absolute inset-0 rounded-full border border-white/5 bg-black/40 shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 group-hover:border-white/20 group-hover:shadow-[0_0_30px_var(--attr-color)] group-hover:scale-105" style={{ '--attr-color': color } as React.CSSProperties}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50"></div>
                {/* Spinning Rings */}
                <div className="absolute inset-0 animate-spin-slow opacity-30">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="1" fill="none" strokeDasharray="20 10" />
                        <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="0.5" fill="none" strokeDasharray="5 5" />
                    </svg>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                <div className="w-10 h-10 mb-2 relative flex items-center justify-center">
                    {imageUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30 shadow-[0_0_10px_var(--attr-color)] relative z-10 bg-black">
                            <img src={imageUrl} className="w-full h-full object-cover" alt={label} />
                        </div>
                    ) : (
                        <div className="drop-shadow-[0_0_10px_var(--attr-color)] transition-transform duration-300 group-hover:scale-110" style={{ color }}>
                            {Icon ? <Icon size={28} /> : <Zap size={28} />}
                        </div>
                    )}
                    {isEditing && (
                        <button onClick={(e) => { e.stopPropagation(); onUpload(); }} className="absolute -bottom-2 -right-2 bg-black/80 text-white p-1 rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors z-20 shadow-lg">
                            <Upload size={10} />
                        </button>
                    )}
                </div>
                {isEditing ? (
                    <input type="number" value={value} onClick={e => e.stopPropagation()} onChange={(e) => onChange(parseInt(e.target.value) || 0)} className="w-16 bg-transparent text-center text-white font-mono text-2xl font-bold border-b border-white/20 outline-none" />
                ) : (
                    <span className="text-3xl font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(0,0,0,0.8)] transition-all duration-300 group-hover:text-glow" style={{ textShadow: `0 0 15px ${color}` }}>
                        {value >= 0 ? `+${value}` : value}
                    </span>
                )}
                {isEditing ? (
                    <input value={label} onClick={e => e.stopPropagation()} onChange={e => onLabelChange(e.target.value)} className="text-[10px] font-tech uppercase tracking-widest text-gray-400 mt-1 text-center w-full bg-transparent border-b border-white/10" />
                ) : (
                    <span className="text-[9px] font-tech uppercase tracking-[0.2em] text-gray-400 mt-1 text-center group-hover:text-white transition-colors">{label}</span>
                )}
                {isEditing && onDelete && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="absolute top-1 right-1 text-red-500 hover:text-white bg-black/50 rounded-full p-1 transition-colors z-30">
                        <X size={10} />
                    </button>
                )}
            </div>
        </div>
    );
};

export const NenHexagon: React.FC<{ activeType: NenType; size?: number }> = ({ activeType, size = 160 }) => {
    const typeOrder = [NenType.Enhancer, NenType.Transmuter, NenType.Conjurer, NenType.Specialist, NenType.Manipulator, NenType.Emitter];
    const points = [{ x: 50, y: 10, l: 'Reforço' }, { x: 84.6, y: 30, l: 'Trans.' }, { x: 84.6, y: 70, l: 'Mat.' }, { x: 50, y: 90, l: 'Esp.' }, { x: 15.4, y: 70, l: 'Man.' }, { x: 15.4, y: 30, l: 'Emis.' }];

    const NEN_COLORS: Record<string, string> = {
        [NenType.Enhancer]: '#2ecc71', [NenType.Transmuter]: '#d500f9', [NenType.Emitter]: '#29b6f6',
        [NenType.Conjurer]: '#ff1744', [NenType.Manipulator]: '#ff6d00', [NenType.Specialist]: '#ffea00',
    };
    const activeColor = NEN_COLORS[activeType] || '#fff';

    const getEfficiencies = (type: NenType) => {
        const index = typeOrder.indexOf(type);
        return typeOrder.map((t, i) => {
            if (type === NenType.Specialist) return t === NenType.Specialist ? 1.0 : (t === NenType.Conjurer || t === NenType.Manipulator ? 0.8 : (t === NenType.Enhancer ? 0.4 : 0.6));
            if (t === NenType.Specialist) return 0.0;
            let dist = Math.abs(index - i);
            if (dist > 3) dist = 6 - dist;
            return Math.max(0, 1.0 - (dist * 0.2));
        });
    };
    const efficiencies = getEfficiencies(activeType);
    const polyPoints = points.map((p, i) => {
        const eff = Math.max(0.1, efficiencies[i]);
        return `${50 + (p.x - 50) * eff},${50 + (p.y - 50) * eff}`;
    }).join(' ');

    return (
        <div className="relative flex items-center justify-center pointer-events-none" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
                <polygon points={points.map(p => `${50 + (p.x - 50) * 0.6},${50 + (p.y - 50) * 0.6}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

                {points.map((p, i) => (
                    <g key={i}>
                        <text x={p.x} y={p.y < 50 ? p.y - 6 : p.y + 12} textAnchor="middle" fontSize="6" fill={efficiencies[i] === 1 ? activeColor : '#666'} className="font-tech font-bold uppercase tracking-wide" style={{ textShadow: efficiencies[i] === 1 ? `0 0 5px ${activeColor}` : 'none' }}>{p.l}</text>
                        <text x={p.x} y={p.y < 50 ? p.y - 13 : p.y + 18} textAnchor="middle" fontSize="4" fill={efficiencies[i] > 0 ? '#888' : '#333'} className="font-mono">{(efficiencies[i] * 100).toFixed(0)}%</text>
                    </g>
                ))}
                <polygon points={polyPoints} fill={activeColor} fillOpacity="0.2" stroke={activeColor} strokeWidth="2" strokeLinejoin="round" style={{ filter: 'url(#glow)' }} className="transition-all duration-700" />
                <circle cx="50" cy="50" r="1.5" fill="white" opacity="0.8" />
            </svg>
        </div>
    );
};