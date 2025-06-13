import React from 'react';
import {
  AiOutlineFileText,
  AiOutlineAlipay,
  AiOutlineTeam,
  AiOutlineEye,
} from 'react-icons/ai';
import { JobStats } from '@/types/JobBoard';

interface JobStatsCardsProps {
  stats: JobStats;
}

const JobStatsCards: React.FC<JobStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <AiOutlineFileText className="text-primary" size={20} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Jobs</p>
            <p className="text-2xl font-bold">{stats.totalJobs}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <AiOutlineAlipay className="text-green-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold">{stats.publishedJobs}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AiOutlineTeam className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Applications</p>
            <p className="text-2xl font-bold">{stats.totalApplications}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <AiOutlineEye className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Views</p>
            <p className="text-2xl font-bold">{stats.totalViews}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobStatsCards;
