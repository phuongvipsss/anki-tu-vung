import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { extractTextFromFile, chunkText } from '@/lib/parsers';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const studyDir = path.join(process.cwd(), 'Study4');
    
    if (!fs.existsSync(studyDir)) {
      return NextResponse.json({ error: 'Study4 directory not found' }, { status: 404 });
    }

    const files = fs.readdirSync(studyDir);
    const importedResources = [];
    const skippedFiles = [];

    for (const file of files) {
      const ext = path.extname(file).replace('.', '').toLowerCase();
      if (ext !== 'docx' && ext !== 'pdf') {
        skippedFiles.push(file);
        continue;
      }

      const filePath = path.join(studyDir, file);
      
      // Check if this file was already imported
      const existing = await prisma.resource.findFirst({
        where: { localFilePath: filePath }
      });
      
      if (existing) {
        skippedFiles.push(`${file} (Already imported)`);
        continue;
      }

      // Extract text
      const rawText = await extractTextFromFile(filePath, ext);
      if (!rawText || rawText.trim() === '') {
        skippedFiles.push(`${file} (Empty)`);
        continue;
      }

      // Create the resource
      const resource = await prisma.resource.create({
        data: {
          type: 'document',
          title: file,
          localFilePath: filePath,
          fileType: ext,
          status: 'imported'
        }
      });

      // Split into chunks (approx 300 words each)
      const chunks = chunkText(rawText, 300);
      
      // Save chunks
      const chunkData = chunks.map((text, index) => ({
        resourceId: resource.id,
        chunkIndex: index,
        text: text,
        tokenCount: text.split(/\s+/).length // rough word count approximation
      }));

      await prisma.resourceChunk.createMany({
        data: chunkData
      });

      importedResources.push({
        id: resource.id,
        title: resource.title,
        chunkCount: chunks.length
      });
    }

    return NextResponse.json({
      success: true,
      importedResources,
      skippedFiles
    });

  } catch (error) {
    console.error('Error during ingestion:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
