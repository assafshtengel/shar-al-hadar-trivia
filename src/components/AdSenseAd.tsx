
import React, { useEffect } from 'react';

interface AdSenseAdProps {
  className?: string;
  slot?: string;
  format?: 'auto' | 'fluid';
  layout?: string;
  style?: React.CSSProperties;
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({ 
  className = '',
  slot = '1234567890', // Replace with your actual AdSense slot ID
  format = 'auto',
  layout,
  style 
}) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      {/* AdSense Ad */}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          textAlign: 'center',
          ...style
        }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense publisher ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(layout && { 'data-ad-layout': layout })}
      />
      
      {/* Fallback content when ads are not loaded */}
      <div className="ad-placeholder text-center p-4 text-sm text-gray-500">
        מקום פרסומת
      </div>
    </div>
  );
};

export default AdSenseAd;
