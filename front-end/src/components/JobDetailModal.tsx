import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, DollarSign, Briefcase, Calendar, ExternalLink } from 'lucide-react';
import type { JobMatch } from '@/store/types';

interface JobDetailModalProps {
  job: JobMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailModal({ job, open, onOpenChange }: JobDetailModalProps) {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{job.title}</DialogTitle>
              <p className="text-lg font-medium text-muted-foreground">{job.company}</p>
            </div>
            <Badge
              className={
                job.matchScore >= 90
                  ? 'bg-success text-success-foreground text-lg px-4 py-2'
                  : job.matchScore >= 80
                  ? 'bg-primary text-primary-foreground text-lg px-4 py-2'
                  : 'bg-accent text-accent-foreground text-lg px-4 py-2'
              }
            >
              {job.matchScore}% Match
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Job Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{job.location}</span>
            </div>
            {job.salary && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>{job.salary}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span className="capitalize">{job.source}</span>
            </div>
            {job.postedDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{job.postedDate}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Skills */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Job Description</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {job.description || 
                'We are seeking a talented professional to join our dynamic team. This role offers an exciting opportunity to work on challenging projects and grow your career in a supportive environment.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {job.url ? (
              <Button 
                className="flex-1 gap-2"
                onClick={() => window.open(job.url, '_blank')}
              >
                Apply Now
              </Button>
            ) : (
              <Button className="flex-1 gap-2" disabled>
                Apply Now
              </Button>
            )}
            {job.url && (
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={() => window.open(job.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                View on {job.source}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
