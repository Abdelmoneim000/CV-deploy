export const patterns = [
  {
    id: 'none',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" fill="#ffffff" />
      </svg>
    ),
  },
  {
    id: 'hexagones',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 5L15 13.5L10 22L0 22L-5 13.5L0 5L10 5Z"
          transform="translate(15, 9)"
          stroke="#CCCCCC"
          fill="none"
        />
        <path
          d="M10 5L15 13.5L10 22L0 22L-5 13.5L0 5L10 5Z"
          transform="translate(35, 9)"
          stroke="#CCCCCC"
          fill="none"
        />
        <path
          d="M10 5L15 13.5L10 22L0 22L-5 13.5L0 5L10 5Z"
          transform="translate(25, -4)"
          stroke="#CCCCCC"
          fill="none"
        />
        <path
          d="M10 5L15 13.5L10 22L0 22L-5 13.5L0 5L10 5Z"
          transform="translate(25, 22)"
          stroke="#CCCCCC"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: 'waves',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 10C5 5 10 15 15 10C20 5 25 15 30 10C35 5 40 15 45 10"
          stroke="#CCCCCC"
          fill="none"
        />
        <path
          d="M0 20C5 15 10 25 15 20C20 15 25 25 30 20C35 15 40 25 45 20"
          stroke="#CCCCCC"
          fill="none"
        />
        <path
          d="M0 30C5 25 10 35 15 30C20 25 25 35 30 30C35 25 40 35 45 30"
          stroke="#CCCCCC"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: 'triangles',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 0L10 17.3L20 0"
          transform="translate(0, 5)"
          stroke="#CCCCCC"
          fill="none"
        />
        <path
          d="M0 0L10 17.3L20 0"
          transform="translate(20, 5)"
          stroke="#CCCCCC"
          fill="none"
        />
        <path
          d="M0 0L10 17.3L20 0"
          transform="translate(10, 22)"
          stroke="#CCCCCC"
          fill="none"
        />
        <path
          d="M0 0L10 17.3L20 0"
          transform="translate(30, 22)"
          stroke="#CCCCCC"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: 'lines',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="0" y1="5" x2="40" y2="35" stroke="#CCCCCC" />
        <line x1="10" y1="0" x2="40" y2="25" stroke="#CCCCCC" />
        <line x1="0" y1="15" x2="25" y2="40" stroke="#CCCCCC" />
      </svg>
    ),
  },
  {
    id: 'squares',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="5" y="5" width="10" height="10" stroke="#CCCCCC" fill="none" />
        <rect
          x="25"
          y="5"
          width="10"
          height="10"
          stroke="#CCCCCC"
          fill="none"
        />
        <rect
          x="5"
          y="25"
          width="10"
          height="10"
          stroke="#CCCCCC"
          fill="none"
        />
        <rect
          x="25"
          y="25"
          width="10"
          height="10"
          stroke="#CCCCCC"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: 'dots',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="2" fill="#CCCCCC" />
        <circle cx="20" cy="8" r="2" fill="#CCCCCC" />
        <circle cx="32" cy="8" r="2" fill="#CCCCCC" />
        <circle cx="8" cy="20" r="2" fill="#CCCCCC" />
        <circle cx="20" cy="20" r="2" fill="#CCCCCC" />
        <circle cx="32" cy="20" r="2" fill="#CCCCCC" />
        <circle cx="8" cy="32" r="2" fill="#CCCCCC" />
        <circle cx="20" cy="32" r="2" fill="#CCCCCC" />
        <circle cx="32" cy="32" r="2" fill="#CCCCCC" />
      </svg>
    ),
  },
  {
    id: 'chevrons',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 10L10 0L20 10" stroke="#CCCCCC" fill="none" />
        <path d="M20 10L30 0L40 10" stroke="#CCCCCC" fill="none" />
        <path d="M0 25L10 15L20 25" stroke="#CCCCCC" fill="none" />
        <path d="M20 25L30 15L40 25" stroke="#CCCCCC" fill="none" />
      </svg>
    ),
  },
  {
    id: 'circles',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="10" r="8" stroke="#CCCCCC" fill="none" />
        <circle cx="30" cy="10" r="8" stroke="#CCCCCC" fill="none" />
        <circle cx="10" cy="30" r="8" stroke="#CCCCCC" fill="none" />
        <circle cx="30" cy="30" r="8" stroke="#CCCCCC" fill="none" />
      </svg>
    ),
  },
  {
    id: 'geometric',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 0L20 20L40 0" stroke="#CCCCCC" fill="none" />
        <path d="M0 20L20 40L40 20" stroke="#CCCCCC" fill="none" />
      </svg>
    ),
  },
  {
    id: 'geo-minimal',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="5" y="5" width="30" height="30" stroke="#CCCCCC" fill="none" />
        <line x1="5" y1="20" x2="35" y2="20" stroke="#CCCCCC" />
        <line x1="20" y1="5" x2="20" y2="35" stroke="#CCCCCC" />
      </svg>
    ),
  },
  {
    id: 'geo-dots',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8" cy="8" r="3" fill="#E2F2FF" />
        <circle cx="22" cy="15" r="5" fill="#C2E2FF" />
        <circle cx="32" cy="28" r="4" fill="#D2EAFF" />
        <circle cx="12" cy="32" r="3" fill="#E2F2FF" />
      </svg>
    ),
  },
  {
    id: 'colorful',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="40" height="40" fill="#F9FBFF" />
        <path d="M0 40L40 0" stroke="#FF5555" strokeWidth="0.5" />
        <path d="M0 35L35 0" stroke="#55FF55" strokeWidth="0.5" />
        <path d="M0 30L30 0" stroke="#5555FF" strokeWidth="0.5" />
      </svg>
    ),
  },
  // Gradients
  {
    id: 'gradient1',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" fill="url(#gradient1)" />
        <defs>
          <linearGradient
            id="gradient1"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F5F7FA" />
            <stop offset="1" stopColor="#E4EDF5" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'gradient2',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" fill="url(#gradient2)" />
        <defs>
          <linearGradient
            id="gradient2"
            x1="0"
            y1="0"
            x2="40"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F0F4F8" />
            <stop offset="1" stopColor="#D9E6F2" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'gradient3',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" fill="url(#gradient3)" />
        <defs>
          <linearGradient
            id="gradient3"
            x1="0"
            y1="0"
            x2="0"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F0F0F0" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'gradient4',
    svg: (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" fill="url(#gradient4)" />
        <defs>
          <linearGradient
            id="gradient4"
            x1="20"
            y1="0"
            x2="20"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FAFBFC" />
            <stop offset="1" stopColor="#E6EBF0" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
];
