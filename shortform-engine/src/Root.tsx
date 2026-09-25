import React from 'react';
import {Composition} from 'remotion';
import {AIWorkforce20} from './compositions/AIWorkforce20';
import {shortformSchema} from './contracts';
import goldCase from '../gold-cases/ai-workforce/short-20.json';

const contract = shortformSchema.parse(goldCase);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AIWorkforce20"
    component={AIWorkforce20}
    durationInFrames={contract.variant.targetDuration * contract.output.fps}
    fps={contract.output.fps}
    width={contract.output.width}
    height={contract.output.height}
    defaultProps={{contract}}
  />
);
