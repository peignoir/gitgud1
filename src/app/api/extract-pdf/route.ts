import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const data = await pdf(buffer);
    const text = data.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text found in PDF' },
        { status: 400 }
      );
    }

    console.log('✅ [PDF Extract] Extracted', text.length, 'characters from PDF');

    return NextResponse.json({ text });
  } catch (error) {
    console.error('❌ [PDF Extract] Error:', error);
    return NextResponse.json(
      { error: 'Failed to extract PDF text' },
      { status: 500 }
    );
  }
}
