import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, statSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { VoskModelPathStatus } from '../interfaces/settings.interface';

const MAXIMUM_MODEL_PATH_LENGTH = 1_024;

@Injectable()
export class ModelPathService {
  normalize(value: unknown): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        'Caminho do modelo Vosk deve ser um texto.',
      );
    }

    const modelPath = value.trim();

    if (!modelPath) {
      return null;
    }

    if (modelPath.length > MAXIMUM_MODEL_PATH_LENGTH) {
      throw new BadRequestException(
        `Caminho do modelo Vosk deve ter no máximo ${MAXIMUM_MODEL_PATH_LENGTH} caracteres.`,
      );
    }

    if (modelPath.includes('\0')) {
      throw new BadRequestException(
        'Caminho do modelo Vosk contém caracteres inválidos.',
      );
    }

    return modelPath;
  }

  inspect(modelPath: string | null): VoskModelPathStatus {
    if (!modelPath) {
      return {
        configured: false,
        exists: false,
        isDirectory: false,
        valid: false,
        code: 'not-configured',
        message: 'Nenhum diretório de modelo configurado.',
      };
    }

    const resolvedPath = isAbsolute(modelPath)
      ? modelPath
      : resolve(process.cwd(), modelPath);

    if (!existsSync(resolvedPath)) {
      return {
        configured: true,
        exists: false,
        isDirectory: false,
        valid: false,
        code: 'not-found',
        message: 'Diretório não encontrado.',
      };
    }

    try {
      const isDirectory = statSync(resolvedPath).isDirectory();

      return isDirectory
        ? {
            configured: true,
            exists: true,
            isDirectory: true,
            valid: true,
            code: 'directory-found',
            message: 'Diretório encontrado.',
          }
        : {
            configured: true,
            exists: true,
            isDirectory: false,
            valid: false,
            code: 'not-directory',
            message: 'O caminho existe, mas não é um diretório.',
          };
    } catch {
      return {
        configured: true,
        exists: true,
        isDirectory: false,
        valid: false,
        code: 'unreadable',
        message: 'Não foi possível verificar o diretório.',
      };
    }
  }
}
