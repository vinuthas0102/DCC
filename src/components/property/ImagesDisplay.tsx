import React from 'react';
import { ImageCarousel } from '../ui/ImageCarousel';
import { Image as ImageIcon } from 'lucide-react';

interface ImagesDisplayProps {
  images: string[];
  propertyName: string;
}

export const ImagesDisplay: React.FC<ImagesDisplayProps> = ({ images, propertyName }) => {
  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
        <p>No images available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden">
        <ImageCarousel
          images={images}
          alt={propertyName}
          className="h-64"
          showFullscreen={true}
        />
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
          >
            <img
              src={image}
              alt={`${propertyName} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-600 text-center">
        {images.length} {images.length === 1 ? 'image' : 'images'} available
      </div>
    </div>
  );
};
