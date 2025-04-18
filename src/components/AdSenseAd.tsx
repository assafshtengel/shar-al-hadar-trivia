
import React from 'react';

interface AdSenseAdProps {
  className?: string;
  adSlot: string;
  adFormat?: '300x250' | 'auto' | 'fluid' | 'rectangle';
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({ 
  className = '', 
  adSlot, 
  adFormat = '300x250' 
}) => {
  return (
    <div className={`ad-container mx-auto flex justify-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'inline-block', 
          width: '300px', 
          height: '250px' 
        }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense publisher ID
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSenseAd;
