import { TranscriptionCorrectionService } from '../services/transcription-correction.service';

describe('TranscriptionCorrectionService', () => {
  const service = new TranscriptionCorrectionService();

  it('corrige "capeta" para "capitulo"', () => {
    expect(service.correct('vamos para gênesis capeta 3')).toBe(
      'vamos para gênesis capitulo 3',
    );
  });

  it.each(['capiculo', 'capitolo'])(
    'corrige variação conhecida "%s" para "capitulo"',
    (word) => {
      expect(service.correct(`joão ${word} 3`)).toBe('joão capitulo 3');
    },
  );

  it('preserva "capítulo" já correto, com acento', () => {
    expect(service.correct('vamos para 1 coríntios capítulo 13')).toBe(
      'vamos para 1 coríntios capítulo 13',
    );
  });

  it('não altera nomes de livros bíblicos', () => {
    expect(service.correct('vamos para apocalipse 12 13')).toBe(
      'vamos para apocalipse 12 13',
    );
  });

  it('corrige pequenos desvios por distância de edição', () => {
    expect(service.correct('vamos para joão versiculu 3 16')).toBe(
      'vamos para joão versiculo 3 16',
    );
  });

  it('não corrige palavras curtas', () => {
    expect(service.correct('vamos para joão 3 16')).toBe(
      'vamos para joão 3 16',
    );
  });

  it('mantém entrada vazia ou não textual', () => {
    expect(service.correct('')).toBe('');
    expect(service.correct(undefined)).toBe('');
  });
});
