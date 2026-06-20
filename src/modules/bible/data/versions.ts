import type { BibleVersion } from '../interfaces/bible-content.interface';

/**
 * Identificadores locais para preparar seleção de versão.
 * Não representam conteúdo instalado nem versões confirmadas no Holyrics.
 */
export const LOCAL_BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: 'nvi',
    name: 'Nova Versão Internacional',
    abbreviation: 'NVI',
    contentAvailable: false,
  },
  {
    id: 'naa',
    name: 'Nova Almeida Atualizada',
    abbreviation: 'NAA',
    contentAvailable: false,
  },
  {
    id: 'acf',
    name: 'Almeida Corrigida Fiel',
    abbreviation: 'ACF',
    contentAvailable: false,
  },
  {
    id: 'arc',
    name: 'Almeida Revista e Corrigida',
    abbreviation: 'ARC',
    contentAvailable: false,
  },
];

export const DEFAULT_BIBLE_VERSION_ID = 'nvi';
