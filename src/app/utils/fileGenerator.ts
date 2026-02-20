import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import type { Template } from '../types';
import { resolveVariables } from './engine';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_MIME = 'application/pdf';

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildDocumentXml = (content: string): string => {
  const lines = content.split(/\r?\n/);
  const paragraphs = lines
    .map((line) => {
      const text = escapeXml(line);
      return `    <w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${paragraphs || '    <w:p />'}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838" />
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0" />
    </w:sectPr>
  </w:body>
</w:document>`;
};

const buildDocxZip = (content: string): PizZip => {
  const zip = new PizZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.file('word/document.xml', buildDocumentXml(content));
  return zip;
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const generateDocx = async (
  templateContent: string,
  values: Record<string, string>
): Promise<Blob> => {
  try {
    const zip = buildDocxZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
    });

    doc.setData(values);
    doc.render();

    return doc.getZip().generate({ type: 'blob', mimeType: DOCX_MIME });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const generateDocxFromBase64 = async (
  fileBase64: string,
  values: Record<string, string>
): Promise<Blob> => {
  try {
    const zip = new PizZip(fileBase64, { base64: true });
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(values);
    doc.render();

    return doc.getZip().generate({ type: 'blob', mimeType: DOCX_MIME });
  } catch (error) {
    throw error;
  }
};

const generateXlsx = async (values: Record<string, string>): Promise<Blob> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Données');

  worksheet.columns = [
    { header: 'Clé', key: 'key', width: 30 },
    { header: 'Valeur', key: 'value', width: 50 },
  ];

  Object.entries(values).forEach(([key, value]) => {
    worksheet.addRow({ key, value });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: XLSX_MIME });
};

const replaceXlsxPlaceholders = (
  text: string,
  values: Record<string, string>
): string => {
  return Object.entries(values).reduce((current, [key, value]) => {
    return current.replaceAll(`{{${key}}}`, value ?? '');
  }, text);
};

const generateXlsxFromBase64 = async (
  fileBase64: string,
  values: Record<string, string>
): Promise<Blob> => {
  const workbook = new ExcelJS.Workbook();
  const bytes = base64ToUint8Array(fileBase64);
  await workbook.xlsx.load(bytes.buffer);

  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === 'string') {
          cell.value = replaceXlsxPlaceholders(cell.value, values);
        }
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: XLSX_MIME });
};

const generatePdf = async (content: string): Promise<Blob> => {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  const documentDefinition = {
    content: [{ text: content || '' }],
    defaultStyle: {
      fontSize: 11,
    },
  };

  return new Promise<Blob>((resolve, reject) => {
    try {
      pdfMake.createPdf(documentDefinition).getBlob((blob) => resolve(blob));
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const generatePdfFromBase64 = async (fileBase64: string): Promise<Blob> => {
  const bytes = base64ToUint8Array(fileBase64);
  return new Blob([bytes], { type: PDF_MIME });
};

const generateEmail = (content: string, subject: string): Blob => {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'Email'}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #4f46e5; color: white; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 600; }
    .body { padding: 32px; color: #1e293b; font-size: 14px; line-height: 1.6; }
    .footer { padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${subject || 'Message'}</h1></div>
    <div class="body">${content || ''}</div>
    <div class="footer">Généré par DocGen Pro</div>
  </div>
</body>
</html>`;
  return new Blob([html], { type: 'message/rfc822' });
};

/**
 * Génère un fichier téléchargeable à partir d'un template et de valeurs résolues
 */
export async function generateFile(
  template: Template,
  values: Record<string, string>
): Promise<Blob> {
  try {
    const resolvedContent = resolveVariables(template.content || '', values);

    if (template.fileBase64) {
      switch (template.type) {
        case 'DOCX':
          return generateDocxFromBase64(template.fileBase64, values);
        case 'XLSX':
          return generateXlsxFromBase64(template.fileBase64, values);
        case 'PDF':
          return generatePdfFromBase64(template.fileBase64);
        default:
          break;
      }
    }

    switch (template.type) {
      case 'DOCX':
        return generateDocx(template.content || '', values);
      case 'XLSX':
        return generateXlsx(values);
      case 'PDF':
        return generatePdf(resolvedContent);
      case 'EMAIL':
        return generateEmail(
          resolveVariables(template.content || '', values),
          resolveVariables(template.emailSubject || '', values)
        );
      default:
        return new Blob([resolvedContent], { type: 'text/plain' });
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
