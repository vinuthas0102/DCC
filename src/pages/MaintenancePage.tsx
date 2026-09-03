import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { Search, ArrowUpCircle, Clock, LogOut } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { propertyService } from '../services/propertyService';
import { BookingDTO, RoomTypeDTO } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export const MaintenancePage: React.FC = () => {
  useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState('upgrades');
  const [bookings, setBookings] = useState<BookingDTO[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDTO | null>(null);

  const [upgradeRoomType, setUpgradeRoomType] = useState('');
  const [extensionDate, setExtensionDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [checkedInBookings, allRoomTypes] = await Promise.all([
        bookingService.getBookings({ status: 'CHECKED_IN' }),
        propertyService.getRoomTypes(),
      ]);
      setBookings(checkedInBookings);
      setRoomTypes(allRoomTypes);
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast('Failed to load maintenance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (booking: BookingDTO) => {
    setSelectedBooking(booking);
    setUpgradeRoomType('');
    setShowUpgradeModal(true);
  };

  const handleExtension = (booking: BookingDTO) => {
    setSelectedBooking(booking);
    setExtensionDate('');
    setShowExtensionModal(true);
  };

  const handleCheckout = (booking: BookingDTO) => {
    setSelectedBooking(booking);
    setShowCheckoutModal(true);
  };

  const processUpgrade = async () => {
    if (!selectedBooking || !upgradeRoomType) {
      addToast('Please select a room type', 'error');
      return;
    }

    try {
      const currentRoomType = roomTypes.find((rt) => rt.id === selectedBooking.roomTypeId);
      const newRoomType = roomTypes.find((rt) => rt.id === upgradeRoomType);

      if (!currentRoomType || !newRoomType) return;

      addToast('Room upgrade processed successfully', 'success');
      setShowUpgradeModal(false);
      loadData();
    } catch (error) {
      addToast('Failed to process upgrade', 'error');
    }
  };

  const processExtension = async () => {
    if (!selectedBooking || !extensionDate) {
      addToast('Please select an extension date', 'error');
      return;
    }

    try {
      await bookingService.updateBooking(selectedBooking.id, {
        checkOutDate: extensionDate,
      });
      addToast('Booking extended successfully', 'success');
      setShowExtensionModal(false);
      loadData();
    } catch (error) {
      addToast('Failed to extend booking', 'error');
    }
  };

  const processCheckout = async () => {
    if (!selectedBooking) return;

    try {
      await bookingService.updateBookingStatus(selectedBooking.id, 'CHECKED_OUT');
      addToast('Guest checked out successfully', 'success');
      setShowCheckoutModal(false);
      loadData();
    } catch (error) {
      addToast('Failed to process checkout', 'error');
    }
  };

  const filteredBookings = searchQuery
    ? bookings.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.guestDetails.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.property?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : bookings;

  const tabs = [
    {
      id: 'upgrades',
      label: 'Room Upgrades',
      content: (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{booking.bookingNumber}</h3>
                    <p className="text-sm text-gray-600">{booking.guestDetails.fullName}</p>
                  </div>
                  <Button size="sm" onClick={() => handleUpgrade(booking)}>
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Property: </span>
                    <span className="font-medium">{booking.property?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Room: </span>
                    <span className="font-medium">{booking.roomType?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-out: </span>
                    <span className="font-medium">{formatDate(booking.checkOutDate)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'extensions',
      label: 'Extensions',
      content: (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{booking.bookingNumber}</h3>
                    <p className="text-sm text-gray-600">{booking.guestDetails.fullName}</p>
                  </div>
                  <Button size="sm" onClick={() => handleExtension(booking)}>
                    <Clock className="w-4 h-4 mr-2" />
                    Extend Stay
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Property: </span>
                    <span className="font-medium">{booking.property?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Checkout: </span>
                    <span className="font-medium">{formatDate(booking.checkOutDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Paid: </span>
                    <span className="font-medium">{formatCurrency(booking.paidAmount)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'checkout',
      label: 'Checkout',
      content: (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{booking.bookingNumber}</h3>
                    <p className="text-sm text-gray-600">{booking.guestDetails.fullName}</p>
                  </div>
                  <Button size="sm" onClick={() => handleCheckout(booking)}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Check Out
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Property: </span>
                    <span className="font-medium">{booking.property?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Room: </span>
                    <span className="font-medium">{booking.roomType?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Checkout Date: </span>
                    <span className="font-medium">{formatDate(booking.checkOutDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Balance: </span>
                    <span className={`font-medium ${booking.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(booking.balanceAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance & Post-Booking</h1>
          <p className="text-gray-600">Manage upgrades, extensions, and checkouts</p>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <Input
              type="text"
              placeholder="Search by booking number, guest name, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : (
          <Card>
            <div className="p-6">
              <Tabs tabs={tabs} defaultTab={activeTab} onChange={setActiveTab} />
            </div>
          </Card>
        )}
      </div>

      <Modal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Room Upgrade">
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Room Type</p>
            <p className="text-lg font-semibold text-gray-900">{selectedBooking?.roomType?.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upgrade to Room Type
            </label>
            <Select
              value={upgradeRoomType}
              onChange={(e) => setUpgradeRoomType(e.target.value)}
            >
              <option value="">Select new room type...</option>
              {roomTypes
                .filter((rt) => rt.id !== selectedBooking?.roomTypeId)
                .map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
            </Select>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Price Differential</p>
            <p className="text-xs text-blue-700 mt-1">
              Additional charges will be calculated based on remaining nights
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={processUpgrade} disabled={!upgradeRoomType} className="flex-1">
              Confirm Upgrade
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showExtensionModal} onClose={() => setShowExtensionModal(false)} title="Extend Stay">
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Checkout Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {selectedBooking ? formatDate(selectedBooking.checkOutDate) : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Checkout Date
            </label>
            <Input
              type="date"
              value={extensionDate}
              onChange={(e) => setExtensionDate(e.target.value)}
              min={selectedBooking?.checkOutDate}
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">Additional Charges</p>
            <p className="text-xs text-blue-700 mt-1">
              Will be calculated based on room rate and extension period
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowExtensionModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={processExtension} disabled={!extensionDate} className="flex-1">
              Confirm Extension
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Guest Checkout">
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Guest:</span>
              <span className="font-semibold text-gray-900">{selectedBooking?.guestDetails.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Booking:</span>
              <span className="font-mono text-sm font-semibold text-gray-900">
                {selectedBooking?.bookingNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Property:</span>
              <span className="font-medium text-gray-900">{selectedBooking?.property?.name}</span>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-2">Payment Status</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-yellow-800">Balance Due:</span>
              <span className={`text-lg font-bold ${selectedBooking && selectedBooking.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {selectedBooking ? formatCurrency(selectedBooking.balanceAmount) : '₹0'}
              </span>
            </div>
          </div>

          {selectedBooking && selectedBooking.balanceAmount > 0 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-900">Outstanding Balance</p>
              <p className="text-xs text-red-700 mt-1">
                Please collect payment before completing checkout
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={processCheckout}
              disabled={selectedBooking ? selectedBooking.balanceAmount > 0 : true}
              className="flex-1"
            >
              Complete Checkout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
