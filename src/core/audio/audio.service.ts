import { Injectable, Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { PassThrough } from 'stream';
import axios from 'axios';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  constructor() {
    ffmpeg.setFfmpegPath(ffmpegPath.path);
    this.logger.log(`FFmpeg path set to: ${ffmpegPath.path}`);
  }

  /**
   * Convert audio to OGG/OPUS format for WhatsApp PTT
   * Following Evolution API implementation
   */
  async processAudio(audio: string | Buffer): Promise<Buffer> {
    let inputStream: PassThrough;

    if (Buffer.isBuffer(audio)) {
      inputStream = new PassThrough();
      inputStream.end(audio);
    } else if (this.isUrl(audio)) {
      const response = await axios.get(audio, { responseType: 'stream' });
      inputStream = response.data.pipe(new PassThrough());
    } else if (this.isBase64(audio)) {
      // Handle base64 with or without data URI prefix
      const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
      const buffer = Buffer.from(base64Data, 'base64');
      inputStream = new PassThrough();
      inputStream.end(buffer);
    } else {
      throw new Error('Invalid audio source: must be Buffer, URL, or base64');
    }

    return this.convertToOpus(inputStream);
  }

  /**
   * Convert audio stream to OGG/OPUS using ffmpeg
   */
  private convertToOpus(inputStream: PassThrough): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const outputStream = new PassThrough();
      const chunks: Buffer[] = [];

      outputStream.on('data', (chunk) => chunks.push(chunk));
      outputStream.on('end', () => {
        const outputBuffer = Buffer.concat(chunks);
        this.logger.debug(`Audio converted: ${outputBuffer.length} bytes`);
        resolve(outputBuffer);
      });
      outputStream.on('error', (error) => {
        this.logger.error(`Output stream error: ${error.message}`);
        reject(error);
      });

      ffmpeg(inputStream)
        .outputFormat('ogg')
        .noVideo()
        .audioCodec('libopus')
        .addOutputOptions('-avoid_negative_ts make_zero')
        .audioBitrate('128k')
        .audioFrequency(48000)
        .audioChannels(1)
        .outputOptions([
          '-write_xing',
          '0',
          '-compression_level',
          '10',
          '-application',
          'voip',
          '-fflags',
          '+bitexact',
          '-flags',
          '+bitexact',
          '-id3v2_version',
          '0',
          '-map_metadata',
          '-1',
          '-map_chapters',
          '-1',
          '-write_bext',
          '0',
        ])
        .pipe(outputStream, { end: true })
        .on('error', (error) => {
          this.logger.error(`FFmpeg error: ${error.message}`);
          reject(error);
        });
    });
  }

  /**
   * Check if string is a valid URL
   */
  private isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if string is base64 encoded
   */
  private isBase64(str: string): boolean {
    if (str.startsWith('data:')) return true;
    const base64Regex =
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Regex.test(str) && str.length > 100;
  }
}
