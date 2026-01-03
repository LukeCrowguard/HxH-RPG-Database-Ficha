import { createClient } from '@supabase/supabase-js';
import { Character, NenType } from '../types';

// Safely get environment variables
const getEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const env = getEnv();

// Use Environment variables if available, otherwise use the provided hardcoded keys
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://cdxdpjodsyknyaojjbig.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkeGRwam9kc3lrbnlhb2pqYmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MTEwNjEsImV4cCI6MjA4Mjk4NzA2MX0.jus2sDdvS41bV4o4JTio3ph4AkmuX4asui-U3SbvIqU';

// Initialize the client safely
let client = null;
try {
    if (supabaseUrl && supabaseAnonKey) {
        client = createClient(supabaseUrl, supabaseAnonKey);
    }
} catch (e) {
    console.error("Failed to initialize Supabase client", e);
}

export const supabase = client;

export const isSupabaseConfigured = () => {
  return !!supabase;
};

// Initial default character (Hades Template)
export const INITIAL_CHARACTER: Character = {
  id: 'char_default',
  name: "Cristian Martínez",
  nickname: "'Hades'",
  avatarUrl: "https://i.pinimg.com/736x/8e/46/64/8e4664440076a084c7873994c657a827.jpg",
  age: 18,
  nationality: "Peruano",
  height: "1.72 m",
  weight: "64 kg",
  alignment: "Neutro-Neutro",
  bio: "Hades cresceu nas ruas de Meteor City...",
  hunterLevel: 5,
  xp: 250,
  maxXp: 600,
  nenType: NenType.Specialist,
  maxHp: 34,
  currentHp: 34,
  maxNen: 58,
  currentNen: 33,
  ca: 15,
  attributes: { strength: -2, constitution: -2, intelligence: 0, charisma: -3, determination: 3, prestidigitation: 5 },
  attributeLabels: { strength: 'Força', constitution: 'Constituição', intelligence: 'Inteligência', charisma: 'Carisma', determination: 'Determinação', prestidigitation: 'Destreza' },
  attributeMetadata: {},
  equippedWeapon: { name: 'Foice de Nen', damage: '1d10', description: 'Uma foice materializada que drena aura.', powers: 'Ao acertar um crítico, recupera 1d4 de Nen.', imageUrl: '' },
  skills: [
      { id: '1', name: 'Força de Pulso', category: 'Weapon', type: 'Ativa', cost: 2, costType: 'Nen', damageDice: '1d8', attributeScaling: 'determination', description: 'Golpeia o ar criando uma onda de choque.', imageUrl: 'https://i.pinimg.com/564x/4d/2e/77/4d2e77987823e595df5057a151859c2c.jpg' },
      { id: '2', name: 'Passo Sombrio', category: 'Combat', type: 'Bônus', cost: 0, costType: 'Nen', damageDice: '2d6', attributeScaling: 'prestidigitation', description: 'Movimentação silenciosa. Vantagem no ataque.', imageUrl: '' },
      { id: '3', name: 'Sacrifício de Sangue', category: 'Hatsu', type: 'Ativa', cost: 5, costType: 'HP', damageDice: '3d6', attributeScaling: '', description: 'Sacrifica vitalidade para causar dano massivo.', imageUrl: '' },
  ],
  inventory: [
      { id: 'i1', name: "Espada Curta", quantity: 1 },
      { id: 'i2', name: "Poção de Cura", quantity: 2 },
      { id: 'i3', name: "Licença Hunter", quantity: 1 }
  ],
  summons: [
       { id: 's1', name: 'Guardião Sombrio', avatarUrl: 'https://i.pinimg.com/564x/0a/65/59/0a6559385b0451df6718d09794025171.jpg', type: 'Besta de Nen', currentHp: 20, maxHp: 20, currentNen: 10, maxNen: 10, attributes: { strength: 3, constitution: 2, intelligence: -2, charisma: -3, determination: 4, prestidigitation: 2 }, description: 'Um lobo feito de sombras.', skills: [
           { id: 's1k1', name: 'Mordida Sombria', category: 'Combat', type: 'Passive', cost: 2, costType: 'Nen', damage: '1d6', description: 'Ataque rápido com as presas.' }
       ] }
  ],
  conditions: ['Ren', 'Furtividade']
};

// Service Functions
export const fetchCharacters = async (): Promise<Character[]> => {
  if (!supabase) {
    console.warn("Supabase not configured. Using local default.");
    return [INITIAL_CHARACTER];
  }

  try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching characters:', error);
        return [INITIAL_CHARACTER];
      }

      if (!data || data.length === 0) {
          return [INITIAL_CHARACTER];
      }

      return data.map((row: any) => ({
        ...row.data,
        id: row.id
      }));
  } catch (err) {
      console.error("Critical error fetching characters:", err);
      return [INITIAL_CHARACTER];
  }
};

export const saveCharacter = async (character: Character): Promise<void> => {
  if (!supabase) {
    alert("Supabase não configurado.");
    return;
  }

  const { error } = await supabase
    .from('characters')
    .upsert({
      id: character.id,
      data: character,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving character:', error);
    alert("Erro ao salvar no banco de dados.");
    throw error;
  }
};

export const deleteCharacter = async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) throw error;
}