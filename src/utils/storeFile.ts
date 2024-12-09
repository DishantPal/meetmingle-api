import { randomBytes } from 'crypto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { config } from '@/config/index.js';

async function storeFile(
  file: File | null,
  storePath: string,
  fileName?: string
): Promise<string> {
  if (!file) {
    throw new Error('No file provided');
  }

  await fs.mkdir(storePath, { recursive: true });

  const extension = file.name.split('.').pop() || '';
  
  let finalFileName: string;
  if (fileName) {
    finalFileName = fileName.includes('.') ? fileName : `${fileName}.${extension}`;
  } else {
    finalFileName = `${randomBytes(10).toString('hex').slice(0, 20)}.${extension}`;
  }

  const filePath = join(storePath, finalFileName);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  const imgUrl = `${config.app.img_url}/${storePath.replace('storage/', '')}/${finalFileName}`;

  return imgUrl;
}

export default storeFile;