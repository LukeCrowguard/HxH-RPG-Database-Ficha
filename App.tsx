import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Zap, Heart, Sword, Brain, Activity, Ghost, Feather, Dna, 
  Dice5, Trash2, Save, Plus, X, Camera, ScrollText, Box, Users, 
  Upload, Share2, Hexagon, Target, PawPrint, Terminal, ChevronRight, 
  ImageIcon, BatteryCharging, AlertCircle, Info, Lock, ChevronUp, ChevronDown, ShieldCheck, Sparkles, Copy
} from 'lucide-react';
import { BackgroundWorld } from './components/Visuals';
import { StatBar, AttributeCard, NenHexagon, CalculatorModal, AttributesRadar } from './components/Widgets';
import { fetchCharacters, saveCharacter, deleteCharacter, INITIAL_CHARACTER, isSupabaseConfigured } from './services/supabase';
import { Character, NenType, Skill } from './types';

// Utils
const ATTR_ICONS: any = { strength: Sword, intelligence: Brain, charisma: Feather, determination: Dna, constitution: Activity, prestidigitation: Ghost };
const ATTR_COLORS: any = { strength: '#c0392b', intelligence: '#8e44ad', charisma: '#27ae60', determination: '#f1c40f', constitution: '#2980b9', prestidigitation: '#e67e22' };
const PALETTE = ['#e74c3c', '#8e44ad', '#3498db', '#f1c40f', '#2ecc71', '#e67e22', '#1abc9c', '#9b59b6', '#34495e'];
const getColor = (key: string, index: number) => ATTR_COLORS[key] || PALETTE[index % PALETTE.length];

const NEN_COLORS: any = {
    [NenType.Enhancer]: '#2ecc71', [NenType.Transmuter]: '#d500f9', [NenType.Emitter]: '#29b6f6',
    [NenType.Conjurer]: '#ff1744', [NenType.Manipulator]: '#ff6d00', [NenType.Specialist]: '#ffea00',
};

const rollDice = (diceStr: string) => {
    try {
        if(!diceStr) return { total: 0, rolls: [], str: diceStr };
        const [count, die] = diceStr.toLowerCase().split('d').map(Number);
        if(!count || !die) return { total: 0, rolls: [], str: diceStr };
        let total = 0;
        let rolls = [];
        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * die) + 1;
            rolls.push(r);
            total += r;
        }
        return { total, rolls, str: diceStr };
    } catch (e) { return { total: 0, rolls: [], str: diceStr }; }
};

const resizeImage = (file: File, maxWidth = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject("Invalid file"); return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
        };
        reader.onerror = (e) => reject(e);
    });
};

const App: React.FC = () => {
    const [characters, setCharacters] = useState<Character[]>([INITIAL_CHARACTER]);
    const [activeCharId, setActiveCharId] = useState<string>(INITIAL_CHARACTER.id);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [isCharModalOpen, setIsCharModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('hatsus');
    const [consoleExpanded, setConsoleExpanded] = useState(true);
    const [uploadTarget, setUploadTarget] = useState<any>(null);
    const [conditionInput, setConditionInput] = useState("");
    const [calculatorTarget, setCalculatorTarget] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Initial Load from Supabase
    useEffect(() => {
        const load = async () => {
            try {
                if (!isSupabaseConfigured()) {
                    addLog('System', 'Offline', 'Supabase not configured. Using local mode.', 'fail');
                    setLoading(false);
                    return;
                }
                const data = await fetchCharacters();
                if (data && data.length > 0) {
                    setCharacters(data);
                    setActiveCharId(data[0].id);
                } else {
                    setCharacters([INITIAL_CHARACTER]);
                    setActiveCharId(INITIAL_CHARACTER.id);
                }
            } catch (error) {
                console.error(error);
                addLog('System', 'Error', 'Failed to load characters. Using local mode.', 'fail');
                setCharacters([INITIAL_CHARACTER]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Safety fallback
    const char = characters.find(c => c.id === activeCharId) || characters[0] || INITIAL_CHARACTER;
    const themeColor = char ? (NEN_COLORS[char.nenType] || '#9b59b6') : '#9b59b6';
    const equippedWeapon = char.equippedWeapon || { name: 'Desarmado', damage: '1d4', description: '', powers: '', imageUrl: '' };
    const attrLabels = char.attributeLabels || {};

    const addLog = (title: string, result: string | number, detail: string, type = 'info') => {
        setLogs(prev => [...prev, { id: Math.random(), title, result, detail, type, time: new Date() }]);
        setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveCharacter(char);
            addLog('System', 'Saved', 'Data synced to Supabase', 'info');
            setIsEditing(false);
        } catch (e) {
            addLog('System', 'Error', 'Save failed', 'fail');
            alert("Erro ao salvar! Verifique sua conexão.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Tem certeza que deseja deletar este personagem?")) return;
        try {
            await deleteCharacter(id);
            const remaining = characters.filter(c => c.id !== id);
            if(remaining.length === 0) {
                setCharacters([INITIAL_CHARACTER]);
                setActiveCharId(INITIAL_CHARACTER.id);
            } else {
                setCharacters(remaining);
                setActiveCharId(remaining[0].id);
            }
            addLog('System', 'Deleted', 'Character removed', 'info');
        } catch (e) {
            addLog('System', 'Error', 'Delete failed', 'fail');
        }
    };

    const updateChar = (field: keyof Character, value: any) => {
        setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, [field]: value } : c));
    };

    const updateNested = (collection: 'attributes' | 'skills' | 'inventory' | 'summons' | 'equippedWeapon', idOrKey: string, newData: any) => {
        setCharacters(prev => prev.map(c => {
            if (c.id !== activeCharId) return c;
            
            if (collection === 'attributes') {
                return { ...c, attributes: { ...c.attributes, [idOrKey]: newData } };
            }
            if (collection === 'equippedWeapon') {
                return { ...c, equippedWeapon: { ...c.equippedWeapon, [idOrKey]: newData } };
            }
            // Arrays
            const list = (c[collection] || []) as any[];
            const updatedList = list.map(item => item.id === idOrKey ? { ...item, ...newData } : item);
            return { ...c, [collection]: updatedList };
        }));
    };

    // --- Complex Logic Ported from HTML ---

    const addItem = (type: string, parentId?: string) => {
        const id = crypto.randomUUID();
        if (type === 'skill') {
           const category = activeTab === 'hatsus' ? 'Hatsu' : activeTab === 'combat' ? 'Combat' : 'Weapon';
           const newSkill: Skill = { id, name: 'Nova Habilidade', category, type: 'Ativa', cost: 0, costType: 'Nen', damageDice: '1d6', description: '...', imageUrl: '' };
           updateChar('skills', [...(char.skills || []), newSkill]);
        }
        if (type === 'item') {
           updateChar('inventory', [...(char.inventory || []), { id, name: 'Item', quantity: 1 }]);
        }
        if (type === 'summon') {
            const newSummon = { id, name: 'Nova Invocação', avatarUrl: '', type: 'Besta de Nen', currentHp: 10, maxHp: 10, currentNen: 5, maxNen: 5, attributes: { strength: 0, constitution: 0, intelligence: 0, charisma: 0, determination: 0, prestidigitation: 0 }, description: '...', skills: [] };
            updateChar('summons', [...(char.summons || []), newSummon]);
        }
        if (type === 'summonSkill' && parentId) {
           const newSkill: Skill = { id, name: 'Nova Habilidade', category: 'Summon', type: 'Ativa', cost: 1, costType: 'Nen', damage: '1d4', description: '...' };
           const newSummons = (char.summons || []).map(s => s.id === parentId ? { ...s, skills: [...(s.skills || []), newSkill] } : s);
           updateChar('summons', newSummons);
        }
    }

    const deleteItem = (collection: string, id: string, parentId?: string) => {
        if(!confirm("Remover item?")) return;
        if (collection === 'summonSkill' && parentId) {
            const newSummons = (char.summons || []).map(s => s.id === parentId ? { ...s, skills: s.skills.filter(k => k.id !== id) } : s);
            updateChar('summons', newSummons);
        } else {
            // @ts-ignore dynamic access
            const list = char[collection] || [];
            // @ts-ignore
            updateChar(collection, list.filter(i => i.id !== id));
        }
   }

    const handleRollSkill = (skill: Skill, sourceName?: string) => {
        if(isEditing) return;
        const roll = rollDice(skill.damageDice || skill.damage || '0');
        addLog(`Uso: ${skill.name} (${sourceName || 'Habilidade'})`, roll.total > 0 ? roll.total : 'Ativado', roll.str ? `[${roll.str}]: ${roll.rolls.join('+')}` : 'Efeito', 'combat');
        
        if(skill.cost > 0) {
             const costType = skill.costType || 'Nen';
             if (costType === 'HP') {
                if(char.currentHp > skill.cost) {
                    updateChar('currentHp', char.currentHp - skill.cost);
                    addLog('Custo Vital', `-${skill.cost} HP`, 'Sacrifício', 'fail');
                } else alert("Vida insuficiente!");
             } else {
                 if(char.currentNen >= skill.cost) updateChar('currentNen', char.currentNen - skill.cost);
                 else alert("Nen insuficiente!");
             }
        }
    };

    const handleRollWeapon = (weapon: any) => {
        if(isEditing) return;
        const roll = rollDice(weapon.damage);
        addLog(`Ataque: ${weapon.name}`, roll.total > 0 ? roll.total : '0', roll.str ? `[${roll.str}]: ${roll.rolls.join('+')}` : '', 'combat');
    };

    const handleOpenCalculator = (type: string, id: string, field: string, label: string, current: number, max: number) => {
        setCalculatorTarget({ type, id, field, label, current, max });
    };

    const handleApplyCalculation = (delta: number) => {
       if (!calculatorTarget) return;
       const { type, id, field, current, max, label } = calculatorTarget;
       let newValue = current + delta;
       newValue = Math.max(0, Math.min(max, newValue));
       const isGain = delta > 0;
       const logType = field.toLowerCase().includes('hp') ? (isGain ? 'info' : 'fail') : 'info';
       
       addLog(`Calculadora: ${label}`, `${newValue}`, `${isGain ? 'Recuperado' : 'Gasto'}: ${Math.abs(delta)}`, logType);
       if (type === 'char') {
           updateChar(field as any, newValue);
       } else if (type === 'summon') {
            const newSummons = (char.summons || []).map(s => s.id === id ? {...s, [field]: newValue} : s);
            updateChar('summons', newSummons);
       }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file || !uploadTarget) return;
        try {
            const b64 = await resizeImage(file);
            if(uploadTarget.type === 'avatar') updateChar('avatarUrl', b64);
            if(uploadTarget.type === 'skill') updateNested('skills', uploadTarget.id, { imageUrl: b64 });
            if(uploadTarget.type === 'summon') updateNested('summons', uploadTarget.id, { avatarUrl: b64 });
            if(uploadTarget.type === 'equippedWeapon') updateNested('equippedWeapon', 'imageUrl', b64);
            if(uploadTarget.type === 'attribute') {
                 const meta = { ...char.attributeMetadata, [uploadTarget.key]: { imageUrl: b64 } };
                 updateChar('attributeMetadata', meta);
            }
        } catch(err) { console.error(err); }
        setUploadTarget(null);
    };

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white font-tech animate-pulse">BOOTING SYSTEM...</div>;
    
    // Safety check if render somehow receives no char
    if (!char) return <div className="h-screen flex items-center justify-center text-white">Character Load Error</div>;

    return (
        <div className={`min-h-screen relative text-gray-200 font-body ${isEditing ? 'edit-mode' : ''}`} style={{ '--theme-color': themeColor } as React.CSSProperties}>
            <BackgroundWorld />
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
            
            {/* Calculator Modal */}
            <CalculatorModal 
                isOpen={!!calculatorTarget} 
                onClose={() => setCalculatorTarget(null)} 
                target={calculatorTarget} 
                onConfirm={handleApplyCalculation} 
            />

            {/* Navbar */}
            <div className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsCharModalOpen(true)}>
                    <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded border border-white/10 tech-border relative z-10 box-glow hover:border-theme/50 transition-colors">
                        <span className="font-title text-theme text-2xl font-bold select-none text-glow">H</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-tech text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase">Sistema Hunter</span>
                        <span className="font-bold text-white text-sm tracking-widest uppercase text-glow">{char.nickname}</span>
                    </div>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button onClick={() => {
                         const jsonStr = JSON.stringify(characters);
                         navigator.clipboard.writeText(jsonStr);
                         alert("Dados copiados! (Use isso apenas para backup manual)");
                    }} className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"><Share2 size={18}/></button>
                    <button onClick={() => setIsCharModalOpen(true)} className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"><Users size={18}/></button>
                    <button onClick={isEditing ? handleSave : () => setIsEditing(true)} className={`px-5 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-all shadow-lg ${isEditing ? 'bg-white text-black border-white' : 'bg-theme/10 text-theme border-theme/50 hover:bg-theme hover:text-white'}`}>
                        {isEditing ? (isSaving ? 'Salvando...' : 'Salvar') : 'Editar'}
                    </button>
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
                {/* Left Column: Avatar & Vitals */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    
                    {/* Avatar Card */}
                    <div className="glass-panel group relative overflow-hidden" style={{ minHeight: '500px' }}>
                        <div className="h-[450px] w-full bg-black relative">
                            <img src={char.avatarUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 scale-100 group-hover:scale-105 filter contrast-125 relative z-10"/>
                            <div className="absolute inset-0 bg-theme opacity-10 filter blur-xl animate-aura"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20"></div>
                            
                            {isEditing && (
                                <button onClick={() => { setUploadTarget({ type: 'avatar' }); fileInputRef.current?.click(); }} className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur text-white rounded hover:bg-white hover:text-black border border-white/20 z-30 shadow-lg"><Upload size={20}/></button>
                            )}
                            
                            <div className="absolute bottom-6 left-6 right-6 z-30">
                                <div className="px-3 py-1 bg-theme text-black font-bold text-[10px] uppercase tracking-widest inline-block mb-2 rounded shadow-[0_0_10px_var(--theme-color)]">License No. {char.id.substring(0,6)}</div>
                                {isEditing ? <input value={char.nickname} onChange={e => updateChar('nickname', e.target.value)} className="bg-black/50 backdrop-blur border-b border-white/50 text-4xl font-title text-white w-full px-2 py-1"/> : 
                                <h1 className="text-5xl font-title text-white drop-shadow-lg leading-tight tracking-wide text-glow" style={{textShadow: `0 0 20px ${themeColor}`}}>{char.nickname}</h1>}
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="h-[2px] bg-white/50 w-12"></div>
                                    <span className="text-xs font-tech text-theme uppercase tracking-[0.3em] font-bold text-glow">{char.nenType}</span>
                                </div>
                            </div>
                        </div>

                        {/* XP Strip */}
                        <div className="bg-[#101012] px-6 py-4 border-t border-white/10 flex justify-between items-center font-mono text-xs relative z-20">
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 font-tech tracking-widest text-[10px]">RANK</span>
                                {isEditing ? (
                                    <input type="number" value={char.hunterLevel} onChange={(e) => updateChar('hunterLevel', parseInt(e.target.value) || 0)} className="w-12 text-center text-white bg-white/5 border-b border-white/20"/>
                                ) : (
                                    <div className="flex items-center gap-1">
                                            <div className="text-white text-xl font-bold">{char.hunterLevel}</div>
                                            <div className="flex gap-0.5 ml-2">
                                            {[...Array(Math.min(3, char.hunterLevel))].map((_, i) => <div key={i} className="w-1 h-3 bg-theme shadow-[0_0_5px_var(--theme-color)]"></div>)}
                                            </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 ml-6 text-right">
                                <div className="flex justify-between text-[9px] uppercase text-gray-500 mb-1 tracking-wider">
                                    <span>Experience</span>
                                    <span>{char.xp} / {char.maxXp} XP</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-theme shadow-[0_0_15px_var(--theme-color)] relative" style={{width: `${Math.min(100, (char.xp/char.maxXp)*100)}%`}}></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Details */}
                        <div className="p-6 grid grid-cols-2 gap-y-4 gap-x-4 text-sm font-mono bg-[#0d0d10] border-t border-white/5 relative z-10">
                            {[{l:'Idade',k:'age'},{l:'Altura',k:'height'},{l:'Peso',k:'weight'},{l:'Origem',k:'nationality'}].map(f => (
                                <div key={f.k} className="flex flex-col">
                                    <span className="text-gray-600 text-[9px] uppercase tracking-widest mb-1">{f.l}</span>
                                    {isEditing ? <input value={(char as any)[f.k]} onChange={e => updateChar(f.k as any, e.target.value)} className="w-full text-gray-200"/> : <span className="text-gray-300 font-bold">{(char as any)[f.k]}</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-8 flex flex-col items-center relative overflow-visible hover:border-theme/50 transition-colors">
                        <div className="absolute -top-10 -right-10 opacity-10 animate-spin-slow pointer-events-none text-theme"><Hexagon size={200} /></div>
                        <div className="flex justify-between w-full items-center mb-6 relative z-10">
                            <span className="text-xs font-tech uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Activity size={14} className="text-theme"/> Afinidade de Nen</span>
                            {isEditing && <select value={char.nenType} onChange={e => updateChar('nenType', e.target.value)} className="bg-black/50 border border-white/20 text-white text-[10px] p-1 uppercase rounded z-20 relative">{Object.values(NenType).map(k => <option key={k} value={k}>{k}</option>)}</select>}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-theme/30 blur-[50px] rounded-full"></div>
                            <NenHexagon activeType={char.nenType} size={240} />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6">
                        <div className="flex flex-col gap-6">
                            {/* Vitals */}
                            <div className="glass-panel p-6 flex flex-col justify-center gap-6 relative overflow-hidden neon-border">
                                <StatBar label="Vitalidade (HP)" current={char.currentHp} max={char.maxHp} color="#ef4444" icon={<Heart size={14}/>} isEditing={isEditing} 
                                    onChange={v => updateChar('currentHp', v)} onMaxChange={v => updateChar('maxHp', v)} onOpenCalculator={() => handleOpenCalculator('char', char.id, 'currentHp', 'Vitalidade', char.currentHp, char.maxHp)} />
                                <StatBar label="Aura (Nen)" current={char.currentNen} max={char.maxNen} color={themeColor} icon={<Zap size={14}/>} isEditing={isEditing} 
                                    onChange={v => updateChar('currentNen', v)} onMaxChange={v => updateChar('maxNen', v)} onOpenCalculator={() => handleOpenCalculator('char', char.id, 'currentNen', 'Aura', char.currentNen, char.maxNen)} />
                                
                                <div className="mt-2 flex items-center justify-between bg-black/30 p-4 rounded border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                     <div className="flex items-center gap-4 relative z-10">
                                        <ShieldCheck size={34} className="text-blue-400"/>
                                        <div className="flex flex-col">
                                                <span className="text-[10px] font-tech text-blue-400 uppercase tracking-widest font-bold text-glow">Defesa</span>
                                                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Armor Class</span>
                                        </div>
                                     </div>
                                     {isEditing ? <input type="number" value={char.ca} onChange={e => updateChar('ca', parseInt(e.target.value))} className="w-20 bg-transparent text-white text-right font-bold text-4xl border-b border-white/20 relative z-20 font-title"/> : <span className="text-5xl font-title text-white relative z-20 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] pr-2" style={{textShadow: '0 0 20px rgba(59,130,246,0.6)'}}>{char.ca}</span>}
                                </div>
                                
                                {/* Conditions */}
                                <div className="bg-black/30 p-4 rounded border border-white/5 relative min-h-[80px]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-tech text-gray-500 uppercase tracking-widest flex items-center gap-2"><AlertCircle size={12}/> Status Atuais</span>
                                        {isEditing && (
                                            <div className="flex items-center gap-1 relative z-20">
                                                <input value={conditionInput} onChange={e => setConditionInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && conditionInput) { updateChar('conditions', [...(char.conditions || []), conditionInput]); setConditionInput(""); }}} placeholder="Add..." className="bg-black/50 border border-white/10 text-[10px] text-white px-2 py-1 w-20 outline-none rounded"/>
                                                <button onClick={() => { if(conditionInput) { updateChar('conditions', [...(char.conditions || []), conditionInput]); setConditionInput(""); }}} className="bg-theme text-[10px] text-white px-2 py-1 rounded hover:bg-white hover:text-black transition-colors font-bold">+</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 relative z-10">
                                        {(char.conditions || []).map((cond, idx) => (
                                            <span key={idx} className="text-[10px] font-bold px-3 py-1 bg-red-500/10 text-red-200 border border-red-500/20 rounded-full flex items-center gap-2">
                                                {cond}
                                                {isEditing && <button onClick={() => updateChar('conditions', (char.conditions || []).filter((_, i) => i !== idx))} className="hover:text-white"><X size={10}/></button>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel p-4 flex items-center justify-center hover:border-theme/50 transition-colors">
                                <AttributesRadar attributes={char.attributes} labels={attrLabels} size={200} color={themeColor} />
                            </div>
                        </div>

                        {/* Attributes Grid */}
                        <div className="glass-panel p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full content-start">
                                {Object.keys(char.attributes).map((key, index) => (
                                    <AttributeCard 
                                        key={key}
                                        label={attrLabels[key] || key} 
                                        value={char.attributes[key]} 
                                        icon={ATTR_ICONS[key]}
                                        imageUrl={char.attributeMetadata?.[key]?.imageUrl}
                                        color={getColor(key, index)}
                                        isEditing={isEditing} 
                                        onRoll={() => { const res = Math.floor(Math.random() * 20) + 1 + char.attributes[key]; addLog(attrLabels[key], res, `1d20 + ${char.attributes[key]}`); }}
                                        onChange={(v) => updateNested('attributes', key, v)} 
                                        onLabelChange={(v) => updateChar('attributeLabels', {...char.attributeLabels, [key]: v})}
                                        onUpload={() => { setUploadTarget({type: 'attribute', key}); fileInputRef.current?.click(); }}
                                        onDelete={!ATTR_ICONS[key] ? () => { const {[key]: _, ...rest} = char.attributes; updateChar('attributes', rest); } : undefined}
                                    />
                                ))}
                                {isEditing && (
                                    <button onClick={() => { const k = `attr_${Date.now()}`; updateChar('attributes', {...char.attributes, [k]: 0}); updateChar('attributeLabels', {...char.attributeLabels, [k]: 'Novo'}); }} className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-white/10 hover:border-white/30 rounded-full group transition-all">
                                        <Plus size={32} className="text-gray-500 group-hover:text-white mb-2" />
                                        <span className="text-[9px] uppercase font-bold text-gray-600 group-hover:text-gray-300">Novo Atributo</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs Area */}
                    <div className="glass-panel flex flex-col lg:h-[calc(100vh-8rem)] h-auto shadow-2xl neon-border overflow-hidden">
                        <div className="flex bg-black/80 border-b border-white/5 overflow-x-auto custom-scrollbar flex-shrink-0 backdrop-blur-md w-full relative z-30">
                            {[
                                {id: 'hatsus', label: 'Hatsus', icon: Zap},
                                {id: 'combat', label: 'Combate', icon: Target},
                                {id: 'weapon', label: 'Armas', icon: Sword},
                                {id: 'summons', label: 'Invocações', icon: PawPrint},
                                {id: 'inventory', label: 'Inventário', icon: Box},
                                {id: 'bio', label: 'Bio', icon: ScrollText}
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-5 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap outline-none flex-shrink-0 ${activeTab === tab.id ? 'text-white border-theme bg-white/5 shadow-[inset_0_-10px_20px_rgba(255,255,255,0.02)]' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}>
                                    <tab.icon size={16} className={activeTab === tab.id ? 'text-theme drop-shadow-[0_0_5px_currentColor]' : ''} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 md:p-8 flex-1 bg-gradient-to-b from-transparent to-black/30 overflow-y-auto custom-scrollbar relative z-10 pr-4">
                             {/* Weapon Tab */}
                            {activeTab === 'weapon' && (
                                <div className="mb-8 border border-white/10 bg-[#131316] p-6 relative group rounded-sm shadow-lg hover:border-theme/30 transition-colors">
                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                        <h3 className="text-xs font-tech uppercase tracking-widest text-theme flex items-center gap-2"><Sword size={16}/> Arma Equipada</h3>
                                        {!isEditing && equippedWeapon.damage && <span className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">Dano Base: {equippedWeapon.damage}</span>}
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-48 h-48 bg-black/40 relative border border-white/10 flex-shrink-0 group-hover:border-white/20 transition-colors shadow-inner">
                                            {equippedWeapon.imageUrl ? <img src={equippedWeapon.imageUrl} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-white/10"><Sword size={48}/></div>}
                                            {isEditing && (
                                                <button onClick={() => { setUploadTarget({type: 'equippedWeapon'}); fileInputRef.current?.click(); }} className="absolute inset-0 bg-black/70 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-sm z-20">
                                                    <Camera size={24}/>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    {isEditing ? <input className="w-full bg-transparent border-b border-white/20 text-2xl font-title text-white mb-2" value={equippedWeapon.name} onChange={e => updateNested('equippedWeapon', 'name', e.target.value)} placeholder="Nome da Arma"/> : <h2 className="text-2xl font-title text-white mb-2 text-glow">{equippedWeapon.name}</h2>}
                                                </div>
                                                {!isEditing && equippedWeapon.damage && (
                                                    <button onClick={() => handleRollWeapon(equippedWeapon)} className="ml-4 text-xs font-mono text-red-300 bg-red-500/10 px-3 py-2 border border-red-500/20 hover:bg-red-500/20 flex items-center gap-2 cursor-pointer transition-all rounded shadow-lg z-20 relative box-glow"><Dice5 size={14}/> Rolar Dano</button>
                                                )}
                                                {isEditing && <input className="bg-red-900/20 border border-red-500/20 text-sm text-red-300 w-24 px-2 py-1 text-center rounded ml-4" placeholder="Dano" value={equippedWeapon.damage} onChange={e => updateNested('equippedWeapon', 'damage', e.target.value)} />}
                                            </div>
                                            <div className="grid gap-4 mt-auto">
                                                <div className="bg-black/20 p-3 rounded border border-white/5">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1 tracking-wider">Aparência</span>
                                                    {isEditing ? <textarea className="w-full bg-transparent text-gray-300 h-20 text-sm" value={equippedWeapon.description} onChange={e => updateNested('equippedWeapon', 'description', e.target.value)}/> : <p className="text-sm text-gray-300">{equippedWeapon.description}</p>}
                                                </div>
                                                <div className="bg-blue-900/10 p-3 rounded border border-blue-500/10">
                                                    <span className="text-[10px] font-bold text-blue-400/70 uppercase flex items-center gap-1 mb-1 tracking-wider"><Sparkles size={12}/> Habilidades Especiais</span>
                                                    {isEditing ? <textarea className="w-full bg-transparent text-blue-200 h-20 text-sm" value={equippedWeapon.powers} onChange={e => updateNested('equippedWeapon', 'powers', e.target.value)}/> : <p className="text-sm text-blue-200">{equippedWeapon.powers}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Skills (Hatsus, Combat, Weapon techniques) */}
                            {['hatsus', 'combat', 'weapon'].includes(activeTab) && (
                                <div className="space-y-6">
                                    {(char.skills || []).filter(s => s.category.toLowerCase() === (activeTab === 'hatsus' ? 'hatsu' : activeTab)).map(skill => (
                                        <div key={skill.id} className="border border-white/5 bg-[#131316] group hover:bg-[#18181c] transition-all relative overflow-hidden flex flex-col md:flex-row rounded-sm shadow-md hover:shadow-xl hover:translate-x-1 duration-300 hover:border-theme/30">
                                            <div className="w-full md:w-48 h-48 bg-black/40 relative flex-shrink-0 border-r border-white/5 group-hover:border-white/10 transition-colors">
                                                {skill.imageUrl ? <img src={skill.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/> : <div className="w-full h-full flex items-center justify-center text-white/5"><Hexagon size={60}/></div>}
                                                {isEditing && (
                                                    <button onClick={() => { setUploadTarget({type: 'skill', id: skill.id}); fileInputRef.current?.click(); }} className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-sm z-20">
                                                        <ImageIcon size={24}/>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-5 flex-1 flex flex-col relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        {isEditing ? (
                                                            <input className="bg-transparent border-b border-white/20 text-xl font-title text-white w-full mb-1" value={skill.name} onChange={e => updateNested('skills', skill.id, { name: e.target.value })}/>
                                                        ) : (
                                                            <h4 className="font-title text-xl text-white group-hover:text-theme transition-colors cursor-pointer inline-flex items-center gap-2" onClick={() => handleRollSkill(skill)}>{skill.name} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-theme"/></h4>
                                                        )}
                                                        <div className="flex gap-2 items-center mt-3 flex-wrap">
                                                            {isEditing ? (
                                                                <>
                                                                    <input type="text" value={skill.type} onChange={e => updateNested('skills', skill.id, { type: e.target.value })} className="bg-white/5 border border-white/10 text-xs text-white px-2 py-1 rounded w-20"/>
                                                                    <input type="number" value={skill.cost} onChange={e => updateNested('skills', skill.id, { cost: parseInt(e.target.value) })} className="bg-transparent text-xs text-white w-8 text-center outline-none bg-white/5 border border-white/10 rounded"/>
                                                                    <select value={skill.costType || 'Nen'} onChange={e => updateNested('skills', skill.id, { costType: e.target.value })} className="bg-black text-xs text-gray-400 outline-none uppercase font-bold"><option value="Nen">Nen</option><option value="HP">HP</option></select>
                                                                    <input type="text" value={skill.damageDice} onChange={e => updateNested('skills', skill.id, { damageDice: e.target.value })} className="bg-red-500/10 border border-red-500/20 text-xs text-red-300 px-2 py-1 text-center rounded w-16"/>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-white/5 border border-white/5 px-2 py-1 rounded tracking-wide">{skill.type}</span>
                                                                    {skill.cost > 0 && (
                                                                        <span className={`text-[10px] font-mono flex items-center gap-1 px-2 py-1 border rounded ${skill.costType === 'HP' ? 'text-red-300 bg-red-900/20 border-red-500/20' : 'text-blue-300 bg-blue-900/20 border-blue-500/20'}`}>
                                                                            {skill.costType === 'HP' ? <Heart size={10}/> : <Zap size={10}/>} <span className="font-bold">{skill.cost}</span> {skill.costType === 'HP' ? 'HP' : 'AP'}
                                                                        </span>
                                                                    )}
                                                                    {skill.damageDice && <button onClick={() => handleRollSkill(skill)} className="text-[10px] font-mono text-red-300 bg-red-500/10 px-2 py-1 border border-red-500/20 hover:bg-red-500/20 flex items-center gap-1 cursor-pointer transition-colors rounded font-bold z-20 relative box-glow"><Dice5 size={12}/> {skill.damageDice}</button>}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isEditing && <button onClick={() => deleteItem('skills', skill.id)} className="text-red-500 hover:text-white p-2 bg-black/50 rounded transition-colors z-20 relative"><Trash2 size={16}/></button>}
                                                </div>
                                                <div className="mt-4 flex-1">
                                                    {isEditing ? <textarea value={skill.description} onChange={e => updateNested('skills', skill.id, { description: e.target.value })} className="w-full bg-black/20 text-gray-300 p-3 h-24 border border-white/5 rounded text-sm"/> : 
                                                    <p className="text-sm text-gray-400 font-serif leading-relaxed pl-3 border-l-2 border-white/10 whitespace-pre-wrap break-words">{skill.description}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isEditing && <button onClick={() => addItem('skill')} className="w-full py-6 border border-dashed border-white/10 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-white hover:border-white transition-all hover:bg-white/5 rounded">+ Adicionar Técnica</button>}
                                </div>
                            )}

                             {/* Inventory */}
                             {activeTab === 'inventory' && (
                                <div className="grid grid-cols-1 gap-1">
                                    {(char.inventory || []).map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-4 bg-[#131316] border-l-2 border-transparent hover:border-theme transition-all group relative z-10 hover:bg-white/5">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="p-2 bg-black/30 rounded text-gray-500 group-hover:text-white transition-colors"><Box size={18}/></div>
                                                {isEditing ? <input value={item.name} onChange={e => updateNested('inventory', item.id, { name: e.target.value })} className="bg-transparent text-white border-b border-white/20 outline-none w-full text-sm"/> : <span className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors break-words">{item.name}</span>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {isEditing ? <input type="number" value={item.quantity} onChange={e => updateNested('inventory', item.id, { quantity: parseInt(e.target.value) })} className="w-12 bg-white/5 text-center text-white text-sm py-1 rounded"/> : <span className="font-mono text-xs text-theme bg-theme/10 border border-theme/20 px-3 py-1 rounded">x{item.quantity}</span>}
                                                {isEditing && <button onClick={() => deleteItem('inventory', item.id)} className="text-gray-600 hover:text-red-400 p-1 z-20 relative"><Trash2 size={16}/></button>}
                                            </div>
                                        </div>
                                    ))}
                                    {isEditing && <button onClick={() => addItem('item')} className="w-full py-4 border border-dashed border-white/10 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors mt-4">+ Adicionar Item</button>}
                                </div>
                            )}

                            {/* Summons */}
                            {activeTab === 'summons' && (
                                <div className="grid grid-cols-1 gap-10">
                                    {isEditing && (
                                        <button onClick={() => addItem('summon')} className="w-full py-5 mb-4 border border-dashed border-theme/50 text-theme bg-theme/5 hover:bg-theme/10 rounded font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all text-sm group">
                                            <Plus size={18} className="group-hover:scale-110 transition-transform"/> Criar Nova Besta de Nen
                                        </button>
                                    )}
                                    {(char.summons || []).map(summon => (
                                        <div key={summon.id} className="border border-white/5 bg-black/20 overflow-hidden group rounded-sm shadow-xl relative z-10 hover:border-theme/30 transition-all">
                                            <div className="flex flex-col md:flex-row border-b border-white/5">
                                                <div className="w-full md:w-56 h-56 bg-black/40 relative flex-shrink-0 border-r border-white/10">
                                                    {summon.avatarUrl ? <img src={summon.avatarUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/> : <div className="w-full h-full flex items-center justify-center text-white/10"><PawPrint size={64}/></div>}
                                                    {isEditing && (
                                                        <button onClick={() => { setUploadTarget({type: 'summon', id: summon.id}); fileInputRef.current?.click(); }} className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-sm z-20">
                                                            <ImageIcon size={28}/>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col justify-center">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex-1">
                                                            {isEditing ? <input value={summon.name} onChange={e => { const updated = (char.summons || []).map(s => s.id === summon.id ? {...s, name: e.target.value} : s); updateChar('summons', updated); }} className="bg-transparent border-b border-white/20 text-3xl font-title text-white w-full"/> : <h4 className="font-bold text-white text-3xl font-title tracking-wide text-glow">{summon.name}</h4>}
                                                            {isEditing ? <input value={summon.type} onChange={e => { const updated = (char.summons || []).map(s => s.id === summon.id ? {...s, type: e.target.value} : s); updateChar('summons', updated); }} className="bg-black/30 border border-white/10 text-xs text-gray-400 w-full mt-2 p-1 uppercase"/> : <span className="text-xs uppercase font-bold text-gray-500 mt-2 block tracking-[0.2em]">{summon.type}</span>}
                                                        </div>
                                                        {isEditing && <button onClick={() => deleteItem('summons', summon.id)} className="text-red-500 hover:text-white p-2 bg-white/5 rounded z-20 relative"><Trash2 size={20}/></button>}
                                                    </div>
                                                    {isEditing ? <textarea value={summon.description} onChange={e => { const updated = (char.summons || []).map(s => s.id === summon.id ? {...s, description: e.target.value} : s); updateChar('summons', updated); }} className="w-full h-24 bg-black/30 text-xs text-gray-400 p-3 border border-white/10 resize-y rounded"/> : <p className="text-sm text-gray-400 italic leading-relaxed border-l-2 border-white/10 pl-4 whitespace-pre-wrap break-words">{summon.description}</p>}
                                                </div>
                                            </div>
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/40 border-b border-white/5">
                                                <div className="flex flex-col justify-center gap-2">
                                                    <StatBar label="HP" current={summon.currentHp} max={summon.maxHp} color="#ef4444" icon={<Heart size={12}/>} isEditing={isEditing}
                                                        onChange={v => { const updated = (char.summons || []).map(s => s.id === summon.id ? {...s, currentHp: v} : s); updateChar('summons', updated); }}
                                                        onMaxChange={v => { const updated = (char.summons || []).map(s => s.id === summon.id ? {...s, maxHp: v} : s); updateChar('summons', updated); }}
                                                        onOpenCalculator={() => handleOpenCalculator('summon', summon.id, 'currentHp', `HP (${summon.name})`, summon.currentHp, summon.maxHp)}
                                                    />
                                                    <StatBar label="Nen" current={summon.currentNen} max={summon.maxNen} color={themeColor} icon={<Zap size={12}/>} isEditing={isEditing}
                                                            onChange={v => { const updated = (char.summons || []).map(s => s.id === summon.id ? {...s, currentNen: v} : s); updateChar('summons', updated); }}
                                                            onMaxChange={v => { const updated = (char.summons || []).map(s => s.id === summon.id ? {...s, maxNen: v} : s); updateChar('summons', updated); }}
                                                            onOpenCalculator={() => handleOpenCalculator('summon', summon.id, 'currentNen', `Nen (${summon.name})`, summon.currentNen, summon.maxNen)}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-center relative py-4">
                                                    <div className="scale-100 origin-center">
                                                        <AttributesRadar attributes={summon.attributes} labels={{}} size={160} color={themeColor} />
                                                    </div>
                                                    {isEditing && (
                                                        <div className="absolute inset-0 bg-black/90 flex flex-wrap content-center justify-center gap-2 p-4 z-20 rounded">
                                                            {Object.entries(summon.attributes).map(([key, val]) => (
                                                                <div key={key} className="flex flex-col items-center bg-white/10 p-2 rounded w-16">
                                                                    <span className="text-[9px] uppercase mb-1 text-gray-400 font-bold">{key.substring(0,3)}</span>
                                                                    <input type="number" value={val} onChange={e => { const newAttrs = {...summon.attributes, [key]: parseInt(e.target.value) || 0}; const updated = (char.summons || []).map(s => s.id === summon.id ? {...s, attributes: newAttrs} : s); updateChar('summons', updated); }} className="w-full bg-transparent text-center text-white text-sm font-bold"/>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-6 bg-[#0f0f11]">
                                                <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                                                    <span>Habilidades da Invocação</span>
                                                    {isEditing && <button onClick={() => addItem('summonSkill', summon.id)} className="text-theme hover:text-white flex items-center gap-1 text-[10px] bg-theme/10 px-2 py-1 rounded transition-colors z-20 relative"><Plus size={12}/> Add</button>}
                                                </div>
                                                <div className="space-y-4">
                                                    {(summon.skills || []).map(skill => (
                                                        <div key={skill.id} className="bg-black/40 border border-white/5 p-4 rounded-sm flex flex-col gap-3 relative z-10 hover:bg-white/5 transition-colors">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    {isEditing ? <input value={skill.name} onChange={e => {
                                                                        const newSkills = summon.skills.map(s => s.id === skill.id ? {...s, name: e.target.value} : s);
                                                                        const newSummons = (char.summons || []).map(s => s.id === summon.id ? {...s, skills: newSkills} : s);
                                                                        updateChar('summons', newSummons);
                                                                    }} className="bg-transparent border-b border-white/20 text-sm font-bold text-white w-full"/> : <span className="text-sm font-bold text-white cursor-pointer hover:text-theme transition-colors" onClick={() => handleRollSkill(skill, summon.name)}>{skill.name}</span>}
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    {isEditing ? (
                                                                            <div className="flex items-center gap-2">
                                                                            <input type="number" value={skill.cost} onChange={e => {
                                                                                const newSkills = summon.skills.map(s => s.id === skill.id ? {...s, cost: parseInt(e.target.value)} : s);
                                                                                const newSummons = (char.summons || []).map(s => s.id === summon.id ? {...s, skills: newSkills} : s);
                                                                                updateChar('summons', newSummons);
                                                                            }} className="w-10 text-xs bg-white/10 text-center p-1 rounded"/>
                                                                            <select value={skill.costType || 'Nen'} onChange={e => {
                                                                                const newSkills = summon.skills.map(s => s.id === skill.id ? {...s, costType: e.target.value} : s);
                                                                                const newSummons = (char.summons || []).map(s => s.id === summon.id ? {...s, skills: newSkills} : s);
                                                                                updateChar('summons', newSummons);
                                                                            }} className="text-xs bg-black text-gray-400 p-1 rounded uppercase"><option value="Nen">AP</option><option value="HP">HP</option></select>
                                                                            </div>
                                                                    ) : (
                                                                        skill.cost > 0 && <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${skill.costType === 'HP' ? 'text-red-400 bg-red-900/20' : 'text-blue-400 bg-blue-900/20'}`}>{skill.cost} {skill.costType === 'HP' ? 'HP' : 'AP'}</span>
                                                                    )}
                                                                    
                                                                    {isEditing ? <input value={skill.damage} onChange={e => {
                                                                        const newSkills = summon.skills.map(s => s.id === skill.id ? {...s, damage: e.target.value} : s);
                                                                        const newSummons = (char.summons || []).map(s => s.id === summon.id ? {...s, skills: newSkills} : s);
                                                                        updateChar('summons', newSummons);
                                                                    }} className="w-16 text-xs bg-red-900/30 text-red-200 text-center p-1 rounded" placeholder="Dano"/> : 
                                                                    (skill.damage && <button onClick={() => handleRollSkill(skill, summon.name)} className="text-[10px] text-red-300 flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition-colors relative z-20"><Dice5 size={12}/> {skill.damage}</button>)}

                                                                    {isEditing && <button onClick={() => deleteItem('summonSkill', skill.id, summon.id)} className="text-gray-600 hover:text-red-500 p-1 z-20 relative"><Trash2 size={16}/></button>}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-400 border-l-2 border-white/10 pl-3">
                                                                    {isEditing ? <textarea value={skill.description} onChange={e => {
                                                                    const newSkills = summon.skills.map(s => s.id === skill.id ? {...s, description: e.target.value} : s);
                                                                    const newSummons = (char.summons || []).map(s => s.id === summon.id ? {...s, skills: newSkills} : s);
                                                                    updateChar('summons', newSummons);
                                                                }} className="w-full bg-transparent text-gray-400 h-16 resize-y custom-scrollbar overflow-y-auto"/> : <span className="break-words whitespace-pre-wrap">{skill.description}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                             {/* Bio */}
                             {activeTab === 'bio' && (
                                isEditing ? <textarea className="w-full h-96 bg-black/20 border border-white/10 p-6 text-gray-300 font-serif leading-loose outline-none resize-y custom-scrollbar overflow-y-auto text-base rounded" value={char.bio} onChange={e => updateChar('bio', e.target.value)} /> :
                                <div className="glass-panel p-8 text-gray-300 font-serif text-lg leading-loose whitespace-pre-wrap shadow-inner bg-black/40 text-justify break-words">
                                    <span className="text-6xl float-left mr-4 mt-[-10px] font-title text-theme opacity-50">{char.bio.charAt(0)}</span>
                                    {char.bio.substring(1)}
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Battle Console */}
                    <div className={`glass-panel border-t border-white/10 p-4 font-mono text-xs shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-20 flex-shrink-0 flex flex-col transition-all duration-300 ${consoleExpanded ? 'h-56' : 'h-14'}`}>
                            <div className="flex flex-wrap items-center justify-between mb-3 w-full gap-3 pb-2 border-b border-white/5 flex-shrink-0">
                                <span className="flex items-center gap-2 text-theme font-bold uppercase tracking-wider text-[10px] animate-pulse-slow"><Terminal size={14}/> Console de Batalha</span>
                                <div className="flex gap-4 items-center">
                                    {consoleExpanded && (
                                        <div className="flex items-center gap-1 bg-white/5 rounded px-2 py-1">
                                            {[4,6,8,10,12,20,100].map(d => (
                                                <button key={d} onClick={() => { const r = Math.floor(Math.random()*d)+1; addLog(`d${d}`, r, 'Rolagem Genérica'); }} className="text-[10px] text-gray-400 hover:text-white hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors active:scale-90 font-bold z-20 relative">d{d}</button>
                                            ))}
                                        </div>
                                    )}
                                    {consoleExpanded && (
                                        <button onClick={() => {
                                            const healHp = Math.floor(char.maxHp * 0.2);
                                            const healNen = Math.floor(char.maxNen * 0.2);
                                            updateChar('currentHp', Math.min(char.maxHp, char.currentHp + healHp));
                                            updateChar('currentNen', Math.min(char.maxNen, char.currentNen + healNen));
                                            addLog('Descanso', 'Recuperado', `+${healHp} HP, +${healNen} AP (20%)`);
                                        }} className="text-[10px] text-green-400 hover:text-white hover:bg-green-600 flex items-center gap-1 bg-green-900/20 px-3 py-1.5 rounded border border-green-500/20 font-bold uppercase tracking-wider transition-all z-20 relative box-glow"><BatteryCharging size={12}/> Descansar</button>
                                    )}
                                    <button onClick={() => setConsoleExpanded(!consoleExpanded)} className="text-gray-500 hover:text-white transition-colors">
                                        {consoleExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                    </button>
                                </div>
                            </div>
                            {consoleExpanded && (
                                <div className="space-y-1 pl-1 overflow-y-auto custom-scrollbar flex-1">
                                    {logs.length === 0 && <div className="text-gray-600 italic py-4 text-center">O log de batalha está vazio.</div>}
                                    {logs.slice().reverse().map(log => (
                                        <div key={log.id} className="flex gap-3 animate-fade-in border-l-2 border-transparent hover:border-theme transition-colors py-1 hover:bg-white/5 px-2 rounded-r group">
                                            <span className="text-gray-600 text-[10px] self-center w-12 text-right opacity-50">[{log.time.toLocaleTimeString([], {hour12:false, hour:'2-digit', minute:'2-digit'})}]</span>
                                            <div className="flex-1 flex gap-2 items-baseline">
                                                <span className={`font-bold uppercase text-[11px] tracking-wide ${log.type === 'crit' ? 'text-yellow-400 text-glow' : log.type === 'fail' ? 'text-red-500' : 'text-blue-400'}`}>{log.title}:</span>
                                                <span className="text-white font-bold text-sm group-hover:text-glow">{log.result}</span>
                                                <span className="text-gray-500 text-xs">- {log.detail}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Char Modal */}
            {isCharModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="tech-border bg-[#0a0a0c] w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl relative">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0e0e10]">
                            <h2 className="font-tech text-2xl text-white uppercase tracking-widest flex items-center gap-3"><Users size={24} className="text-theme"/> Banco de Dados</h2>
                            <button onClick={() => setIsCharModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20 relative"><X size={24} className="text-gray-400 hover:text-white"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                            {characters.map(c => (
                                <div key={c.id} onClick={() => { setActiveCharId(c.id); setIsCharModalOpen(false); }} className={`p-6 border cursor-pointer hover:bg-white/5 transition-all flex flex-col gap-3 relative group rounded-sm ${c.id === activeCharId ? 'border-theme bg-theme/5 shadow-[0_0_20px_rgba(155,89,182,0.1)]' : 'border-white/10'}`}>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-title text-2xl text-white group-hover:text-theme transition-colors">{c.nickname}</h3>
                                        <div className="flex items-center gap-2">
                                            {c.id === activeCharId && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#2ecc71]"></div>}
                                            {isEditing && <button onClick={(e) => {e.stopPropagation(); handleDelete(c.id);}} className="text-gray-600 hover:text-red-500"><Trash2 size={12}/></button>}
                                        </div>
                                    </div>
                                    <div className="h-[1px] w-full bg-white/10 group-hover:bg-white/20 transition-colors"></div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-gray-400">{c.name}</span>
                                            <span className="text-[10px] text-gray-600 mt-1">Lvl {c.hunterLevel}</span>
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-gray-500 bg-black/30 px-2 py-1 rounded tracking-widest">{c.nenType.split(' ')[0]}</span>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => {
                                const newChar = {...INITIAL_CHARACTER, id: crypto.randomUUID(), nickname: 'Novo Hunter', name: 'Desconhecido'};
                                setCharacters(prev => [...prev, newChar]);
                                setActiveCharId(newChar.id);
                                setIsCharModalOpen(false);
                            }} className="border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-6 text-gray-600 hover:text-white hover:border-white/30 transition-all group rounded-sm hover:bg-white/5 relative z-20">
                                <Plus size={32} className="mb-3 group-hover:scale-110 transition-transform text-theme opacity-50 group-hover:opacity-100"/> <span className="text-xs font-bold uppercase tracking-widest">Nova Ficha</span>
                            </button>
                        </div>
                        <div className="p-4 text-center text-[10px] text-gray-600 font-mono uppercase border-t border-white/10 bg-[#0e0e10] flex items-center justify-center gap-2">
                            <Lock size={10} /> Acesso Restrito • Schrodinger Corp.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;