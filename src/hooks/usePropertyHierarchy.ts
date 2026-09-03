import { useState, useEffect } from 'react';
import { propertyService } from '../services/propertyService';
import { BlockDTO, FloorDTO, RoomDTO } from '../types';

export const usePropertyHierarchy = (propertyId: string | undefined) => {
  const [blocks, setBlocks] = useState<BlockDTO[]>([]);
  const [floors, setFloors] = useState<FloorDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHierarchy = async () => {
      if (!propertyId) return;

      setLoading(true);
      setError(null);
      try {
        const data = await propertyService.getPropertyHierarchy(propertyId);
        setBlocks(data.blocks);
        setFloors(data.floors);
        setRooms(data.rooms);
      } catch (err) {
        console.error('Failed to load property hierarchy:', err);
        setError('Failed to load property structure');
      } finally {
        setLoading(false);
      }
    };

    loadHierarchy();
  }, [propertyId]);

  return { blocks, floors, rooms, loading, error };
};
