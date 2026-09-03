import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Plus, Link as LinkIcon, Copy, ExternalLink, Check } from 'lucide-react';
import { adHocLinkService } from '../services/adHocLinkService';
import { propertyService } from '../services/propertyService';
import { AdHocLinkDTO, PropertyDTO } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export const AdHocLinksPage: React.FC = () => {
  const { user } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);
  const [links, setLinks] = useState<AdHocLinkDTO[]>([]);
  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [linksData, propertiesData] = await Promise.all([
        adHocLinkService.getLinks(user!.id),
        propertyService.getProperties({ status: 'PUBLISHED' }),
      ]);
      setLinks(linksData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast('Failed to load links', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!selectedPropertyId) {
      addToast('Please select a property', 'error');
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      await adHocLinkService.createLink(user!.id, {
        propertyId: selectedPropertyId,
        expiresAt: expiresAt.toISOString(),
        metadata: {},
      });

      addToast('Booking link created successfully', 'success');
      setShowCreateModal(false);
      setSelectedPropertyId('');
      loadData();
    } catch (error) {
      addToast('Failed to create link', 'error');
    }
  };

  const copyLinkToClipboard = (token: string) => {
    const url = `${window.location.origin}/book/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    addToast('Link copied to clipboard', 'success');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const activeLinks = links.filter((link) => !link.used && new Date(link.expiresAt) > new Date());
  const expiredLinks = links.filter((link) => link.used || new Date(link.expiresAt) <= new Date());

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ad-Hoc Booking Links</h1>
            <p className="text-gray-600">Create shareable links for phone-in bookings</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Link
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Links ({activeLinks.length})</h2>
              {activeLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <LinkIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No active links</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLinks.map((link) => {
                    const property = properties.find((p) => p.id === link.propertyId);
                    const url = `${window.location.origin}/book/${link.token}`;

                    return (
                      <div key={link.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{property?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Expires: {formatDate(link.expiresAt)}
                            </p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm text-gray-700 overflow-x-auto">
                            {url}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyLinkToClipboard(link.token)}
                          >
                            {copiedToken === link.token ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Used/Expired Links ({expiredLinks.length})</h2>
              {expiredLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No used or expired links</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiredLinks.map((link) => {
                    const property = properties.find((p) => p.id === link.propertyId);
                    return (
                      <div key={link.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-700">{property?.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {link.used
                                ? `Used: ${formatDate(link.usedAt!)}`
                                : `Expired: ${formatDate(link.expiresAt)}`}
                            </p>
                          </div>
                          <Badge variant={link.used ? 'info' : 'warning'}>
                            {link.used ? 'Used' : 'Expired'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Ad-Hoc Booking Link">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property *
            </label>
            <Select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              <option value="">Select property...</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link Validity (Hours)
            </label>
            <Input
              type="number"
              min="1"
              max="168"
              value={expiryHours}
              onChange={(e) => setExpiryHours(parseInt(e.target.value) || 24)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Link will expire in {expiryHours} hours
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">How it works</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Share this link with guests via phone, SMS, or email</li>
              <li>• The link pre-fills property details in the booking form</li>
              <li>• Guests can complete their booking directly</li>
              <li>• Link expires automatically after the set time</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateLink} disabled={!selectedPropertyId} className="flex-1">
              Generate Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
