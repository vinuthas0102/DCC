import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, DollarSign, Plus, Search, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { MetricDetailDrawer } from '../components/dashboard/MetricDetailDrawer';
import { ViewToggle } from '../components/dashboard/ViewToggle';
import { AvailabilityOverview } from '../components/dashboard/AvailabilityOverview';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../stores/authStore';
import { useBookingStore } from '../stores/bookingStore';
import { useUIStore } from '../stores/uiStore';
import { formatCurrency } from '../utils/formatters';
import { formatDate } from '../utils/dateHelpers';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../constants/statuses';
import { ROUTES } from '../constants/routes';
import { canManageProperties, canApproveBookings } from '../utils/permissions';
import { FadeIn } from '../components/animations/FadeIn';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookings, fetchBookings, loading } = useBookingStore();
  const { viewMode } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (canApproveBookings(user.role)) {
        fetchBookings();
      } else {
        fetchBookings({ userId: user.id });
      }
    }
  }, [user]);

  const activeBookings = bookings.filter(
    (b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED'
  );

  const metrics = {
    totalBookings: activeBookings.length,
    pending: activeBookings.filter((b) => b.status === 'REQUESTED').length,
    active: activeBookings.filter((b) => b.status === 'PROVISIONED' || b.status === 'ALLOCATED' || b.status === 'CHECKED_IN').length,
    revenue: activeBookings.reduce((sum, b) => sum + b.totalAmount, 0),
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.property?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.guestDetails.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-teal-50/20">
      {/* Frozen hero header */}
      <div className="flex-none bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Welcome back, {user?.fullName || 'User'}
            </h1>
            <p className="text-gray-600">Here's what's happening with your bookings today</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Bookings"
              value={metrics.totalBookings}
              icon={Calendar}
              trend="12%"
              trendUp={true}
              color="blue"
              subtitle="This month"
              onClick={() => setSelectedMetric('total')}
            />
            <MetricCard
              title="Pending Approvals"
              value={metrics.pending}
              icon={Clock}
              color="coral"
              subtitle="Requires action"
              onClick={() => setSelectedMetric('pending')}
            />
            <MetricCard
              title="Active Reservations"
              value={metrics.active}
              icon={CheckCircle}
              color="green"
              subtitle="Currently booked"
              onClick={() => setSelectedMetric('active')}
            />
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(metrics.revenue)}
              icon={DollarSign}
              trend="8%"
              trendUp={true}
              color="teal"
              subtitle="This month"
              onClick={() => setSelectedMetric('revenue')}
            />
          </div>
        </div>
      </div>

      {/* Scrollable data area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {(canManageProperties(user?.role || 'public') || canApproveBookings(user?.role || 'public')) && (
            <FadeIn delay={100}>
              <div className="mb-6">
                <AvailabilityOverview />
              </div>
            </FadeIn>
          )}

        <Card className="animate-slideUp">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  placeholder="Search bookings by number, property, or guest name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={20} />}
                />
              </div>
              <div className="flex items-center gap-3">
                <ViewToggle />
                {canManageProperties(user?.role || 'public') && (
                  <Button onClick={() => navigate(ROUTES.PROPERTY_CREATE)} icon={<Plus size={20} />}>
                    New Property
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardBody>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
                <p className="mt-4 text-gray-600">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-6">Start by creating a new booking</p>
                <Button onClick={() => navigate(ROUTES.SEARCH)}>Browse Facilities</Button>
              </div>
            ) : (
              <div className="animate-fadeIn">
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBookings.map((booking, index) => {
                      const isExpanded = expandedBookingId === booking.id;
                      const getGradientClass = () => {
                        if (booking.status === 'REQUESTED') return 'pastel-yellow-gradient';
                        if (booking.status === 'PROVISIONED' || booking.status === 'ALLOCATED') return 'pastel-green-gradient';
                        if (booking.status === 'CHECKED_IN') return 'pastel-cyan-gradient';
                        return 'pastel-blue-gradient';
                      };

                      return (
                        <FadeIn key={booking.id} delay={index * 60}>
                          <div className={`${getGradientClass()} rounded-xl p-3 cursor-pointer`}>
                            <div
                              className="mb-3"
                              onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-xs font-mono text-gray-600 mb-1">{booking.bookingNumber}</p>
                                  <h3 className="font-bold text-gray-900 text-sm mb-1">{booking.property?.name}</h3>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} text-xs`}>
                                    {BOOKING_STATUS_LABELS[booking.status]}
                                  </Badge>
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-white/80">
                                  <span className="text-gray-500">Check-in</span>
                                  <p className="font-semibold text-gray-900">{formatDate(booking.checkInDate)}</p>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 border border-white/80">
                                  <span className="text-gray-500">Check-out</span>
                                  <p className="font-semibold text-gray-900">{formatDate(booking.checkOutDate)}</p>
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="space-y-2 animate-slideDown border-t border-white/60 pt-3">
                                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-xs border border-white/80">
                                  <span className="text-gray-500">Guest: </span>
                                  <span className="font-semibold text-gray-900">{booking.guestDetails.fullName}</span>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-xs border border-white/80">
                                  <span className="text-gray-500">Room Type: </span>
                                  <span className="font-semibold text-gray-900">{booking.roomType?.name}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-white/60 mt-3">
                              <span className="text-xs text-gray-600">Total Amount</span>
                              <span className="font-bold text-gray-900 text-sm">{formatCurrency(booking.totalAmount)}</span>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/bookings/${booking.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </FadeIn>
                      );
                    })}
                  </div>
                )}

                {viewMode === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Booking
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Property
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dates
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            onClick={() => navigate(`/bookings/${booking.id}`)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.bookingNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.guestDetails.fullName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.property?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
                                {BOOKING_STATUS_LABELS[booking.status]}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(booking.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-gray-900">{booking.bookingNumber}</span>
                            <Badge className={BOOKING_STATUS_COLORS[booking.status]}>
                              {BOOKING_STATUS_LABELS[booking.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{booking.property?.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(booking.totalAmount)}
                          </p>
                          <p className="text-sm text-gray-500">{booking.guestDetails.fullName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
        </div>
      </div>

      <MetricDetailDrawer
        isOpen={selectedMetric !== null}
        onClose={() => setSelectedMetric(null)}
        title={
          selectedMetric === 'total' ? 'Total Bookings Details' :
          selectedMetric === 'pending' ? 'Pending Approvals Details' :
          selectedMetric === 'active' ? 'Active Reservations Details' :
          'Revenue Breakdown'
        }
        color={
          selectedMetric === 'total' ? 'blue' :
          selectedMetric === 'pending' ? 'coral' :
          selectedMetric === 'active' ? 'green' :
          'teal'
        }
      >
        <div className="space-y-4">
          <div className="pastel-blue-gradient rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-600">Total Count</span>
              <span className="text-2xl font-bold text-gray-900">
                {selectedMetric === 'total' ? metrics.totalBookings :
                 selectedMetric === 'pending' ? metrics.pending :
                 selectedMetric === 'active' ? metrics.active :
                 metrics.revenue}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-green-600 font-semibold">+12% from last month</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Recent Activity</h4>
            {filteredBookings.slice(0, 5).map((booking, index) => (
              <FadeIn key={booking.id} delay={index * 50}>
                <div
                  className="pastel-cyan-gradient rounded-lg p-3 cursor-pointer"
                  onClick={() => {
                    setSelectedMetric(null);
                    navigate(`/bookings/${booking.id}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-gray-600">{booking.bookingNumber}</span>
                    <Badge className={`${BOOKING_STATUS_COLORS[booking.status]} text-xs`}>
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{booking.property?.name}</p>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{formatDate(booking.checkInDate)}</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(booking.totalAmount)}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </MetricDetailDrawer>
    </div>
  );
};
