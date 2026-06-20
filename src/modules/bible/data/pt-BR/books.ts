import type {
  BibleBook,
  BibleTestament,
} from '../../interfaces/bible-content.interface';
import { BIBLE_VERSE_COUNTS } from '../verse-counts';

interface LocalBookDefinition {
  id: string;
  name: string;
  abbreviation: string;
  testament: BibleTestament;
  aliases: string[];
}

const DEFINITIONS: LocalBookDefinition[] = [
  { id: 'genesis', name: 'Gênesis', abbreviation: 'Gn', testament: 'old', aliases: ['Genesis', 'Gn'] },
  { id: 'exodo', name: 'Êxodo', abbreviation: 'Êx', testament: 'old', aliases: ['Exodo', 'Ex', 'Êx'] },
  { id: 'levitico', name: 'Levítico', abbreviation: 'Lv', testament: 'old', aliases: ['Levitico', 'Lv'] },
  { id: 'numeros', name: 'Números', abbreviation: 'Nm', testament: 'old', aliases: ['Numeros', 'Nm'] },
  { id: 'deuteronomio', name: 'Deuteronômio', abbreviation: 'Dt', testament: 'old', aliases: ['Deuteronomio', 'Dt'] },
  { id: 'josue', name: 'Josué', abbreviation: 'Js', testament: 'old', aliases: ['Josue', 'Js'] },
  { id: 'juizes', name: 'Juízes', abbreviation: 'Jz', testament: 'old', aliases: ['Juizes', 'Jz'] },
  { id: 'rute', name: 'Rute', abbreviation: 'Rt', testament: 'old', aliases: ['Rt'] },
  { id: '1-samuel', name: '1 Samuel', abbreviation: '1Sm', testament: 'old', aliases: ['Primeiro Samuel', 'Primeira Samuel', 'I Samuel', '1 Sm'] },
  { id: '2-samuel', name: '2 Samuel', abbreviation: '2Sm', testament: 'old', aliases: ['Segundo Samuel', 'Segunda Samuel', 'II Samuel', '2 Sm'] },
  { id: '1-reis', name: '1 Reis', abbreviation: '1Rs', testament: 'old', aliases: ['Primeiro Reis', 'Primeira Reis', 'I Reis', '1 Rs'] },
  { id: '2-reis', name: '2 Reis', abbreviation: '2Rs', testament: 'old', aliases: ['Segundo Reis', 'Segunda Reis', 'II Reis', '2 Rs'] },
  { id: '1-cronicas', name: '1 Crônicas', abbreviation: '1Cr', testament: 'old', aliases: ['1 Cronicas', 'Primeira Crônicas', 'Primeiro Crônicas', 'I Crônicas', 'I Cronicas', '1 Cr'] },
  { id: '2-cronicas', name: '2 Crônicas', abbreviation: '2Cr', testament: 'old', aliases: ['2 Cronicas', 'Segunda Crônicas', 'Segundo Crônicas', 'II Crônicas', 'II Cronicas', '2 Cr'] },
  { id: 'esdras', name: 'Esdras', abbreviation: 'Ed', testament: 'old', aliases: ['Ed'] },
  { id: 'neemias', name: 'Neemias', abbreviation: 'Ne', testament: 'old', aliases: ['Ne'] },
  { id: 'ester', name: 'Ester', abbreviation: 'Et', testament: 'old', aliases: ['Et'] },
  { id: 'jo', name: 'Jó', abbreviation: 'Jó', testament: 'old', aliases: ['Jó'] },
  { id: 'salmos', name: 'Salmos', abbreviation: 'Sl', testament: 'old', aliases: ['Salmo', 'Sl'] },
  { id: 'proverbios', name: 'Provérbios', abbreviation: 'Pv', testament: 'old', aliases: ['Proverbios', 'Pv'] },
  { id: 'eclesiastes', name: 'Eclesiastes', abbreviation: 'Ec', testament: 'old', aliases: ['Ec'] },
  { id: 'canticos', name: 'Cânticos', abbreviation: 'Ct', testament: 'old', aliases: ['Canticos', 'Cântico dos Cânticos', 'Cantico dos Canticos', 'Cantares', 'Ct'] },
  { id: 'isaias', name: 'Isaías', abbreviation: 'Is', testament: 'old', aliases: ['Isaias', 'Is'] },
  { id: 'jeremias', name: 'Jeremias', abbreviation: 'Jr', testament: 'old', aliases: ['Jr'] },
  { id: 'lamentacoes', name: 'Lamentações', abbreviation: 'Lm', testament: 'old', aliases: ['Lamentacoes', 'Lm'] },
  { id: 'ezequiel', name: 'Ezequiel', abbreviation: 'Ez', testament: 'old', aliases: ['Ez'] },
  { id: 'daniel', name: 'Daniel', abbreviation: 'Dn', testament: 'old', aliases: ['Dn'] },
  { id: 'oseias', name: 'Oseias', abbreviation: 'Os', testament: 'old', aliases: ['Oséias', 'Os'] },
  { id: 'joel', name: 'Joel', abbreviation: 'Jl', testament: 'old', aliases: ['Jl'] },
  { id: 'amos', name: 'Amós', abbreviation: 'Am', testament: 'old', aliases: ['Amos', 'Am'] },
  { id: 'obadias', name: 'Obadias', abbreviation: 'Ob', testament: 'old', aliases: ['Ob'] },
  { id: 'jonas', name: 'Jonas', abbreviation: 'Jn', testament: 'old', aliases: ['Jn'] },
  { id: 'miqueias', name: 'Miqueias', abbreviation: 'Mq', testament: 'old', aliases: ['Mq'] },
  { id: 'naum', name: 'Naum', abbreviation: 'Na', testament: 'old', aliases: ['Na'] },
  { id: 'habacuque', name: 'Habacuque', abbreviation: 'Hc', testament: 'old', aliases: ['Hc'] },
  { id: 'sofonias', name: 'Sofonias', abbreviation: 'Sf', testament: 'old', aliases: ['Sf'] },
  { id: 'ageu', name: 'Ageu', abbreviation: 'Ag', testament: 'old', aliases: ['Ag'] },
  { id: 'zacarias', name: 'Zacarias', abbreviation: 'Zc', testament: 'old', aliases: ['Zc'] },
  { id: 'malaquias', name: 'Malaquias', abbreviation: 'Ml', testament: 'old', aliases: ['Ml'] },
  { id: 'mateus', name: 'Mateus', abbreviation: 'Mt', testament: 'new', aliases: ['Evangelho de Mateus', 'Mt'] },
  { id: 'marcos', name: 'Marcos', abbreviation: 'Mc', testament: 'new', aliases: ['Evangelho de Marcos', 'Mc'] },
  { id: 'lucas', name: 'Lucas', abbreviation: 'Lc', testament: 'new', aliases: ['Evangelho de Lucas', 'Lc'] },
  { id: 'joao', name: 'João', abbreviation: 'Jo', testament: 'new', aliases: ['Joao', 'Jo', 'Evangelho de João', 'Evangelho de Joao'] },
  { id: 'atos', name: 'Atos', abbreviation: 'At', testament: 'new', aliases: ['Atos dos Apóstolos', 'Atos dos Apostolos', 'At'] },
  { id: 'romanos', name: 'Romanos', abbreviation: 'Rm', testament: 'new', aliases: ['Rm'] },
  { id: '1-corintios', name: '1 Coríntios', abbreviation: '1Co', testament: 'new', aliases: ['1 Corintios', 'Primeira Coríntios', 'Primeiro Coríntios', 'Primeira Corintios', 'Primeiro Corintios', 'I Coríntios', 'I Corintios', '1 Co'] },
  { id: '2-corintios', name: '2 Coríntios', abbreviation: '2Co', testament: 'new', aliases: ['2 Corintios', 'Segunda Coríntios', 'Segundo Coríntios', 'Segunda Corintios', 'Segundo Corintios', 'II Coríntios', 'II Corintios', '2 Co'] },
  { id: 'galatas', name: 'Gálatas', abbreviation: 'Gl', testament: 'new', aliases: ['Galatas', 'Gl'] },
  { id: 'efesios', name: 'Efésios', abbreviation: 'Ef', testament: 'new', aliases: ['Efesios', 'Ef'] },
  { id: 'filipenses', name: 'Filipenses', abbreviation: 'Fp', testament: 'new', aliases: ['Fp'] },
  { id: 'colossenses', name: 'Colossenses', abbreviation: 'Cl', testament: 'new', aliases: ['Cl'] },
  { id: '1-tessalonicenses', name: '1 Tessalonicenses', abbreviation: '1Ts', testament: 'new', aliases: ['Primeira Tessalonicenses', 'Primeiro Tessalonicenses', 'I Tessalonicenses', '1 Ts'] },
  { id: '2-tessalonicenses', name: '2 Tessalonicenses', abbreviation: '2Ts', testament: 'new', aliases: ['Segunda Tessalonicenses', 'Segundo Tessalonicenses', 'II Tessalonicenses', '2 Ts'] },
  { id: '1-timoteo', name: '1 Timóteo', abbreviation: '1Tm', testament: 'new', aliases: ['1 Timoteo', 'Primeira Timóteo', 'Primeiro Timóteo', 'Primeira Timoteo', 'Primeiro Timoteo', 'I Timóteo', 'I Timoteo', '1 Tm'] },
  { id: '2-timoteo', name: '2 Timóteo', abbreviation: '2Tm', testament: 'new', aliases: ['2 Timoteo', 'Segunda Timóteo', 'Segundo Timóteo', 'Segunda Timoteo', 'Segundo Timoteo', 'II Timóteo', 'II Timoteo', '2 Tm'] },
  { id: 'tito', name: 'Tito', abbreviation: 'Tt', testament: 'new', aliases: ['Tt'] },
  { id: 'filemom', name: 'Filemom', abbreviation: 'Fm', testament: 'new', aliases: ['Filemon', 'Fm'] },
  { id: 'hebreus', name: 'Hebreus', abbreviation: 'Hb', testament: 'new', aliases: ['Hb'] },
  { id: 'tiago', name: 'Tiago', abbreviation: 'Tg', testament: 'new', aliases: ['Tg'] },
  { id: '1-pedro', name: '1 Pedro', abbreviation: '1Pe', testament: 'new', aliases: ['Primeira Pedro', 'Primeiro Pedro', 'I Pedro', '1 Pe'] },
  { id: '2-pedro', name: '2 Pedro', abbreviation: '2Pe', testament: 'new', aliases: ['Segunda Pedro', 'Segundo Pedro', 'II Pedro', '2 Pe'] },
  { id: '1-joao', name: '1 João', abbreviation: '1Jo', testament: 'new', aliases: ['1 Joao', 'Primeira João', 'Primeiro João', 'Primeira Joao', 'Primeiro Joao', 'I João', 'I Joao', '1 Jo'] },
  { id: '2-joao', name: '2 João', abbreviation: '2Jo', testament: 'new', aliases: ['2 Joao', 'Segunda João', 'Segundo João', 'Segunda Joao', 'Segundo Joao', 'II João', 'II Joao', '2 Jo'] },
  { id: '3-joao', name: '3 João', abbreviation: '3Jo', testament: 'new', aliases: ['3 Joao', 'Terceira João', 'Terceiro João', 'Terceira Joao', 'Terceiro Joao', 'III João', 'III Joao', '3 Jo'] },
  { id: 'judas', name: 'Judas', abbreviation: 'Jd', testament: 'new', aliases: ['Jd'] },
  { id: 'apocalipse', name: 'Apocalipse', abbreviation: 'Ap', testament: 'new', aliases: ['Ap'] },
];

export const PT_BR_BIBLE_BOOKS: BibleBook[] = DEFINITIONS.map(
  (definition, index) => ({
    ...definition,
    aliases: [
      definition.name,
      definition.abbreviation,
      ...definition.aliases,
    ],
    chapterCount: BIBLE_VERSE_COUNTS[index].length,
  }),
);
