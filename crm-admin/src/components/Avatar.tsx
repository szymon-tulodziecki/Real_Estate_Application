import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number; // px
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt = 'avatar', size = 40, className = '' }) => {
  const dimension = `${size}px`;
  return (
    <div
      style={{ width: dimension, height: dimension }}
      className={`relative rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <UserIcon className="w-1/2 h-1/2 opacity-90" />
      )}
    </div>
  );
};

export default Avatar;
