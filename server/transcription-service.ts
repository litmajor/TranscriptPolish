
import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class TranscriptionService {
  private uploadDir = 'uploads/audio';

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<{
    transcript: string;
    confidence: number;
    speakers?: Array<{ speaker: string; timestamp: string; text: string }>;
  }> {
    const audioPath = path.join(this.uploadDir, filename);
    await fs.writeFile(audioPath, audioBuffer);

    return new Promise((resolve, reject) => {
      // Using Whisper CLI (requires whisper installation)
      const whisper = spawn('whisper', [
        audioPath,
        '--model', 'base',
        '--output_format', 'json',
        '--word_timestamps', 'true',
        '--language', 'en'
      ]);

      let output = '';
      whisper.stdout.on('data', (data) => {
        output += data.toString();
      });

      whisper.on('close', async (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            const transcript = result.segments?.map((s: any) => s.text).join(' ') || '';
            
            resolve({
              transcript,
              confidence: result.confidence || 0.85,
              speakers: this.extractSpeakers(result)
            });

            // Cleanup
            await fs.unlink(audioPath);
          } catch (error) {
            reject(new Error('Failed to parse transcription result'));
          }
        } else {
          reject(new Error('Transcription failed'));
        }
      });
    });
  }

  private extractSpeakers(whisperResult: any): Array<{ speaker: string; timestamp: string; text: string }> {
    // Basic speaker diarization logic
    return whisperResult.segments?.map((segment: any, index: number) => ({
      speaker: `Speaker ${(index % 2) + 1}`, // Simple alternating speakers
      timestamp: this.formatTimestamp(segment.start),
      text: segment.text
    })) || [];
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
