import { useEffect } from 'react';

const fontMap: Record<string, string> = {
  Roboto: 'Roboto:wght@400;700',
  'Open Sans': 'Open+Sans:wght@400;700',
  Lato: 'Lato:wght@400;700',
  Inter: 'Inter:wght@400;700',
  Poppins: 'Poppins:wght@400;700',
  Montserrat: 'Montserrat:wght@400;700',
  Rubik: 'Rubik:wght@400;700',
  // Add more as needed
};

interface FontLoaderProps {
  fontFamily: string;
}

const FontLoader: React.FC<FontLoaderProps> = ({ fontFamily }) => {
  useEffect(() => {
    if (!fontMap[fontFamily]) return;

    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontMap[fontFamily]}&display=swap`;
    let link = document.querySelector(
      `link[data-font="${fontFamily}"]`
    ) as HTMLLinkElement | null;

    // Remove any previous font links
    document.querySelectorAll('link[data-font]').forEach((el) => el.remove());

    // Add new font link
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.setAttribute('data-font', fontFamily);
    document.head.appendChild(link);

    return () => {
      link?.remove();
    };
  }, [fontFamily]);

  return null;
};

export default FontLoader;
