import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, FileText, CalendarCheck } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { usePropertyBooking } from '../../hooks/usePropertyBooking';
import { ROUTES } from '../../constants/routes';

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface BookingFormSectionProps {
  propertyId: string;
  roomTypes: Array<{ id: string; name: string }>;
  isOtherFacilities: boolean;
  isGovtFacilities: boolean;
  requiresLogin: boolean;
  isLoggedIn: boolean;
  initialCheckIn?: string;
  initialCheckOut?: string;
  showDatesPrefilled?: boolean;
}

export const BookingFormSection: React.FC<BookingFormSectionProps> = ({
  propertyId,
  roomTypes,
  isOtherFacilities,
  isGovtFacilities,
  requiresLogin,
  isLoggedIn,
  initialCheckIn = '',
  initialCheckOut = '',
  showDatesPrefilled = false,
}) => {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [datesFromCalendar, setDatesFromCalendar] = useState(false);

  useEffect(() => {
    if (initialCheckIn) {
      setCheckIn(initialCheckIn);
      setDatesFromCalendar(true);
    }
  }, [initialCheckIn]);

  useEffect(() => {
    if (initialCheckOut) {
      setCheckOut(initialCheckOut);
      setDatesFromCalendar(true);
    }
  }, [initialCheckOut]);
  const [roomTypeId, setRoomTypeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [requirements, setRequirements] = useState('');

  const { createBooking, loading, saveDraft, draftLoading } = usePropertyBooking(propertyId, requiresLogin);

  const formData = {
    checkIn,
    checkOut,
    roomTypeId,
    quantity,
    guestName,
    guestEmail,
    guestPhone,
    adultCount,
    childCount,
    requirements,
  };

  const handleSubmit = () => createBooking(formData);
  const handleSaveDraft = () => saveDraft(formData);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Book This Property</h2>
        {isOtherFacilities && !isLoggedIn && (
          <Badge variant="success">No Login Required</Badge>
        )}
        {isGovtFacilities && (
          <Badge variant="warning">Login Required</Badge>
        )}
      </div>

      {isOtherFacilities && !isLoggedIn && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Instant Booking Available!</strong> No account needed. Your booking details and OTP will be sent to your email.
            {' '}
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="underline hover:text-blue-900"
            >
              Already have an account? Login here
            </button>
          </p>
        </div>
      )}

      {import.meta.env.VITE_ENABLE_MOCK_OTP === 'true' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Development Mode Active:</strong> All bookings will use OTP: <code className="bg-yellow-100 px-2 py-1 rounded">123456</code>
          </p>
        </div>
      )}

      {(showDatesPrefilled || datesFromCalendar) && checkIn && checkOut && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6">
          <CalendarCheck size={16} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 flex-1">
            <span className="font-semibold">Dates selected from calendar</span>
            {' — '}
            <span className="font-medium">{formatDate(checkIn)}</span>
            <span className="mx-1.5 text-emerald-500">→</span>
            <span className="font-medium">{formatDate(checkOut)}</span>
          </p>
        </div>
      )}

      <Card>
        <CardBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Check-in Date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                icon={<Calendar size={20} />}
                min={new Date().toISOString().split('T')[0]}
              />
              <Input
                type="date"
                label="Check-out Date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                icon={<Calendar size={20} />}
                min={checkIn}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Room Type"
                options={[
                  { value: '', label: 'Select room type' },
                  ...roomTypes.map((rt) => ({ value: rt.id, label: rt.name })),
                ]}
                value={roomTypeId}
                onChange={(e) => setRoomTypeId(e.target.value)}
              />
              <Input
                type="number"
                label="Number of Rooms"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                icon={<Users size={20} />}
                min={1}
              />
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-4">Guest Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest name"
                />
                <Input
                  type="email"
                  label="Email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="guest@example.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  type="tel"
                  label="Phone Number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
                <Input
                  type="number"
                  label="Number of Adults"
                  value={adultCount}
                  onChange={(e) => setAdultCount(Math.max(1, parseInt(e.target.value) || 1))}
                  icon={<Users size={20} />}
                  min={1}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  type="number"
                  label="Number of Children"
                  value={childCount}
                  onChange={(e) => setChildCount(Math.max(0, parseInt(e.target.value) || 0))}
                  icon={<Users size={20} />}
                  min={0}
                />
                <Input
                  label="Special Requirements (Optional)"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Any special needs or requests"
                />
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Total Guests:</strong> {adultCount + childCount} ({adultCount} {adultCount === 1 ? 'Adult' : 'Adults'}, {childCount} {childCount === 1 ? 'Child' : 'Children'})
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              {isGovtFacilities && isLoggedIn && (
                <button
                  onClick={handleSaveDraft}
                  disabled={draftLoading || loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {draftLoading ? (
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText size={15} />
                  )}
                  Save as Draft
                </button>
              )}
              <Button
                onClick={handleSubmit}
                size="lg"
                loading={loading}
                className="min-w-52"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
