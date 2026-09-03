import {
  getRegions as getRegionsImpl,
  createRegion as createRegionImpl,
  updateRegion as updateRegionImpl,
} from './property/regionService';

import {
  getEstates as getEstatesImpl,
  createEstate as createEstateImpl,
  updateEstate as updateEstateImpl,
} from './property/estateService';

import {
  getAssetTypes as getAssetTypesImpl,
  createAssetType as createAssetTypeImpl,
  updateAssetType as updateAssetTypeImpl,
  getModules as getModulesImpl,
  getPropertyTypes as getPropertyTypesImpl,
  getAmenities as getAmenitiesImpl,
} from './property/assetTypeService';

import {
  getBlocks as getBlocksImpl,
  getFloors as getFloorsImpl,
  createBlock as createBlockImpl,
  createFloor as createFloorImpl,
  updateBlock as updateBlockImpl,
  updateFloor as updateFloorImpl,
  deleteBlock as deleteBlockImpl,
  deleteFloor as deleteFloorImpl,
} from './property/blockService';

import {
  getRoomTypes as getRoomTypesImpl,
  getRooms as getRoomsImpl,
  getRoomsByProperty as getRoomsByPropertyImpl,
  createRoom as createRoomImpl,
  updateRoom as updateRoomImpl,
  deleteRoom as deleteRoomImpl,
} from './property/roomService';

import {
  getProperties as getPropertiesImpl,
  getPropertyById as getPropertyByIdImpl,
  checkPropertyCodeExists as checkPropertyCodeExistsImpl,
  createProperty as createPropertyImpl,
  updateProperty as updatePropertyImpl,
  getPropertyHierarchy as getPropertyHierarchyImpl,
} from './property/corePropertyService';

export const propertyService = {
  getRegions: getRegionsImpl,
  createRegion: createRegionImpl,
  updateRegion: updateRegionImpl,

  getEstates: getEstatesImpl,
  createEstate: createEstateImpl,
  updateEstate: updateEstateImpl,

  getModules: getModulesImpl,
  getPropertyTypes: getPropertyTypesImpl,
  getAssetTypes: getAssetTypesImpl,
  createAssetType: createAssetTypeImpl,
  updateAssetType: updateAssetTypeImpl,

  getAmenities: getAmenitiesImpl,

  getProperties: getPropertiesImpl,
  getPropertyById: getPropertyByIdImpl,
  checkPropertyCodeExists: checkPropertyCodeExistsImpl,
  createProperty: createPropertyImpl,
  updateProperty: updatePropertyImpl,
  getPropertyHierarchy: getPropertyHierarchyImpl,

  getRoomTypes: getRoomTypesImpl,
  getRooms: getRoomsImpl,
  getRoomsByProperty: getRoomsByPropertyImpl,
  createRoom: createRoomImpl,
  updateRoom: updateRoomImpl,
  deleteRoom: deleteRoomImpl,

  getBlocks: getBlocksImpl,
  getFloors: getFloorsImpl,
  createBlock: createBlockImpl,
  createFloor: createFloorImpl,
  updateBlock: updateBlockImpl,
  updateFloor: updateFloorImpl,
  deleteBlock: deleteBlockImpl,
  deleteFloor: deleteFloorImpl,
};
