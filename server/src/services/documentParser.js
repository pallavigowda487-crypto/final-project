import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const toBuffer = async (filePathOrBuffer) => {
  if (Buffer.isBuffer(filePathOrBuffer)) return filePathOrBuffer;
  return fs.readFile(filePathOrBuffer);
};

const isPdf = (mimeType, name) =>
  mimeType === 'application/pdf' || (name && name.toLowerCase().endsWith('.pdf'));

const isDocx = (mimeType, name) =>
  mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
  (name && name.toLowerCase().endsWith('.docx'));

export const extractTextFromFile = async (filePathOrBuffer, mimeType, fileName = '') => {
  const buffer = await toBuffer(filePathOrBuffer);
  const name = fileName || (typeof filePathOrBuffer === 'string' ? filePathOrBuffer : '');

  if (isPdf(mimeType, name)) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (isDocx(mimeType, name)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error('Unsupported file type. Use PDF or DOCX.');
};
