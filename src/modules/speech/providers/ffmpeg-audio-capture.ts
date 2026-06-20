import { Injectable } from '@nestjs/common';
import {
  execFile,
  spawn,
  type ChildProcessByStdio,
} from 'node:child_process';
import { platform } from 'node:os';
import type { Readable } from 'node:stream';
import { promisify } from 'node:util';
import type {
  AudioCapture,
  AudioCaptureHandlers,
} from '../interfaces/audio-capture.interface';
import type { SpeechMicrophone } from '../interfaces/speech.interface';

const execFileAsync = promisify(execFile);
const CAPTURE_START_TIMEOUT_MS = 3_000;

@Injectable()
export class FfmpegAudioCapture implements AudioCapture {
  private captureProcess:
    | ChildProcessByStdio<null, Readable, Readable>
    | null = null;
  private stopRequested = false;

  async listMicrophones(): Promise<SpeechMicrophone[]> {
    if (platform() !== 'linux') {
      return [
        {
          id: 'default',
          name: 'Entrada padrão do sistema',
          isDefault: true,
        },
      ];
    }

    try {
      const [defaultSource, { stdout }] = await Promise.all([
        this.getDefaultPulseSource(),
        execFileAsync('pactl', ['list', 'short', 'sources']),
      ]);
      const sources = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(/\t+/)[1]?.trim())
        .filter(
          (id): id is string =>
            Boolean(id) && !id.endsWith('.monitor'),
        )
        .map((id) => ({
          id,
          name: id,
          isDefault: id === defaultSource,
        }));

      return [
        {
          id: 'default',
          name: defaultSource
            ? `Entrada padrão do sistema (${defaultSource})`
            : 'Entrada padrão do sistema',
          isDefault: true,
        },
        ...sources,
      ];
    } catch {
      return [
        {
          id: 'default',
          name: 'Entrada padrão do sistema',
          isDefault: true,
        },
      ];
    }
  }

  async start(
    microphone: string,
    sampleRate: number,
    handlers: AudioCaptureHandlers,
  ): Promise<void> {
    if (this.captureProcess) {
      return;
    }

    const command = this.buildCommand(microphone, sampleRate);
    const child = spawn(command.file, command.args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    this.captureProcess = child;
    this.stopRequested = false;

    let stderr = '';
    let started = false;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!started) {
          this.stopRequested = true;
          child.kill('SIGTERM');
          reject(
            new Error(
              'A captura não produziu áudio dentro do tempo esperado.',
            ),
          );
        }
      }, CAPTURE_START_TIMEOUT_MS);

      const settleStarted = (): void => {
        if (started) {
          return;
        }

        started = true;
        clearTimeout(timeout);
        resolve();
      };

      child.stdout.on('data', (chunk: Buffer) => {
        settleStarted();
        handlers.onAudio(chunk);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr = `${stderr}${chunk.toString()}`.slice(-2_000);
      });

      child.once('error', (error) => {
        clearTimeout(timeout);
        this.captureProcess = null;

        if (!started) {
          reject(error);
          return;
        }

        handlers.onFailure(error.message);
      });

      child.once('exit', (code, signal) => {
        clearTimeout(timeout);
        this.captureProcess = null;
        const requested = this.stopRequested;
        this.stopRequested = false;

        if (requested) {
          if (!started) {
            reject(new Error('Captura interrompida antes de iniciar.'));
          }
          return;
        }

        const detail = stderr.trim();
        const message = detail
          ? `A captura de áudio foi encerrada: ${detail}`
          : `A captura de áudio foi encerrada (${signal ?? code ?? 'sem código'}).`;

        if (!started) {
          reject(new Error(message));
          return;
        }

        handlers.onFailure(message);
      });
    });
  }

  async stop(): Promise<void> {
    const child = this.captureProcess;

    if (!child) {
      return;
    }

    this.stopRequested = true;
    this.captureProcess = null;
    child.kill('SIGTERM');
  }

  private async getDefaultPulseSource(): Promise<string | null> {
    const { stdout } = await execFileAsync('pactl', [
      'get-default-source',
    ]);

    return stdout.trim() || null;
  }

  private buildCommand(
    microphone: string,
    sampleRate: number,
  ): { file: string; args: string[] } {
    const commonOutput = [
      '-ac',
      '1',
      '-ar',
      String(sampleRate),
      '-f',
      's16le',
      'pipe:1',
    ];

    if (platform() === 'win32') {
      const input =
        microphone === 'default' ? 'audio=default' : `audio=${microphone}`;

      return {
        file: 'ffmpeg',
        args: [
          '-hide_banner',
          '-loglevel',
          'error',
          '-f',
          'dshow',
          '-i',
          input,
          ...commonOutput,
        ],
      };
    }

    if (platform() === 'darwin') {
      const input = microphone === 'default' ? ':0' : microphone;

      return {
        file: 'ffmpeg',
        args: [
          '-hide_banner',
          '-loglevel',
          'error',
          '-f',
          'avfoundation',
          '-i',
          input,
          ...commonOutput,
        ],
      };
    }

    return {
      file: 'ffmpeg',
      args: [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'pulse',
        '-i',
        microphone,
        ...commonOutput,
      ],
    };
  }
}
