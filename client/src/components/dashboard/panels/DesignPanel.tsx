import { useCvContext } from '../../../context/CvContext';
import { FiPlus, FiMinus, FiType, FiSliders, FiGrid } from 'react-icons/fi';
import { MdFormatColorFill, MdTextFormat, MdColorLens } from 'react-icons/md';
import { patterns } from '@/lib/patterns';

const DesignPanel = () => {
  const { cvData, setTheme } = useCvContext();
  // Create a safe theme object with defaults if theme is not available
  const theme = cvData?.data?.theme || {
    fontFamily: 'Arial',
    fontSize: '12px',
    bgColor: '#FFFFFF',
    textColor: '#000000',
    pageMargin: '0.5in',
    sectionSpacing: '14pt',
    lineSpacing: '1.5',
    pattern: 'none',
    templateName: 'classic',
  };

  const colorPalettes = {
    primary: [
      '#2563eb',
      '#0891b2',
      '#059669',
      '#4f46e5',
      '#7c3aed',
      '#db2777',
      '#dc2626',
      '#ea580c',
      '#65a30d',
      '#000000',
    ],
    text: [
      '#000000',
      '#1f2937',
      '#374151',
      '#4b5563',
      '#6b7280',
      '#111827',
      '#18181b',
      '#27272a',
      '#3f3f46',
      '#52525b',
    ],
  };

  const availableFonts = [
    'Arial',
    'Times New Roman',
    'Roboto',
    'Open Sans',
    'Lato',
    'Inter',
    'Poppins',
    'Montserrat',
    'Rubik',
  ];

  const changeFontFamily = (fontFamily: string) =>
    setTheme({ ...theme, fontFamily });

  const changeFontSize = (fontSize: string) => setTheme({ ...theme, fontSize });

  const changeBgColor = (bgColor: string) => setTheme({ ...theme, bgColor });

  const changeTextColor = (textColor: string) =>
    setTheme({ ...theme, textColor });

  const changePageMargin = (pageMargin: string) =>
    setTheme({ ...theme, pageMargin });

  const changeSectionSpacing = (sectionSpacing: string) =>
    setTheme({ ...theme, sectionSpacing });

  const changeLineSpacing = (lineSpacing: string) =>
    setTheme({ ...theme, lineSpacing });

  const changePattern = (pattern: string) => setTheme({ ...theme, pattern });

  // Handlers for increment/decrement buttons
  const handleFontSizeIncrement = () => {
    const current = parseInt(theme.fontSize);
    if (current < 14) {
      changeFontSize(`${current + 1}pt`);
    }
  };

  const handleFontSizeDecrement = () => {
    const current = parseInt(theme.fontSize);
    if (current > 10) {
      changeFontSize(`${current - 1}pt`);
    }
  };

  const handlePageMarginIncrement = () => {
    const current = parseFloat(theme.pageMargin);
    if (current < 1.5) {
      changePageMargin(`${(current + 0.25).toFixed(2)}in`);
    }
  };

  const handlePageMarginDecrement = () => {
    const current = parseFloat(theme.pageMargin);
    if (current > 0.5) {
      changePageMargin(`${(current - 0.25).toFixed(2)}in`);
    }
  };

  const handleSectionSpacingIncrement = () => {
    const current = parseInt(theme.sectionSpacing);
    if (current < 24) {
      changeSectionSpacing(`${current + 3}pt`);
    }
  };

  const handleSectionSpacingDecrement = () => {
    const current = parseInt(theme.sectionSpacing);
    if (current > 12) {
      changeSectionSpacing(`${current - 3}pt`);
    }
  };

  const handleLineSpacingIncrement = () => {
    const current = parseFloat(theme.lineSpacing);
    if (current < 1.5) {
      changeLineSpacing(`${(current + 0.25).toFixed(2)}`);
    }
  };

  const handleLineSpacingDecrement = () => {
    const current = parseFloat(theme.lineSpacing);
    if (current > 1.0) {
      changeLineSpacing(`${(current - 0.25).toFixed(2)}`);
    }
  };

  // Generate tick marks for range sliders
  const generateTickMarks = (min: number, max: number, step: number) => {
    const marks = [];
    for (let i = min; i <= max; i += step) {
      marks.push(i);
    }
    return marks;
  };

  const fontSizeMarks = generateTickMarks(10, 14, 1);
  const pageMarginMarks = generateTickMarks(0.5, 1.5, 0.25);
  const sectionSpacingMarks = generateTickMarks(12, 24, 3);
  const lineSpacingMarks = generateTickMarks(1.0, 1.5, 0.25);

  return (
    <div className="space-y-4 w-full bg-white p-4">
      <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
        <MdColorLens className="text-primary" /> Design Panel
      </h2>

      <div className="space-y-4">
        <div className="p-3 border border-gray-200 rounded-md hover:border-primary transition-colors">
          <label className="mb-2 font-medium flex items-center gap-1">
            <FiType className="text-primary" /> Font Family
          </label>
          <select
            value={theme.fontFamily}
            onChange={(e) => changeFontFamily(e.target.value)}
            className="w-full p-2 border rounded border-primary focus:ring-primary focus:border-primary cursor-pointer"
          >
            {availableFonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 border border-gray-200 rounded-md hover:border-primary transition-colors">
          <label className="mb-2 font-medium flex items-center gap-1">
            <FiType className="text-primary" /> Font Size: {theme.fontSize}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFontSizeDecrement}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              aria-label="Decrease font size"
            >
              <FiMinus />
            </button>
            <div className="w-full">
              <input
                type="range"
                min="10"
                max="14"
                step="1"
                value={parseInt(theme.fontSize)}
                onChange={(e) => changeFontSize(`${e.target.value}pt`)}
                className="w-full accent-primary cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between mt-1 px-1">
                {fontSizeMarks.map((mark) => (
                  <span key={mark} className="text-xs text-gray-500">
                    {mark}pt
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleFontSizeIncrement}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              aria-label="Increase font size"
            >
              <FiPlus />
            </button>
            <span className="text-sm w-12 font-medium">{theme.fontSize}</span>
          </div>
        </div>

        <div className="p-3 border border-gray-200 rounded-md hover:border-primary transition-colors">
          <label className="mb-2 font-medium flex items-center gap-1">
            <MdFormatColorFill className="text-primary" /> Primary Color
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {colorPalettes.primary.map((color) => (
              <button
                key={color}
                onClick={() => changeBgColor(color)}
                className={`w-8 h-8 rounded-full border cursor-pointer hover:scale-110 transition-transform ${
                  theme.bgColor === color
                    ? 'border-2 border-black shadow-md'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Set primary color to ${color}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Custom:</span>
            <input
              type="color"
              value={theme.bgColor}
              onChange={(e) => changeBgColor(e.target.value)}
              className="w-16 h-10 p-0 border rounded border-primary cursor-pointer"
            />
            <span className="text-sm font-mono">{theme.bgColor}</span>
          </div>
        </div>

        <div className="p-3 border border-gray-200 rounded-md hover:border-primary transition-colors">
          <label className="mb-2 font-medium flex items-center gap-1">
            <MdTextFormat className="text-primary" /> Text Color
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {colorPalettes.text.map((color) => (
              <button
                key={color}
                onClick={() => changeTextColor(color)}
                className={`w-8 h-8 rounded-full border cursor-pointer hover:scale-110 transition-transform ${
                  theme.textColor === color
                    ? 'border-2 border-black shadow-md'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Set text color to ${color}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Custom:</span>
            <input
              type="color"
              value={theme.textColor}
              onChange={(e) => changeTextColor(e.target.value)}
              className="w-16 h-10 p-0 border rounded border-primary cursor-pointer"
            />
            <span className="text-sm font-mono">{theme.textColor}</span>
          </div>
        </div>

        <div className="p-3 border border-gray-200 rounded-md hover:border-primary transition-colors">
          <label className="mb-2 font-medium flex items-center gap-1">
            <FiSliders className="text-primary" /> Page Margin:{' '}
            {theme.pageMargin}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePageMarginDecrement}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              aria-label="Decrease page margin"
            >
              <FiMinus />
            </button>
            <div className="w-full">
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.25"
                value={parseFloat(theme.pageMargin)}
                onChange={(e) => changePageMargin(`${e.target.value}in`)}
                className="w-full accent-primary cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between mt-1 px-1">
                {pageMarginMarks.map((mark) => (
                  <span key={mark} className="text-xs text-gray-500">
                    {mark}in
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handlePageMarginIncrement}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              aria-label="Increase page margin"
            >
              <FiPlus />
            </button>
            <span className="text-sm w-12 font-medium">{theme.pageMargin}</span>
          </div>
        </div>

        <div className="p-3 border border-gray-200 rounded-md hover:border-primary transition-colors">
          <label className="mb-2 font-medium flex items-center gap-1">
            <FiSliders className="text-primary" /> Section Spacing:{' '}
            {theme.sectionSpacing}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSectionSpacingDecrement}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              aria-label="Decrease section spacing"
            >
              <FiMinus />
            </button>
            <div className="w-full">
              <input
                type="range"
                min="12"
                max="24"
                step="3"
                value={parseInt(theme.sectionSpacing)}
                onChange={(e) => changeSectionSpacing(`${e.target.value}pt`)}
                className="w-full accent-primary cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between mt-1 px-1">
                {sectionSpacingMarks.map((mark) => (
                  <span key={mark} className="text-xs text-gray-500">
                    {mark}pt
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleSectionSpacingIncrement}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              aria-label="Increase section spacing"
            >
              <FiPlus />
            </button>
            <span className="text-sm w-12 font-medium">
              {theme.sectionSpacing}
            </span>
          </div>
        </div>

        <div className="p-3 border border-gray-200 rounded-md hover:border-primary transition-colors">
          <label className="mb-2 font-medium flex items-center gap-1">
            <FiSliders className="text-primary" /> Line Spacing:{' '}
            {theme.lineSpacing}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLineSpacingDecrement}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              aria-label="Decrease line spacing"
            >
              <FiMinus />
            </button>
            <div className="w-full">
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.25"
                value={parseFloat(theme.lineSpacing)}
                onChange={(e) => changeLineSpacing(`${e.target.value}`)}
                className="w-full accent-primary cursor-pointer h-2 bg-gray-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between mt-1 px-1">
                {lineSpacingMarks.map((mark) => (
                  <span key={mark} className="text-xs text-gray-500">
                    {mark}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={handleLineSpacingIncrement}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              aria-label="Increase line spacing"
            >
              <FiPlus />
            </button>
            <span className="text-sm w-12 font-medium">
              {theme.lineSpacing}
            </span>
          </div>
        </div>

        <div className="p-3 border border-gray-200 rounded-md hover:border-primary transition-colors">
          <label className="mb-2 font-medium flex items-center gap-1">
            <FiGrid className="text-primary" /> Pattern
          </label>
          <div className="grid grid-cols-4 gap-3">
            {patterns.map((pattern) => (
              <button
                key={pattern.id}
                type="button"
                onClick={() => changePattern(pattern.id)}
                className={`relative w-14 h-14 rounded-lg border flex items-center justify-center bg-white transition-all
                  ${
                    theme.pattern === pattern.id
                      ? 'border-primary ring-2 ring-primary'
                      : 'border-gray-300 hover:border-primary/60'
                  }
                  shadow-sm focus:outline-none`}
                aria-label={`Set pattern to ${pattern.id}`}
              >
                <span className="w-10 h-10 flex items-center justify-center">
                  {pattern.svg}
                </span>
                {theme.pattern === pattern.id && (
                  <span className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full border-2 border-white"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignPanel;
