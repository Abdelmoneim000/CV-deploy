import Button from '../../ui/button';
import { useState } from 'react';
import { useCvContext } from '../../../context/CvContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FiDownload, FiFileText, FiUpload } from 'react-icons/fi';

// Update the generatePDF function with correct data structure
const generatePDF = async (cvData) => {
  // Make sure cvData and all required properties exist
  if (!cvData || !cvData.data) {
    throw new Error('CV data is missing');
  }

  // ✅ Use correct data structure
  const theme = cvData.data?.theme || {};
  const personalInfo = cvData.data?.personalInfo || {};
  const sections = cvData.data?.sections || [];

  // Create a temporary div to render the CV content
  const tempDiv = document.createElement('div');
  tempDiv.id = 'temp-cv-for-pdf';
  tempDiv.style.width = '8.5in'; // Letter width
  tempDiv.style.position = 'absolute';
  tempDiv.style.top = '-9999px';
  tempDiv.style.left = '-9999px';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.padding = '20px';
  document.body.appendChild(tempDiv);
  
  // Add your CV template to the div with defensive coding for all properties
  tempDiv.innerHTML = `
    <div style="padding: 20px; font-family: ${theme.fontFamily || 'Arial'}; background: white; color: black;">
      <h1 style="font-size: 24px; margin-bottom: 5px; margin-top: 0;">${personalInfo.fullName || 'Full Name'}</h1>
      <h2 style="font-size: 18px; color: #666; margin-top: 0; margin-bottom: 10px;">${personalInfo.jobTitle || ''}</h2>
      <div style="margin-bottom: 10px; font-size: 14px;">
        ${personalInfo.email || ''} ${personalInfo.email && personalInfo.phone ? ' | ' : ''} ${personalInfo.phone || ''} ${(personalInfo.email || personalInfo.phone) && personalInfo.address ? ' | ' : ''} ${personalInfo.address || ''}
      </div>
      ${personalInfo.summary ? `<div style="margin-bottom: 15px;"><p>${personalInfo.summary}</p></div>` : ''}
      
      <div style="margin-top: 20px;">
        ${sections.filter(section => section.visibility?.section !== false).map(section => `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <h3 style="border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 16px;">${section.name || 'Section'}</h3>
            <div>${renderSectionContent(section)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  try {
    // Use html2canvas to capture the rendered CV
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight
    });
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    const imgWidth = pdfWidth;
    const imgHeight = imgWidth / ratio;
    
    // If content is longer than one page, handle multiple pages
    if (imgHeight > pdfHeight) {
      let position = 0;
      const pageHeight = (canvas.width * pdfHeight) / pdfWidth;
      
      while (position < canvas.height) {
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageHeight, canvas.height - position);
        
        pageCtx.drawImage(canvas, 0, position, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
        
        if (position > 0) {
          pdf.addPage();
        }
        
        const pageImgData = pageCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, (pageCanvas.height * pdfWidth) / pageCanvas.width);
        
        position += pageHeight;
      }
    } else {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }
    
    // Clean up
    document.body.removeChild(tempDiv);
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Clean up on error
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }
    throw error;
  }
};

// ✅ Updated helper function to render section content with correct logic
const renderSectionContent = (section) => {
  if (!section || !section.entries || !Array.isArray(section.entries)) {
    return '';
  }
  
  // ✅ Use section.id instead of section.type for identification
  switch (section.id) {
    case 'experience':
      return section.entries.map(entry => `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <strong style="font-size: 14px;">${entry?.title || ''}</strong>
            <span style="font-size: 12px; color: #666;">${entry?.startDate || ''} - ${entry?.endDate || 'Present'}</span>
          </div>
          <div style="font-style: italic; margin-bottom: 5px; color: #555;">${entry?.organization || ''}</div>
          <div style="font-size: 13px; line-height: 1.4;">${entry?.description || ''}</div>
        </div>
      `).join('');
    
    case 'education':
      return section.entries.map(entry => `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <strong style="font-size: 14px;">${entry?.degree || entry?.title || ''}</strong>
            <span style="font-size: 12px; color: #666;">${entry?.startDate || ''} - ${entry?.endDate || 'Present'}</span>
          </div>
          <div style="font-style: italic; margin-bottom: 5px; color: #555;">${entry?.institution || entry?.organization || ''}</div>
          <div style="font-size: 13px; line-height: 1.4;">${entry?.description || ''}</div>
        </div>
      `).join('');
    
    case 'skills':
      return `<div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${section.entries.map(skill => `
          <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; border: 1px solid #ddd;">${skill?.name || skill}</span>
        `).join('')}
      </div>`;
      
    case 'summary':
      return `<div style="font-size: 13px; line-height: 1.5;">${section.entries[0]?.content || section.entries[0] || ''}</div>`;
      
    default:
      // For any other section type, attempt to intelligently display the content
      return section.entries.map(entry => {
        if (!entry) return '';
        
        // If the entry has common fields, display them in a structured way
        if (typeof entry === 'object') {
          const title = entry.title || entry.name || entry.degree || '';
          const subtitle = entry.subtitle || entry.organization || entry.institution || '';
          const dates = entry.startDate || entry.endDate ? 
            `${entry.startDate || ''} - ${entry.endDate || 'Present'}` : '';
          const content = entry.description || entry.content || '';
          
          return `
            <div style="margin-bottom: 15px; page-break-inside: avoid;">
              ${title ? `<div style="font-weight: bold; font-size: 14px; margin-bottom: 3px;">${title}</div>` : ''}
              ${subtitle ? `<div style="font-style: italic; color: #555; margin-bottom: 3px;">${subtitle}</div>` : ''}
              ${dates ? `<div style="font-size: 12px; color: #666; margin-bottom: 5px;">${dates}</div>` : ''}
              ${content ? `<div style="font-size: 13px; line-height: 1.4;">${content}</div>` : ''}
            </div>
          `;
        }
        
        // Fallback to string representation as a last resort
        return `<div style="margin-bottom: 10px; font-size: 13px;">${String(entry)}</div>`;
      }).join('');
  }
};

// ✅ Updated generateCSV with correct data structure
const generateCSV = (cvData) => {
  if (!cvData || !cvData.data) {
    throw new Error('Invalid CV data structure');
  }

  const lines = [];
  const personalInfo = cvData.data.personalInfo || {};
  const sections = cvData.data.sections || [];
  
  // Personal info
  lines.push(['Personal Information']);
  lines.push(['Full Name', personalInfo.fullName || '']);
  lines.push(['Job Title', personalInfo.jobTitle || '']);
  lines.push(['Email', personalInfo.email || '']);
  lines.push(['Phone', personalInfo.phone || '']);
  lines.push(['Address', personalInfo.address || '']);
  lines.push(['Website', personalInfo.website || '']);
  lines.push(['Summary', personalInfo.summary || '']);
  lines.push([]);
  
  // Sections
  sections.forEach(section => {
    // ✅ Check correct visibility property
    if (section.visibility?.section === false) return;
    
    lines.push([section.name || 'Unnamed Section']);
    
    if (section.entries && Array.isArray(section.entries)) {
      switch (section.id) {
        case 'experience':
        case 'education':
          lines.push(['Title', 'Organization', 'Start Date', 'End Date', 'Description']);
          section.entries.forEach(entry => {
            lines.push([
              entry?.title || entry?.degree || '',
              entry?.organization || entry?.institution || '',
              entry?.startDate || '',
              entry?.endDate || '',
              entry?.description || ''
            ]);
          });
          break;
          
        case 'skills':
          lines.push(['Skill', 'Level']);
          section.entries.forEach(skill => {
            if (typeof skill === 'string') {
              lines.push([skill, '']);
            } else {
              lines.push([skill?.name || '', skill?.level || '']);
            }
          });
          break;
          
        case 'summary':
          if (section.entries[0]) {
            const content = typeof section.entries[0] === 'string' 
              ? section.entries[0] 
              : section.entries[0]?.content || '';
            lines.push([content]);
          }
          break;
          
        default:
          section.entries.forEach(entry => {
            if (typeof entry === 'string') {
              lines.push([entry]);
            } else {
              lines.push([JSON.stringify(entry)]);
            }
          });
      }
    }
    
    lines.push([]);
  });
  
  // Convert to CSV string
  return lines.map(line => line.map(cell => {
    const cellStr = String(cell || '');
    return `"${cellStr.replace(/"/g, '""')}"`;
  }).join(',')).join('\n');
};

// ✅ Updated generateTextFile with correct data structure and complete syntax
const generateTextFile = (cvData) => {
  if (!cvData || !cvData.data) {
    throw new Error('Invalid CV data structure');
  }

  let text = '';
  const personalInfo = cvData.data.personalInfo || {};
  const sections = cvData.data.sections || [];
  
  // Personal info
  text += `${personalInfo.fullName || 'Name'}\n`;
  if (personalInfo.jobTitle) text += `${personalInfo.jobTitle}\n`;
  text += `${personalInfo.email || ''} | ${personalInfo.phone || ''}\n`;
  if (personalInfo.address) text += `${personalInfo.address}\n`;
  if (personalInfo.website) text += `${personalInfo.website}\n`;
  if (personalInfo.summary) text += `\n${personalInfo.summary}\n`;
  text += '\n';
  
  // Sections
  sections.forEach(section => {
    // ✅ Check correct visibility property
    if (section.visibility?.section === false) return;
    
    text += `=== ${(section.name || 'SECTION').toUpperCase()} ===\n\n`;
    
    if (section.entries && Array.isArray(section.entries)) {
      switch (section.id) {
        case 'experience':
        case 'education':
          section.entries.forEach(entry => {
            text += `${entry?.title || entry?.degree || 'Position'}\n`;
            text += `${entry?.organization || entry?.institution || 'Organization'} (${entry?.startDate || ''} - ${entry?.endDate || 'Present'})\n`;
            // ✅ Complete the if statement that was causing the error
            if (entry?.description) {
              text += `${entry.description}\n`;
            }
            text += '\n';
          });
          break;
          
        case 'skills':
          const skillGroups = [];
          for (let i = 0; i < section.entries.length; i += 5) {
            const skillGroup = section.entries.slice(i, i + 5).map(s => 
              typeof s === 'string' ? s : s?.name || 'Skill'
            );
            skillGroups.push(skillGroup.join(', '));
          }
          text += skillGroups.join('\n') + '\n\n';
          break;
          
        case 'summary':
          if (section.entries[0]) {
            const content = typeof section.entries[0] === 'string' 
              ? section.entries[0] 
              : section.entries[0]?.content || '';
            text += `${content}\n\n`;
          }
          break;
          
        default:
          section.entries.forEach(entry => {
            if (typeof entry === 'string') {
              text += `${entry}\n`;
            } else if (entry && typeof entry === 'object') {
              // Handle object entries gracefully
              const title = entry.title || entry.name || entry.degree || '';
              const organization = entry.organization || entry.institution || '';
              const description = entry.description || entry.content || '';
              
              if (title) text += `${title}\n`;
              if (organization) text += `${organization}\n`;
              if (description) text += `${description}\n`;
            }
          });
          text += '\n';
      }
    }
  });
  
  return text;
};

// Function to trigger file download
const downloadFile = (data, filename, type) => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

const DownloadPanel = () => {
  const { cvData } = useCvContext();
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [isDownloadingText, setIsDownloadingText] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<'pdf' | 'csv' | 'text' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (type: 'pdf' | 'csv' | 'text') => {
    // Reset states
    setError(null);
    setDownloadSuccess(null);
    
    // ✅ Check correct data structure
    if (!cvData || !cvData.data || !cvData.data.personalInfo) {
      setError('CV data is not fully loaded. Please try again.');
      return;
    }
    
    // Set loading state
    if (type === 'pdf') {
      setIsDownloadingPDF(true);
    } else if (type === 'csv') {
      setIsDownloadingCSV(true);
    } else {
      setIsDownloadingText(true);
    }

    try {
      // Get a safe name for the file, with fallback
      const fullName = cvData.data.personalInfo?.fullName || 'CV';
      const fileName = `${fullName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_CV`;
      
      if (type === 'pdf') {
        const pdf = await generatePDF(cvData);
        pdf.save(`${fileName}.pdf`);
      } 
      else if (type === 'csv') {
        const csvData = generateCSV(cvData);
        downloadFile(csvData, `${fileName}.csv`, 'text/csv');
      }
      else if (type === 'text') {
        const textData = generateTextFile(cvData);
        downloadFile(textData, `${fileName}.txt`, 'text/plain');
      }
      
      setDownloadSuccess(type);
      // Clear success message after 3 seconds
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (error) {
      console.error(`Download failed (${type}):`, error);
      setError(`Failed to generate ${type.toUpperCase()} file. Please try again.`);
    } finally {
      if (type === 'pdf') {
        setIsDownloadingPDF(false);
      } else if (type === 'csv') {
        setIsDownloadingCSV(false);
      } else {
        setIsDownloadingText(false);
      }
    }
  };

  return (
    <div className="w-full h-full p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <FiDownload className="text-gray-600" />
          Export Your CV
        </h2>
        <p className="mt-2 text-gray-600">
          Download your CV in various formats depending on where you need to submit it.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleDownload('pdf')}
          disabled={isDownloadingPDF}
        >
          <FiFileText />
          {isDownloadingPDF ? 'Generating PDF...' : 'Download as PDF'}
        </Button>

        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleDownload('csv')}
          disabled={isDownloadingCSV}
          variant="secondary"
        >
          <FiUpload />
          {isDownloadingCSV ? 'Generating CSV...' : 'Export as CSV'}
        </Button>

        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={() => handleDownload('text')}
          disabled={isDownloadingText}
          variant="outline"
        >
          <FiFileText />
          {isDownloadingText ? 'Generating Text File...' : 'Plain Text Format'}
        </Button>
      </div>

      {downloadSuccess && (
        <div className="mt-4 p-3 rounded-md bg-emerald-50 text-emerald-700 text-sm">
          Successfully generated {downloadSuccess.toUpperCase()} file! Your download should have started.
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100">
        <h3 className="font-medium text-gray-700 mb-2">When to use each format</h3>
        <ul className="text-sm text-gray-500 space-y-2">
          <li><strong>PDF:</strong> Best for submitting applications. Preserves formatting and layout.</li>
          <li><strong>CSV:</strong> Good for importing your CV data into other systems or databases.</li>
          <li><strong>Text:</strong> For plain text submissions or copying into online application forms.</li>
        </ul>
      </div>
    </div>
  );
};

export default DownloadPanel;
