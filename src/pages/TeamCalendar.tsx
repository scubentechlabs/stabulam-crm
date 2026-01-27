import { TeamAvailabilityCalendar } from '@/components/team/TeamAvailabilityCalendar';

export default function TeamCalendar() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Team Calendar</h1>
        <p className="page-description">
          View team availability and coordinate schedules
        </p>
      </div>

      <TeamAvailabilityCalendar />
    </div>
  );
}
