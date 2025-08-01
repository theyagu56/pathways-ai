import React from 'react';

interface MedicalEvent {
  date: string; // ISO format (e.g., "2024-05-12")
  type: string; // e.g., "Visit", "Diagnosis", "Procedure", "Billing"
  description: string;
  source: string; // e.g., filename or document name
  amount?: number; // optional for billing entries
}

interface MedicalTimelineProps {
  events: MedicalEvent[];
  className?: string;
}

const MedicalTimeline: React.FC<MedicalTimelineProps> = ({ events, className = '' }) => {
  // Group events by month and year
  const groupEventsByMonth = (events: MedicalEvent[]) => {
    const groups: { [key: string]: MedicalEvent[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(event);
    });
    
    return groups;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format month header
  const formatMonthHeader = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Get event type color
  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visit':
        return 'bg-blue-500 text-white';
      case 'diagnosis':
        return 'bg-red-500 text-white';
      case 'procedure':
        return 'bg-purple-500 text-white';
      case 'billing':
        return 'bg-green-500 text-white';
      case 'imaging':
        return 'bg-yellow-500 text-black';
      case 'medication':
        return 'bg-indigo-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Get event type icon
  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visit':
        return '🏥';
      case 'diagnosis':
        return '🔍';
      case 'procedure':
        return '⚕️';
      case 'billing':
        return '💰';
      case 'imaging':
        return '📷';
      case 'medication':
        return '💊';
      default:
        return '📋';
    }
  };

  // Check if event is recent (within last 30 days)
  const isRecentEvent = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return eventDate >= thirtyDaysAgo;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const groupedEvents = groupEventsByMonth(events);
  const sortedMonths = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  if (events.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Events Found</h3>
        <p className="text-gray-500">Upload medical documents to see your timeline here.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {sortedMonths.map((monthKey) => (
        <div key={monthKey} className="space-y-4">
          {/* Month Header */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              {formatMonthHeader(monthKey)}
            </h3>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Events for this month */}
          <div className="space-y-4 ml-6">
            {groupedEvents[monthKey].map((event, index) => (
              <div
                key={`${event.date}-${index}`}
                className={`relative pl-8 pb-4 ${
                  isRecentEvent(event.date) 
                    ? 'bg-blue-50 border-l-2 border-blue-200 rounded-r-lg p-4' 
                    : ''
                }`}
              >
                {/* Timeline connector */}
                <div className="absolute left-0 top-2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full -ml-2"></div>
                
                {/* Event content */}
                <div className="space-y-2">
                  {/* Event header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                      {isRecentEvent(event.date) && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Recent
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(event.date)}
                    </div>
                  </div>

                  {/* Event description */}
                  <div className="text-gray-900">
                    {event.description}
                  </div>

                  {/* Event details */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span>📄</span>
                      <span>{event.source}</span>
                    </span>
                    {event.amount && (
                      <span className="font-medium text-green-600">
                        {formatCurrency(event.amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MedicalTimeline; 