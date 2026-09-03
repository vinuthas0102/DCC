import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface EstateImagesTabProps {
  formData: {
    images?: string[];
  };
  updateFormData: (updates: any) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_COUNT = 20;

export const EstateImagesTab: React.FC<EstateImagesTabProps> = ({ formData, updateFormData }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const images = formData?.images || [];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    setError('');
    const fileArray = Array.from(files);

    if (images.length + fileArray.length > MAX_IMAGE_COUNT) {
      setError(`Maximum ${MAX_IMAGE_COUNT} images allowed. You can only add ${MAX_IMAGE_COUNT - images.length} more.`);
      return;
    }

    const validFiles = fileArray.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} exceeds the 10MB size limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const imageUrls: string[] = [];
    let processedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          imageUrls.push(e.target.result as string);
          processedCount++;
          if (processedCount === validFiles.length) {
            updateFormData({ images: [...images, ...imageUrls] });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    updateFormData({
      images: images.filter((_, i) => i !== index),
    });
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estate Images</h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload images of the estate. The first image will be used as the cover photo. Maximum {MAX_IMAGE_COUNT} images, 10MB each.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-base font-medium text-gray-900 mb-2">
          Drop images here or click to upload
        </h4>
        <p className="text-sm text-gray-500 mb-4">
          PNG, JPG, GIF up to 10MB each
        </p>
        <Button type="button" onClick={onButtonClick} variant="outline" disabled={images.length >= MAX_IMAGE_COUNT}>
          Select Files
        </Button>
      </div>

      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Uploaded Images ({images.length}/{MAX_IMAGE_COUNT})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={image}
                  alt={`Estate ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                    Cover
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};
