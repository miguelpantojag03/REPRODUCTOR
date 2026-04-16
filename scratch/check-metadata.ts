import fs from 'fs/promises';
import { parseBuffer } from 'music-metadata';
import path from 'path';

async function checkMetadata() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'audio', 'Sebastián Yatra, Reik - Un Año (Official Video).mp3');
    const buffer = await fs.readFile(filePath);
    const metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });
    
    console.log('Metadata Title:', metadata.common.title);
    console.log('Metadata Duration:', metadata.format.duration);
    console.log('Is duration NaN?', isNaN(metadata.format.duration as number));
  } catch (error) {
    console.error('Metadata check failed:', error);
  }
}

checkMetadata();
