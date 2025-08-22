import React from 'react';
import { X, Calendar, Clock, MapPin, Lock, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '../types';
import Button from './Button';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event }) => {
  // Handle escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();
  const isPast = eventDate < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-heading font-bold mb-2">{event.title}</h2>
              <div className="flex items-center space-x-4 text-primary-100">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  <span>{format(eventDate, 'EEEE, MMMM do, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  <span>{format(eventDate, 'h:mm a')}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Status Badge */}
          <div className="mt-4 flex items-center space-x-3">
            {isUpcoming && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <Calendar size={14} className="mr-1" />
                Upcoming Event
              </span>
            )}
            {isPast && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 text-neutral-600">
                <Clock size={14} className="mr-1" />
                Past Event
              </span>
            )}
            {event.isMembers && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary-100 text-secondary-800">
                <Lock size={14} className="mr-1" />
                Members Only
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Location */}
          <div className="mb-6">
            <h3 className="text-lg font-heading font-semibold text-primary-600 mb-3 flex items-center">
              <MapPin size={20} className="mr-2 text-secondary-500" />
              Location
            </h3>
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-neutral-700 mb-3">{event.location}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const encodedLocation = encodeURIComponent(event.location);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
                }}
                className="flex items-center"
              >
                <ExternalLink size={16} className="mr-2" />
                View on Google Maps
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-heading font-semibold text-primary-600 mb-3">
              Event Details
            </h3>
            <div className="prose max-w-none text-neutral-700">
              <p className="leading-relaxed">{event.description}</p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center">
              <Users size={16} className="mr-2" />
              Important Information
            </h4>
            <div className="text-sm text-blue-700 space-y-2">
              {event.isMembers ? (
                <p>• This event is restricted to Lodge members and their guests only</p>
              ) : (
                <p>• This event is open to the public - visitors are welcome</p>
              )}
              <p>• Please arrive 15 minutes before the scheduled start time</p>
              <p>• Smart casual dress code applies unless otherwise specified</p>
              {isUpcoming && (
                <p>• For any questions or to confirm attendance, please contact the Lodge Secretary</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {isUpcoming && (
            <div className="bg-neutral-50 rounded-lg p-4">
              <h4 className="font-medium text-neutral-800 mb-2">Contact Information</h4>
              <div className="text-sm text-neutral-600 space-y-1">
                <p><strong>Email:</strong> mattjohnson56@hotmail.co.uk</p>
                <p><strong>Phone:</strong> 07590 800657</p>
                <p className="text-xs text-neutral-500 mt-2">
                  Please contact us if you have any questions about this event or need special accommodations.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-6 bg-neutral-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              {isUpcoming ? (
                <span>Event starts in {Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</span>
              ) : (
                <span>Event took place on {format(eventDate, 'MMMM do, yyyy')}</span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {isUpcoming && (
                <Button 
                  onClick={() => {
                    // Add to calendar functionality
                    const startDate = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
                    window.open(calendarUrl, '_blank');
                  }}
                >
                  Add to Calendar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;