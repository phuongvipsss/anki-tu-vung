import fs from 'fs';
import mammoth from 'mammoth';
// @ts-expect-error - The @types/pdf-parse doesn't export a default but the CJS module does
import pdfParse from 'pdf-parse';

/**
 * Extracts raw text from a given file based on its extension.
 */
export async function extractTextFromFile(filePath: string, extension: string): Promise<string> {
  const ext = extension.toLowerCase();
  
  if (ext === 'docx') {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  if (ext === 'pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  
  throw new Error(`Unsupported file type: ${extension}`);
}

/**
 * Splits extracted text into an array of smaller chunks.
 * We can split by paragraphs and group them until they reach an approximate token limit (word count based).
 */
export function chunkText(text: string, wordsPerChunk: number = 300): string[] {
  // Simple paragraph split
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;
  
  for (const p of paragraphs) {
    const pWordCount = p.split(/\s+/).length;
    
    currentChunk.push(p);
    currentWordCount += pWordCount;
    
    if (currentWordCount >= wordsPerChunk) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [];
      currentWordCount = 0;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }
  
  return chunks;
}
