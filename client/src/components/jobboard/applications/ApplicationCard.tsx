import Button from '@/components/ui/button';
import { useState } from 'react';
import {
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineEnvironment,
  AiOutlineEye,
  AiOutlineMail,
  AiOutlineStar,
  AiOutlineGlobal,
  AiOutlineCalendar,
  AiOutlineUser,
} from 'react-icons/ai';
import { Link } from 'react-router-dom';

interface Candidate {
  firstName: string;
  lastName: string;
  title: string;
  location: string;
  email: string;
  avatar?: string;
}

interface CV {
  id: number;
  title: string;
}

interface Application {
  id: number;
  candidateUserId: number;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  appliedAt: string;
  aiScore: number;
  hrRating: number | null;
  candidate: Candidate;
  cv: CV;
  coverLetter?: string;
  portfolioUrl?: string;
  hrNotes?: string;
}

interface ApplicationCardProps {
  application: Application;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onStatusUpdate: (
    applicationId: number,
    status: string,
    hrRating?: number,
    hrNotes?: string
  ) => void;
  formatDate: (dateString: string) => string;
  getStatusBadgeColor: (status: string) => string;
  getAiScoreColor: (score: number) => string;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  isSelected,
  onSelect,
  onStatusUpdate,
  formatDate,
  getStatusBadgeColor,
  getAiScoreColor,
}) => {
  const [showFullCoverLetter, setShowFullCoverLetter] = useState(false);
  const [rating, setRating] = useState(application.hrRating || 0);
  const [notes, setNotes] = useState(application.hrNotes || '');

  const handleQuickAction = (status: string) => {
    onStatusUpdate(
      application.id,
      status,
      rating || undefined,
      notes || undefined
    );
  };

  return (
    <div className="p-4 sm:p-6 border border-border rounded-lg mb-4 bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/30">
      {/* Mobile Layout (< 768px) */}
      <div className="block md:hidden">
        <div className="space-y-5">
          {/* Header Row - Checkbox, Avatar, Name, Status */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                className="mt-1 rounded flex-shrink-0 w-4 h-4 text-primary border-2 border-border focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-colors"
              />
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20 shadow-sm">
              {application.candidate?.avatar ? (
                <img
                  src={application.candidate.avatar}
                  alt={`${application.candidate.firstName} ${application.candidate.lastName}`}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary font-bold text-lg">
                  {application.candidate.firstName[0]}
                  {application.candidate.lastName[0]}
                </span>
              )}
            </div>

            {/* Name and Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-foreground truncate">
                    {application.candidate.firstName}{' '}
                    {application.candidate.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate font-medium">
                    {application.candidate.title}
                  </p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm ${getStatusBadgeColor(
                    application.status
                  )}`}
                >
                  {application.status.charAt(0).toUpperCase() +
                    application.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AiOutlineEnvironment
                size={16}
                className="flex-shrink-0 text-primary"
              />
              <span className="truncate font-medium">
                {application.candidate.location}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <AiOutlineMail size={16} className="flex-shrink-0 text-primary" />
              <a
                href={`mailto:${application.candidate.email}`}
                className="text-primary hover:underline truncate font-medium hover:text-primary/80 transition-colors"
              >
                {application.candidate.email}
              </a>
            </div>
          </div>

          {/* Application Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <AiOutlineCalendar size={14} className="text-primary" />
                <span className="text-primary font-medium text-xs">
                  Applied:
                </span>
              </div>
              <p className="font-bold text-foreground">
                {formatDate(application.appliedAt)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/30 rounded-lg border border-primary/20 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <AiOutlineUser size={14} className="text-primary" />
                <span className="text-primary font-medium text-xs">
                  AI Score:
                </span>
              </div>
              <p
                className={`font-bold text-lg ${getAiScoreColor(
                  application.aiScore
                )}`}
              >
                {application.aiScore}/100
              </p>
            </div>
          </div>

          {/* HR Rating */}
          <div className="p-4 bg-gradient-to-br from-secondary/70 to-secondary/50 rounded-lg border border-primary/20 shadow-sm">
            <span className="text-primary font-medium text-sm mb-3 block">
              HR Rating:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-xl transition-colors ${
                    star <= rating
                      ? 'text-primary hover:text-primary/80'
                      : 'text-muted hover:text-muted/70'
                  }`}
                >
                  <AiOutlineStar
                    size={20}
                    fill={star <= rating ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium text-primary">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {/* CV Link */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-accent/50 to-accent/30 rounded-lg border border-primary/20 shadow-sm">
            <span className="text-primary font-medium text-sm">
              CV Document:
            </span>
            <Link
              to={`/cv/${application.cv.id}`}
              className="text-primary hover:text-primary/80 font-semibold flex items-center gap-2 text-sm hover:underline transition-colors"
              target="_blank"
            >
              <AiOutlineEye size={16} />
              View CV
            </Link>
          </div>

          {/* Cover Letter */}
          {application.coverLetter && (
            <div className="space-y-3">
              <span className="text-sm font-semibold text-foreground">
                Cover Letter:
              </span>
              <div className="p-4 bg-gradient-to-br from-muted/80 to-muted/60 rounded-lg border border-primary/20 shadow-sm">
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {showFullCoverLetter
                      ? application.coverLetter
                      : `${application.coverLetter.substring(0, 200)}${
                          application.coverLetter.length > 200 ? '...' : ''
                        }`}
                  </p>
                </div>
                {application.coverLetter.length > 200 && (
                  <button
                    onClick={() => setShowFullCoverLetter(!showFullCoverLetter)}
                    className="text-primary hover:text-primary/80 text-sm mt-3 font-medium hover:underline transition-colors"
                  >
                    {showFullCoverLetter ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Portfolio Link */}
          {application.portfolioUrl && (
            <div className="space-y-2">
              <span className="text-sm font-semibold text-foreground">
                Portfolio:
              </span>
              <div className="p-3 bg-gradient-to-br from-secondary/70 to-secondary/50 rounded-lg border border-primary/20 shadow-sm">
                <a
                  href={application.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm flex items-center gap-2 break-all font-medium hover:underline transition-colors"
                >
                  <AiOutlineGlobal size={16} className="flex-shrink-0" />
                  {application.portfolioUrl}
                </a>
              </div>
            </div>
          )}

          {/* HR Notes */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">
              HR Notes:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this candidate..."
              className="w-full p-4 border border-border rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-input text-foreground placeholder:text-muted-foreground"
              rows={4}
            />
          </div>

          {/* Actions - Stack vertically on mobile */}
          <div className="space-y-3 pt-2">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {application.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction('reviewing')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 min-w-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AiOutlineEye size={14} className="mr-2 flex-shrink-0" />
                    <span className="truncate">Review</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction('shortlisted')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 min-w-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AiOutlineCheck size={14} className="mr-2 flex-shrink-0" />
                    <span className="truncate">Shortlist</span>
                  </Button>
                </>
              )}

              {application.status === 'reviewing' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction('shortlisted')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 min-w-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AiOutlineCheck size={14} className="mr-2 flex-shrink-0" />
                    <span className="truncate">Shortlist</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction('rejected')}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 flex-1 min-w-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AiOutlineClose size={14} className="mr-2 flex-shrink-0" />
                    <span className="truncate">Reject</span>
                  </Button>
                </>
              )}

              {application.status === 'shortlisted' && (
                <Button
                  size="sm"
                  onClick={() => handleQuickAction('hired')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <AiOutlineCheck size={14} className="mr-2" />
                  Hire
                </Button>
              )}
            </div>

            {/* Save Changes Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (rating > 0 || notes.trim()) {
                  onStatusUpdate(
                    application.id,
                    application.status,
                    rating || undefined,
                    notes || undefined
                  );
                }
              }}
              disabled={!rating && !notes.trim()}
              className="w-full shadow-md hover:shadow-lg transition-all duration-200 border-primary/30 text-primary hover:bg-primary/10"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout (>= 768px) */}
      <div className="hidden md:block">
        <div className="flex items-start gap-6">
          {/* Checkbox */}
          <div className="relative">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="mt-1 rounded flex-shrink-0 w-4 h-4 text-primary border-2 border-border focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-colors"
            />
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
            )}
          </div>

          {/* Avatar */}
          <div className="w-16 h-16 lg:w-18 lg:h-18 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20 shadow-md">
            {application.candidate.avatar ? (
              <img
                src={application.candidate.avatar}
                alt={`${application.candidate.firstName} ${application.candidate.lastName}`}
                className="w-16 h-16 lg:w-18 lg:h-18 rounded-full object-cover"
              />
            ) : (
              <span className="text-primary font-bold text-xl">
                {application.candidate.firstName[0]}
                {application.candidate.lastName[0]}
              </span>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl lg:text-2xl font-bold text-foreground">
                  {application.candidate.firstName}{' '}
                  {application.candidate.lastName}
                </h3>
                <p className="text-muted-foreground font-medium text-lg">
                  {application.candidate.title}
                </p>
                <div className="flex items-center gap-6 lg:gap-8 text-sm text-muted-foreground mt-2 flex-wrap">
                  <span className="flex items-center gap-2 min-w-0">
                    <AiOutlineEnvironment
                      size={16}
                      className="flex-shrink-0 text-primary"
                    />
                    <span className="truncate font-medium">
                      {application.candidate.location}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 min-w-0">
                    <AiOutlineMail
                      size={16}
                      className="flex-shrink-0 text-primary"
                    />
                    <a
                      href={`mailto:${application.candidate.email}`}
                      className="text-primary hover:underline truncate font-medium hover:text-primary/80 transition-colors"
                    >
                      {application.candidate.email}
                    </a>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md ${getStatusBadgeColor(
                    application.status
                  )}`}
                >
                  {application.status.charAt(0).toUpperCase() +
                    application.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Application Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-6">
              <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AiOutlineCalendar size={16} className="text-primary" />
                  <span className="text-primary font-medium">Applied:</span>
                </div>
                <p className="font-bold text-foreground">
                  {formatDate(application.appliedAt)}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/30 rounded-lg border border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AiOutlineUser size={16} className="text-primary" />
                  <span className="text-primary font-medium">AI Score:</span>
                </div>
                <p
                  className={`font-bold text-xl ${getAiScoreColor(
                    application.aiScore
                  )}`}
                >
                  {application.aiScore}/100
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-secondary/70 to-secondary/50 rounded-lg border border-primary/20 shadow-sm">
                <span className="text-primary font-medium block mb-2">
                  HR Rating:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-lg transition-colors ${
                        star <= rating
                          ? 'text-primary hover:text-primary/80'
                          : 'text-muted hover:text-muted/70'
                      }`}
                    >
                      <AiOutlineStar
                        size={18}
                        fill={star <= rating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm font-medium text-primary">
                      {rating}/5
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-accent/50 to-accent/30 rounded-lg border border-primary/20 shadow-sm">
                <span className="text-primary font-medium block mb-2">CV:</span>
                <Link
                  to={`/cv/${application.cv.id}`}
                  className="text-primary hover:text-primary/80 font-semibold flex items-center gap-2 hover:underline transition-colors"
                  target="_blank"
                >
                  <AiOutlineEye size={16} />
                  View CV
                </Link>
              </div>
            </div>

            {/* Cover Letter Preview */}
            {application.coverLetter && (
              <div className="mb-6">
                <span className="text-sm font-semibold text-foreground mb-3 block">
                  Cover Letter:
                </span>
                <div className="p-6 bg-gradient-to-br from-muted/80 to-muted/60 rounded-lg border border-primary/20 shadow-sm">
                  <div className="max-h-40 overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {showFullCoverLetter
                        ? application.coverLetter
                        : `${application.coverLetter.substring(0, 300)}${
                            application.coverLetter.length > 300 ? '...' : ''
                          }`}
                    </p>
                  </div>
                  {application.coverLetter.length > 300 && (
                    <button
                      onClick={() =>
                        setShowFullCoverLetter(!showFullCoverLetter)
                      }
                      className="text-primary hover:text-primary/80 mt-4 font-medium hover:underline transition-colors"
                    >
                      {showFullCoverLetter ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Portfolio Link */}
            {application.portfolioUrl && (
              <div className="mb-6">
                <span className="text-sm font-semibold text-foreground mb-3 block">
                  Portfolio:
                </span>
                <div className="p-4 bg-gradient-to-br from-secondary/70 to-secondary/50 rounded-lg border border-primary/20 shadow-sm">
                  <a
                    href={application.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 flex items-center gap-2 break-all font-medium hover:underline transition-colors"
                  >
                    <AiOutlineGlobal size={18} className="flex-shrink-0" />
                    {application.portfolioUrl}
                  </a>
                </div>
              </div>
            )}

            {/* HR Notes */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-3 block">
                HR Notes:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes about this candidate..."
                className="w-full p-4 border border-border rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-input text-foreground placeholder:text-muted-foreground"
                rows={3}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {application.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction('reviewing')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AiOutlineEye size={14} className="mr-2" />
                    Review
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction('shortlisted')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AiOutlineCheck size={14} className="mr-2" />
                    Shortlist
                  </Button>
                </>
              )}

              {application.status === 'reviewing' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction('shortlisted')}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AiOutlineCheck size={14} className="mr-2" />
                    Shortlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction('rejected')}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <AiOutlineClose size={14} className="mr-2" />
                    Reject
                  </Button>
                </>
              )}

              {application.status === 'shortlisted' && (
                <Button
                  size="sm"
                  onClick={() => handleQuickAction('hired')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <AiOutlineCheck size={14} className="mr-2" />
                  Hire
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (rating > 0 || notes.trim()) {
                    onStatusUpdate(
                      application.id,
                      application.status,
                      rating || undefined,
                      notes || undefined
                    );
                  }
                }}
                disabled={!rating && !notes.trim()}
                className="shadow-md hover:shadow-lg transition-all duration-200 border-primary/30 text-primary hover:bg-primary/10"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;
