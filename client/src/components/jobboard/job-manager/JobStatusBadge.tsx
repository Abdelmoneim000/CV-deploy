import React from 'react';
import {
  AiOutlineFileText,
  AiOutlineAlipay,
  AiOutlinePause,
  AiOutlineClose,
  AiOutlineCalendar,
} from 'react-icons/ai';

interface JobStatusBadgeProps {
  status: 'draft' | 'published' | 'paused' | 'closed' | 'expired';
}

const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    draft: {
      color: 'text-gray-600 bg-gray-100',
      label: 'Draft',
      icon: AiOutlineFileText,
    },
    published: {
      color: 'text-green-600 bg-green-100',
      label: 'Published',
      icon: AiOutlineAlipay,
    },
    paused: {
      color: 'text-yellow-600 bg-yellow-100',
      label: 'Paused',
      icon: AiOutlinePause,
    },
    closed: {
      color: 'text-red-600 bg-red-100',
      label: 'Closed',
      icon: AiOutlineClose,
    },
    expired: {
      color: 'text-gray-600 bg-gray-100',
      label: 'Expired',
      icon: AiOutlineCalendar,
    },
  };

  const config = statusConfig[status] || statusConfig.draft;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <IconComponent size={12} />
      {config.label}
    </span>
  );
};

export default JobStatusBadge;
