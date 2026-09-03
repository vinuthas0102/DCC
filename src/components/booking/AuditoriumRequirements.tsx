import React from 'react';
import { Input } from '../ui/Input';
import { AuditoriumRequirements as AuditoriumReqs } from '../../types';
import { Users, Volume2, Lightbulb, Zap, Trash2 } from 'lucide-react';

interface AuditoriumRequirementsProps {
  requirements: AuditoriumReqs;
  onChange: (requirements: AuditoriumReqs) => void;
}

export const AuditoriumRequirementsForm: React.FC<AuditoriumRequirementsProps> = ({
  requirements,
  onChange,
}) => {
  const updateRequirement = (field: keyof AuditoriumReqs, value: any) => {
    onChange({ ...requirements, [field]: value });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Auditorium Requirements
        </h3>
        <p className="text-sm text-gray-600">Specify your technical and seating requirements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Expected Attendees *
          </label>
          <Input
            type="number"
            min="1"
            value={requirements.expectedAttendees || 0}
            onChange={(e) => updateRequirement('expectedAttendees', parseInt(e.target.value) || 0)}
            placeholder="Number of attendees"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seating Arrangement *
          </label>
          <select
            value={requirements.seatingArrangement || ''}
            onChange={(e) => updateRequirement('seatingArrangement', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select arrangement...</option>
            <option value="theatre">Theatre Style</option>
            <option value="classroom">Classroom Style</option>
            <option value="u-shape">U-Shape</option>
            <option value="boardroom">Boardroom</option>
            <option value="banquet">Banquet</option>
            <option value="cocktail">Cocktail/Standing</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Sound System</p>
              <p className="text-xs text-gray-600">Microphone, speakers, audio equipment</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={requirements.needsSoundSystem || false}
            onChange={(e) => updateRequirement('needsSoundSystem', e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Stage Lighting</p>
              <p className="text-xs text-gray-600">Professional lighting setup</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={requirements.needsLighting || false}
            onChange={(e) => updateRequirement('needsLighting', e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Backup Generator</p>
              <p className="text-xs text-gray-600">Power backup during event</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={requirements.needsGenerator || false}
            onChange={(e) => updateRequirement('needsGenerator', e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Garbage Management</p>
              <p className="text-xs text-gray-600">Post-event cleanup service</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={requirements.needsGarbageManagement || false}
            onChange={(e) => updateRequirement('needsGarbageManagement', e.target.checked)}
            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Requirements
        </label>
        <textarea
          value={requirements.additionalNotes || ''}
          onChange={(e) => updateRequirement('additionalNotes', e.target.value)}
          placeholder="Any other specific requirements or special requests..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};
