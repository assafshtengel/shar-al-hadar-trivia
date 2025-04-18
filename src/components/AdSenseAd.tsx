
import React from 'react';

interface AdSenseAdProps {
  className?: string;
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle';
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({ className = '', adSlot, adFormat = 'auto' }) => {
  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense publisher ID
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSenseAd;

