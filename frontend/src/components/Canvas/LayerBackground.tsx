import React from 'react';
import type { LayerType } from '../../types/index.js';
import { LAYER_LABELS, LAYER_COLORS } from '../../utils/nodeUtils.js';

interface LayerBand {
  layer: LayerType;
  minY: number;
  maxY: number;
}

interface LayerBackgroundProps {
  bands: LayerBand[];
}

const LayerBackground: React.FC<LayerBackgroundProps> = ({ bands }) => {
  if (!bands.length) return null;

  return (
    <>
      {bands.map((band) => (
        <div
          key={band.layer}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: band.minY - 60,
            height: band.maxY - band.minY + 160,
            background: LAYER_COLORS[band.layer],
            borderTop: `1px dashed rgba(148,163,184,0.15)`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '16px',
              top: '8px',
              fontSize: '11px',
              color: 'rgba(148,163,184,0.5)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              userSelect: 'none',
            }}
          >
            {LAYER_LABELS[band.layer]}
          </div>
        </div>
      ))}
    </>
  );
};

export default LayerBackground;
