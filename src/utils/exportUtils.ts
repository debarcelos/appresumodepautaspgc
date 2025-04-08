import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, UnderlineType, TabStopType } from 'docx';
import { saveAs } from 'file-saver';
import { Agenda, Process } from '../types';
import * as XLSX from 'xlsx';
import { parse, HTMLElement, TextNode } from 'node-html-parser';

// Interface para estilo inline do HTML
interface InlineStyle {
  backgroundColor?: string;
}

// Função para converter HTML em elementos docx preservando formatação
const htmlToDocxElements = (html: string): Paragraph[] => {
  if (!html) return [new Paragraph({ 
    text: 'Não informado', 
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 240 }
  })];
  
  const root = parse(html);
  const elements: Paragraph[] = [];
  
  const processNode = (node: HTMLElement | TextNode): TextRun | TextRun[] | null => {
    if (node.nodeType === 3) { // Text node
      const textNode = node as TextNode;
      const parentElement = textNode.parentNode as HTMLElement;
      const style = parentElement.getAttribute('style');
      const inlineStyle: InlineStyle = {};
      
      if (style) {
        const bgColorMatch = style.match(/background-color:\s*([^;]+)/);
        if (bgColorMatch) {
          inlineStyle.backgroundColor = bgColorMatch[1];
        }
      }
      
      return new TextRun({
        text: textNode.text,
        bold: parentElement.tagName === 'STRONG' || parentElement.tagName === 'B',
        italics: parentElement.tagName === 'I' || parentElement.tagName === 'EM',
        underline: parentElement.tagName === 'U' ? { type: UnderlineType.SINGLE } : undefined,
        highlight: inlineStyle.backgroundColor ? 'yellow' : undefined,
        color: '000000',
        size: 22 // 11pt
      });
    }
    
    if (node.nodeType === 1) { // Element node
      const element = node as HTMLElement;
      if (element.tagName === 'P' || element.tagName === 'DIV') {
        const children = element.childNodes
          .map(child => processNode(child as HTMLElement | TextNode))
          .filter((child): child is TextRun | TextRun[] => child !== null)
          .flat();
          
        if (children.length > 0) {
          return children;
        }
      }
      
      return element.childNodes
        .map(child => processNode(child as HTMLElement | TextNode))
        .filter((child): child is TextRun | TextRun[] => child !== null)
        .flat();
    }
    
    return null;
  };
  
  root.childNodes.forEach(node => {
    const processed = processNode(node as HTMLElement | TextNode);
    if (Array.isArray(processed)) {
      elements.push(new Paragraph({ 
        children: processed, 
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 240 }
      }));
    } else if (processed instanceof TextRun) {
      elements.push(new Paragraph({ 
        children: [processed], 
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 240 }
      }));
    }
  });
  
  return elements.length > 0 ? elements : [new Paragraph({ 
    text: 'Não informado', 
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 240 }
  })];
};

// Função auxiliar para gerar o sumário agrupado por conselheiro
const gerarSumarioProcessos = (processes: Process[]): Paragraph[] => {
  // Agrupar processos por conselheiro
  const processosPorConselheiro: { [key: string]: Process[] } = {};
  
  processes.forEach(process => {
    const conselheiro = process.counselorName || 'Sem Conselheiro';
    if (!processosPorConselheiro[conselheiro]) {
      processosPorConselheiro[conselheiro] = [];
    }
    processosPorConselheiro[conselheiro].push(process);
  });
  
  const paragrafos: Paragraph[] = [];
  let paginaAtual = 4; // Começar na página 4 (assumindo que o sumário ocupe 3 páginas)
  
  // Para cada conselheiro, criar um item de sumário
  Object.keys(processosPorConselheiro).forEach(conselheiro => {
    // Adicionar nome do conselheiro
    paragrafos.push(
      new Paragraph({
        children: [
          new TextRun({
            text: conselheiro.toUpperCase(),
            bold: true,
            size: 24, // 12pt = 24 half-points
            font: 'Arial'
          }),
          new TextRun({
            text: `\t${paginaAtual}`,
            size: 24,
            font: 'Arial'
          })
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: 9000, // Posição à direita para o número da página
          }
        ]
      })
    );
    
    // Adicionar cada processo deste conselheiro
    processosPorConselheiro[conselheiro].forEach(process => {
      // Incrementar página para cada processo (estimativa)
      paragrafos.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${process.position} - `,
              size: 22, // 11pt = 22 half-points
              font: 'Arial'
            }),
            new TextRun({
              text: process.processNumber,
              size: 22,
              font: 'Arial'
            }),
            new TextRun({
              text: `\t${paginaAtual}`,
              size: 22,
              font: 'Arial'
            })
          ],
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: 9000,
            }
          ],
          spacing: {
            after: 120
          }
        })
      );
      
      // Incrementar a página para o próximo processo
      paginaAtual++;
    });
    
    // Adicionar uma linha em branco após cada grupo de conselheiro
    paragrafos.push(new Paragraph({ spacing: { after: 240 } }));
  });
  
  return paragrafos;
};

export const exportToWord = async (agenda: Agenda, processes: Process[]) => {
  try {
    // Validar dados obrigatórios
    if (!agenda.number || !agenda.type || !agenda.date) {
      throw new Error('Dados básicos da pauta incompletos. Verifique o número, tipo e data.');
    }

    if (processes.length === 0) {
      throw new Error('Não há processos cadastrados nesta pauta.');
    }

    // Criar documento com seções
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Arial'
            },
            paragraph: {
              alignment: AlignmentType.JUSTIFIED
            }
          }
        }
      },
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'MINISTÉRIO PÚBLICO DE CONTAS DO ESTADO DE GOIÁS',
                  bold: true,
                  size: 28, // 14pt = 28 half-points
                  font: 'Arial',
                  color: '000000'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 200
              }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Controle Externo da Administração Pública Estadual',
                  bold: true,
                  size: 28, // 14pt = 28 half-points
                  font: 'Arial',
                  color: '000000'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400
              }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Pauta da Sessão ${agenda.type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')} nº ${agenda.number}`,
                  bold: true,
                  size: 32, // 16pt = 32 half-points
                  font: 'Arial',
                  color: '000000'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 200
              }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: new Date(agenda.date + 'T00:00:00').toLocaleDateString('pt-BR'),
                  bold: true,
                  size: 24, // 12pt = 24 half-points
                  font: 'Arial',
                  color: '000000'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400
              }
            }),
            
            // Sumário - título
            new Paragraph({
              children: [
                new TextRun({
                  text: 'SUMÁRIO',
                  bold: true,
                  size: 28, // 14pt = 28 half-points
                  font: 'Arial',
                  color: '000000'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 240
              }
            }),
            
            // Gerar sumário agrupando por conselheiro
            ...gerarSumarioProcessos(processes),
            
            // Página em branco após o sumário
            new Paragraph({
              children: [new TextRun({ text: '', break: 1 })]
            })
          ]
        },
        // Seções para cada processo
        ...processes.map((process) => {
          const processChildren = [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${process.position} - Processo: ${process.processNumber}`,
                  bold: true,
                  font: 'Arial',
                  size: 28, // 14pt = 28 half-points
                  color: 'FFFFFF' // Texto branco
                })
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: {
                before: 400,
                after: 200
              },
              shading: {
                type: 'clear',
                fill: '4169E1', // Azul Royal
                color: 'auto'
              },
              alignment: AlignmentType.JUSTIFIED
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Conselheiro: `,
                  bold: true,
                  font: 'Arial',
                  size: 24, // 12pt
                  color: '000000'
                }),
                new TextRun({
                  text: process.counselorName || 'Não informado',
                  font: 'Arial',
                  size: 22, // 11pt
                  color: '000000'
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 240 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Tipo de Processo: `,
                  bold: true,
                  font: 'Arial',
                  size: 24, // 12pt
                  color: '000000'
                }),
                new TextRun({
                  text: process.processType || 'Não informado',
                  font: 'Arial',
                  size: 22, // 11pt
                  color: '000000'
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 240 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Interessados: `,
                  bold: true,
                  font: 'Arial',
                  size: 24, // 12pt
                  color: '000000'
                }),
                new TextRun({
                  text: process.stakeholders || 'Não informado',
                  font: 'Arial',
                  size: 22, // 11pt
                  color: '000000'
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 240 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Ementa:',
                  bold: true,
                  font: 'Arial',
                  size: 24, // 12pt
                  color: '000000'
                })
              ],
              heading: HeadingLevel.HEADING_3,
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 0 }
            })
          ];
          
          // Adicionar conteúdo da Ementa
          processChildren.push(...htmlToDocxElements(process.summary));

          // Adicionar Tipo de Voto
          if (process.voteType) {
            processChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Tipo de Voto:',
                    bold: true,
                    font: 'Arial',
                    size: 24, // 12pt
                    color: '000000'
                  })
                ],
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0 }
              })
            );
            processChildren.push(...htmlToDocxElements(process.voteType));
          }

          // Adicionar Observações se existir
          if (process.observations) {
            processChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Observações:',
                    bold: true,
                    font: 'Arial',
                    size: 24, // 12pt
                    color: '000000'
                  })
                ],
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0 }
              })
            );
            processChildren.push(...htmlToDocxElements(process.observations));
          }

          // Adicionar Procurador de Contas
          if (process.procuradorContas) {
            processChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Procurador de Contas:',
                    bold: true,
                    font: 'Arial',
                    size: 24, // 12pt
                    color: '000000'
                  })
                ],
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0 }
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: process.procuradorContas || 'Não informado',
                    font: 'Arial',
                    size: 22, // 11pt
                    color: '000000'
                  })
                ],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 240 }
              })
            );
          }

          // Adicionar Parecer do MPC
          if (process.mpcOpinionSummary) {
            processChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Parecer do MPC:',
                    bold: true,
                    font: 'Arial',
                    size: 24, // 12pt
                    color: '000000'
                  })
                ],
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0 }
              })
            );
            processChildren.push(...htmlToDocxElements(process.mpcOpinionSummary));
          }

          // Adicionar Relatório/Voto TCE
          processChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Relatório/Voto TCE:',
                  bold: true,
                  font: 'Arial',
                  size: 24, // 12pt
                  color: '000000'
                })
              ],
              heading: HeadingLevel.HEADING_3,
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 0 }
            })
          );
          processChildren.push(...htmlToDocxElements(process.tceReportSummary));

          // Adicionar Voto Vista se necessário
          if (process.hasViewVote && process.viewVoteSummary) {
            processChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Voto Vista:',
                    bold: true,
                    font: 'Arial',
                    size: 24, // 12pt
                    color: '000000'
                  })
                ],
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0 }
              })
            );
            processChildren.push(...htmlToDocxElements(process.viewVoteSummary));
          }

          // Adicionar Manifestação do Sistema do MPC se existir
          if (process.mpcSystemManifest) {
            processChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Proposta de manifestação do MPC:',
                    bold: true,
                    font: 'Arial',
                    size: 24, // 12pt
                    color: '000000'
                  })
                ],
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0 }
              })
            );
            processChildren.push(...htmlToDocxElements(process.mpcSystemManifest));
          }

          // Adicionar Manifestação Modificada pelo PGC se existir
          if (process.isPgcModified && process.pgcModifiedManifest) {
            processChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Manifestação Modificada pelo PGC:',
                    bold: true,
                    font: 'Arial',
                    size: 24, // 12pt
                    color: '000000'
                  })
                ],
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0 }
              })
            );
            processChildren.push(...htmlToDocxElements(process.pgcModifiedManifest));
          }

          // Adicionar Anotações Adicionais se existir
          if (process.additionalNotes) {
            processChildren.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Anotações Adicionais:',
                    bold: true,
                    font: 'Arial',
                    size: 24, // 12pt
                    color: '000000'
                  })
                ],
                heading: HeadingLevel.HEADING_3,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 0 }
              })
            );
            processChildren.push(...htmlToDocxElements(process.additionalNotes));
          }

          return {
            children: processChildren
          };
        })
      ]
    });

    // Gerar o documento usando o método apropriado para o navegador
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Pauta_${agenda.number}_${new Date(agenda.date + 'T00:00:00').toLocaleDateString('pt-BR')}.docx`);
  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    throw new Error('Não foi possível gerar o documento. Verifique se todos os dados estão preenchidos corretamente: ' + (error instanceof Error ? error.message : ''));
  }
};

export const exportToExcel = (agenda: Agenda, processes: Process[]) => {
  const ws = XLSX.utils.json_to_sheet(processes.map(process => ({
    'Número do Processo': process.processNumber,
    'Relator': process.counselorName,
    'Tipo': process.processType,
    'Interessados': process.stakeholders,
    'Ementa': process.summary,
    'Parecer do MPC': process.mpcOpinionSummary || '',
    'Relatório/Voto TCE': process.tceReportSummary,
    'Voto Vista': process.hasViewVote ? process.viewVoteSummary : '',
    'Proposta de manifestação do MPC': process.mpcSystemManifest || '',
    'Manifestação registrada pelo PGC': process.pgcModifiedManifest || ''
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Processos');
  
  XLSX.writeFile(wb, `pauta_${agenda.number}_${new Date(agenda.date + 'T00:00:00').toLocaleDateString('pt-BR')}.xlsx`);
};