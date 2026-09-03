import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Building2, AlertCircle } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Loading';
import { adHocLinkService } from '../services/adHocLinkService';
import { propertyService } from '../services/propertyService';
import { bookingService } from '../services/bookingService';
import { useAuthStore } from '../stores/authStore';
import { usePropertyStore } from '../stores/propertyStore';
import { useUIStore } from '../stores/uiStore';
import { AdHocLinkDTO, PropertyDTO, GuestDetails } from '../types';
import { ROUTES } from '../constants/routes';

export const AdHocBookingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { roomTypes } = usePropertyStore();
  const addToast = useUIStore((state) => state.addToast);

  const [link, setLink] = useState<AdHocLinkDTO | null>(null);
  const [property, setProperty] = useState<PropertyDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [requirements, setRequirements] = useState('');

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const linkData = await adHocLinkService.getLinkByToken(token);

      if (!linkData) {
        setTokenError('This booking link is invalid, expired, or has already been used.');
        setLoading(false);
        return;
      }

      const propertyData = await propertyService.getPropertyById(linkData.propertyId);

      if (!propertyData) {
        setTokenError('The property associated with this link could not be found.');
        setLoading(false);
        return;
      }

      setLink(linkData);
      setProperty(propertyData);
    } catch (error: any) {
      setTokenError('Failed to validate booking link. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!user) {
      addToast('Please login to complete booking', 'error');
      navigate(`${ROUTES.LOGIN}?returnTo=/book/${token}`);
      return;
    }

    if (!checkIn || !checkOut || !roomTypeId || !guestName || !guestEmail || !guestPhone) {
      addToast('Please fill all required fields', 'error');
      return;
    }

    if (adultCount < 1) {
      addToast('At least one adult is required', 'error');
      return;
    }

    if (!link || !property) return;

    setSubmitting(true);
    try {
      const guestDetails: GuestDetails = {
        fullName: guestName,
        email: guestEmail,
        phone: guestPhone,
        numberOfGuests: adultCount + childCount,
        numberOfAdults: adultCount,
        numberOfChildren: childCount,
      };

      const booking = await bookingService.createBooking(user.id, {
        propertyId: property.id,
        roomTypeId,
        quantity,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestDetails,
        specialRequirements: requirements,
      });

      await adHocLinkService.markLinkAsUsed(link.id);

      const paymentParams = new URLSearchParams({
        bookingId: booking.id,
        amount: booking.totalAmount.toString(),
        returnUrl: ROUTES.BOOKING_CONFIRMATION,
      });

      navigate(`${ROUTES.PAYMENT}?${paymentParams.toString()}`);
    } catch (error: any) {
      addToast(error.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid Booking Link</h1>
                <p className="text-gray-600 mb-6">{tokenError}</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate(ROUTES.HOME)}>
                    Go to Home
                  </Button>
                  {user && (
                    <Button onClick={() => navigate(ROUTES.PROPERTIES)}>
                      Go to Properties
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <p className="text-gray-600">Fill in the details to reserve your accommodation</p>
        </div>

        {property && (
          <div className="grid gap-6">
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-teal-400 relative">
                {property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Building2 size={64} className="text-white opacity-50" />
                  </div>
                )}
              </div>
              <CardBody>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{property.name}</h2>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={18} />
                  <span>{property.address}</span>
                </div>
                {property.description && (
                  <p className="text-gray-600 mt-3">{property.description}</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Booking Information</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Check-in Date *"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      icon={<Calendar size={20} />}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <Input
                      type="date"
                      label="Check-out Date *"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      icon={<Calendar size={20} />}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Room Type *"
                      options={[
                        { value: '', label: 'Select room type' },
                        ...roomTypes.map((rt) => ({ value: rt.id, label: rt.name })),
                      ]}
                      value={roomTypeId}
                      onChange={(e) => setRoomTypeId(e.target.value)}
                    />
                    <Input
                      type="number"
                      label="Number of Rooms *"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      icon={<Users size={20} />}
                      min={1}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Guest Details</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Enter guest name"
                    />
                    <Input
                      type="email"
                      label="Email *"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="guest@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="tel"
                      label="Phone Number *"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                    />
                    <Input
                      type="number"
                      label="Number of Adults *"
                      value={adultCount}
                      onChange={(e) => setAdultCount(Math.max(1, parseInt(e.target.value) || 1))}
                      icon={<Users size={20} />}
                      min={1}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Total Guests:</strong> {adultCount + childCount} ({adultCount} {adultCount === 1 ? 'Adult' : 'Adults'}, {childCount} {childCount === 1 ? 'Child' : 'Children'})
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.HOME)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBooking}
                loading={submitting}
                disabled={!checkIn || !checkOut || !roomTypeId || !guestName || !guestEmail || !guestPhone}
                className="flex-1"
                size="lg"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
