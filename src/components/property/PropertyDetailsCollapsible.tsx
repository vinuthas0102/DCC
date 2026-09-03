import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PropertyDTO, BlockDTO, FloorDTO, RoomDTO } from '../../types';
import { BasicInfoDisplay } from './BasicInfoDisplay';
import { LocationDisplay } from './LocationDisplay';
import { BlocksFloorsDisplay } from './BlocksFloorsDisplay';
import { RoomsDisplay } from './RoomsDisplay';
import { ImagesDisplay } from './ImagesDisplay';
import { PricingDisplay } from './PricingDisplay';
import { Button } from '../ui/Button';

interface PropertyDetailsCollapsibleProps {
  property: PropertyDTO;
  blocks: BlockDTO[];
  floors: FloorDTO[];
  rooms: RoomDTO[];
}

interface Section {
  id: string;
  title: string;
  component: React.ReactNode;
}

export const PropertyDetailsCollapsible: React.FC<PropertyDetailsCollapsibleProps> = ({
  property,
  blocks,
  floors,
  rooms,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(['basic', 'location', 'blocks', 'rooms', 'images', 'pricing']));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const sections: Section[] = [
    {
      id: 'basic',
      title: 'Basic Information',
      component: <BasicInfoDisplay property={property} />,
    },
    {
      id: 'location',
      title: 'Location',
      component: <LocationDisplay property={property} />,
    },
    {
      id: 'blocks',
      title: 'Blocks & Floors',
      component: <BlocksFloorsDisplay blocks={blocks} />,
    },
    {
      id: 'rooms',
      title: 'Rooms',
      component: <RoomsDisplay rooms={rooms} blocks={blocks} floors={floors} />,
    },
    {
      id: 'images',
      title: 'Images',
      component: <ImagesDisplay images={property.images} propertyName={property.name} />,
    },
    {
      id: 'pricing',
      title: 'Pricing',
      component: <PricingDisplay rooms={rooms} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end mb-4">
        <Button variant="ghost" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="ghost" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>

      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        return (
          <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-6 py-4 border-t border-gray-200">{section.component}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
