import { BadRequestException } from '@nestjs/common';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ModelPathService } from './model-path.service';

describe('ModelPathService', () => {
  const service = new ModelPathService();
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(
      join(tmpdir(), 'holyrics-model-path-'),
    );
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it('informa quando nenhum modelo está configurado', () => {
    expect(service.inspect(null)).toEqual({
      configured: false,
      exists: false,
      isDirectory: false,
      valid: false,
      code: 'not-configured',
      message: 'Nenhum diretório de modelo configurado.',
    });
  });

  it('valida um diretório existente', () => {
    const modelDirectory = join(temporaryDirectory, 'model');
    mkdirSync(modelDirectory);

    expect(service.inspect(modelDirectory)).toMatchObject({
      configured: true,
      exists: true,
      isDirectory: true,
      valid: true,
      code: 'directory-found',
    });
  });

  it('marca um diretório inexistente como inválido', () => {
    expect(
      service.inspect(join(temporaryDirectory, 'missing-model')),
    ).toMatchObject({
      configured: true,
      exists: false,
      isDirectory: false,
      valid: false,
      code: 'not-found',
    });
  });

  it('rejeita um arquivo no lugar de um diretório', () => {
    const filePath = join(temporaryDirectory, 'model.txt');
    writeFileSync(filePath, 'not a model');

    expect(service.inspect(filePath)).toMatchObject({
      configured: true,
      exists: true,
      isDirectory: false,
      valid: false,
      code: 'not-directory',
    });
  });

  it('normaliza espaços sem exigir que o diretório já exista', () => {
    expect(service.normalize(' models/pt-BR/example ')).toBe(
      'models/pt-BR/example',
    );
  });

  it('rejeita caminho com caractere nulo', () => {
    expect(() => service.normalize('models/pt-BR/\0model')).toThrow(
      BadRequestException,
    );
  });
});
