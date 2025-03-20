import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Agenda, Process } from '../types';
import { useStore } from '../store';

const loadImage = async (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      console.error('Error loading image:', error);
      // Resolve without image instead of rejecting
      resolve(null);
    };
    img.src = url;
  });
};

const addHeaderToPDF = async (doc: jsPDF, headerContent: string, alignment: 'left' | 'center' | 'right') => {
  try {
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.width;
    
    // Extract image URL from header content if it exists
    const imgMatch = headerContent.match(/src="([^"]+)"/);
    if (imgMatch) {
      const imgUrl = imgMatch[1];
      
      try {
        const img = await loadImage(imgUrl);
        
        // Only add image if it loaded successfully
        if (img) {
          // Calculate image dimensions and position
          const imgWidth = 40;
          const imgHeight = 40;
          const imgX = alignment === 'center' ? (pageWidth - imgWidth) / 2 : 
                      alignment === 'right' ? pageWidth - imgWidth - 20 : 20;
          
          // Add image to PDF
          doc.addImage(img, 'PNG', imgX, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 8; // Add some spacing after the image
        }
      } catch (error) {
        console.error('Failed to add image to PDF:', error);
        // Continue without the image
      }
    }

    // Add text lines with proper formatting
    const lines = [
      'MINISTÉRIO PÚBLICO DE CONTAS DO ESTADO DE GOIÁS',
      'Controle Externo da Administração Pública Estadual'
    ];

    // Set font for header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    lines.forEach((line) => {
      const textWidth = doc.getTextWidth(line);
      const textX = alignment === 'center' ? (pageWidth - textWidth) / 2 : 
                   alignment === 'right' ? pageWidth - textWidth - 20 : 20;
      
      doc.text(line, textX, yPos);
      yPos += 6;
    });

    return yPos + 10; // Return the new Y position with some padding
  } catch (error) {
    console.error('Error adding header:', error);
    // Continue without header but don't fail the export
    return 20;
  }
};

export const exportToPDF = async (agenda: Agenda, processes: Process[]) => {
  const { documentConfig } = useStore.getState();
  const doc = new jsPDF();
  
  try {
    // Add header and get the new Y position
    let yPos = await addHeaderToPDF(doc, documentConfig.header.content, documentConfig.header.alignment);

    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titleText = `Pauta ${agenda.type} nº ${agenda.number}`;
    const titleWidth = doc.getTextWidth(titleText);
    const pageWidth = doc.internal.pageSize.width;
    doc.text(titleText, (pageWidth - titleWidth) / 2, yPos);
    yPos += 8;

    // Add date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const dateText = `Data: ${format(new Date(agenda.date), 'dd/MM/yyyy')}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (pageWidth - dateWidth) / 2, yPos);
    yPos += 15;

    // Add processes
    processes.forEach((process, index) => {
      // Check if we need a new page
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
        addHeaderToPDF(doc, documentConfig.header.content, documentConfig.header.alignment)
          .then(newYPos => { yPos = newYPos; });
      }

      // Process number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Processo ${index + 1}: ${process.processNumber}`, 20, yPos);
      yPos += 8;

      // Process details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const addText = (text: string, label: string) => {
        if (!text) return; // Skip empty fields
        
        const lines = doc.splitTextToSize(`${label}: ${text}`, 170);
        lines.forEach((line: string) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
            addHeaderToPDF(doc, documentConfig.header.content, documentConfig.header.alignment)
              .then(newYPos => { yPos = newYPos; });
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
        yPos += 2;
      };

      addText(process.counselorName, 'Conselheiro');
      addText(process.processType, 'Tipo');
      addText(process.stakeholders, 'Interessados');
      addText(process.summary, 'Ementa');
      addText(process.voteType, 'Tipo de Voto');
      
      if (process.voteType !== 'não houve análise de mérito pelo MPC') {
        addText(process.mpcOpinionSummary, 'Parecer do MPC');
      }
      
      addText(process.tceReportSummary, 'Relatório/Voto TCE');
      
      if (process.hasViewVote) {
        addText(process.viewVoteSummary, 'Voto Vista');
      }
      
      if (process.mpcSystemManifest) {
        addText(process.mpcSystemManifest, 'Manifestação do MPC');
      }
      
      yPos += 8; // Add spacing between processes
    });

    doc.save(`pauta_${agenda.number}_${format(new Date(agenda.date), 'dd-MM-yyyy')}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
  }
};

export const exportToExcel = (agenda: Agenda, processes: Process[]) => {
  const processesData = processes.map(process => ({
    'Número do Processo': process.processNumber,
    'Conselheiro': process.counselorName,
    'Tipo de Processo': process.processType,
    'Interessados': process.stakeholders,
    'Ementa': process.summary,
    'Tipo de Voto': process.voteType,
    'Parecer do MPC': process.voteType !== 'não houve análise de mérito pelo MPC' ? process.mpcOpinionSummary : '',
    'Relatório/Voto TCE': process.tceReportSummary,
    'Teve Voto Vista': process.hasViewVote ? 'Sim' : 'Não',
    'Voto Vista': process.hasViewVote ? process.viewVoteSummary : '',
    'Manifestação do MPC': process.mpcSystemManifest || '',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(processesData);

  // Add header with agenda information
  XLSX.utils.sheet_add_aoa(ws, [
    [`Pauta ${agenda.type} nº ${agenda.number}`],
    [`Data: ${format(new Date(agenda.date), 'dd/MM/yyyy')}`],
    [''],  // Empty row for spacing
  ], { origin: 'A1' });

  // Adjust column widths
  const maxWidth = 50;
  const colWidths = Object.keys(processesData[0] || {}).map(() => ({ wch: maxWidth }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Processos');
  XLSX.writeFile(wb, `pauta_${agenda.number}_${format(new Date(agenda.date), 'dd-MM-yyyy')}.xlsx`);
};

export const exportToWord = (agenda: Agenda, processes: Process[]) => {
  const { documentConfig } = useStore.getState();
  
  // Create HTML content with proper styling
  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { margin: 2cm; }
        body { 
          font-family: Arial, sans-serif;
          line-height: 1.5;
          margin: 0;
          padding: 0;
        }
        .header { 
          text-align: ${documentConfig.header.alignment};
          margin-bottom: 20px;
        }
        .header img { 
          width: 40px;
          height: 40px;
          object-fit: contain;
        }
        .header p { 
          font-family: Arial;
          font-size: 10pt;
          font-weight: bold;
          margin: 5px 0;
        }
        .title { 
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          margin: 20px 0;
          font-family: Arial;
        }
        .date { 
          text-align: center;
          margin-bottom: 20px;
          font-family: Arial;
          font-size: 12pt;
        }
        .process { 
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .process-header { 
          font-family: Arial;
          font-weight: bold;
          font-size: 11pt;
          margin-bottom: 10px;
        }
        .process-field { 
          margin-bottom: 5px;
          font-family: Arial;
          font-size: 10pt;
        }
        .label { 
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${documentConfig.header.content}
      </div>
      <div class="title">Pauta ${agenda.type} nº ${agenda.number}</div>
      <div class="date">Data: ${format(new Date(agenda.date), 'dd/MM/yyyy')}</div>
  `;

  processes.forEach((process, index) => {
    content += `
      <div class="process">
        <div class="process-header">Processo ${index + 1}: ${process.processNumber}</div>
        <div class="process-field"><span class="label">Conselheiro:</span> ${process.counselorName}</div>
        <div class="process-field"><span class="label">Tipo:</span> ${process.processType}</div>
        <div class="process-field"><span class="label">Interessados:</span> ${process.stakeholders}</div>
        <div class="process-field"><span class="label">Ementa:</span> ${process.summary}</div>
        <div class="process-field"><span class="label">Tipo de Voto:</span> ${process.voteType}</div>
    `;

    if (process.voteType !== 'não houve análise de mérito pelo MPC') {
      content += `<div class="process-field"><span class="label">Parecer do MPC:</span> ${process.mpcOpinionSummary}</div>`;
    }

    content += `<div class="process-field"><span class="label">Relatório/Voto TCE:</span> ${process.tceReportSummary}</div>`;

    if (process.hasViewVote) {
      content += `<div class="process-field"><span class="label">Voto Vista:</span> ${process.viewVoteSummary}</div>`;
    }

    if (process.mpcSystemManifest) {
      content += `<div class="process-field"><span class="label">Manifestação do MPC:</span> ${process.mpcSystemManifest}</div>`;
    }

    content += '</div>';
  });

  content += `
    </body>
    </html>
  `;

  // Create a Blob with the HTML content
  const blob = new Blob([content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pauta_${agenda.number}_${format(new Date(agenda.date), 'dd-MM-yyyy')}.doc`;
  link.click();
  URL.revokeObjectURL(url);
};