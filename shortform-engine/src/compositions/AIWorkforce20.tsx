import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import type {ShortformProject, ShortformScene} from '../contracts';

const COLORS = {
  navy: '#061221',
  navy2: '#0B1D32',
  blue: '#35A7FF',
  blueSoft: '#7DCBFF',
  white: '#F8FBFF',
  muted: '#9CB2C8',
  line: 'rgba(125, 203, 255, 0.22)'
};

const FONT = '"Noto Sans KR", Arial, sans-serif';

const Grid: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage:
        'linear-gradient(rgba(125,203,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(125,203,255,.055) 1px, transparent 1px)',
      backgroundSize: '72px 72px',
      maskImage: 'linear-gradient(to bottom, rgba(0,0,0,.9), transparent 84%)'
    }}
  />
);

const Nodes: React.FC<{mode: 'agent' | 'workforce'}> = ({mode}) => {
  const frame = useCurrentFrame();
  const nodes = mode === 'agent'
    ? ['GOAL', 'PLAN', 'TOOL']
    : ['HUMAN', 'AGENT', 'RPA'];

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 72}}>
      {nodes.map((node, index) => (
        <React.Fragment key={node}>
          <div
            style={{
              width: 210,
              height: 112,
              borderRadius: 56,
              border: '2px solid ' + (index === 1 ? COLORS.blue : COLORS.line),
              background: index === 1
                ? 'rgba(53,167,255,.14)'
                : 'rgba(255,255,255,.035)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: index === 1 ? COLORS.white : COLORS.blueSoft,
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 2,
              transform: 'translateY(' + (Math.sin((frame + index * 18) / 18) * 5) + 'px)'
            }}
          >
            {node}
          </div>
          {index < nodes.length - 1 && (
            <div
              style={{
                height: 2,
                width: 66,
                background: 'linear-gradient(90deg, ' + COLORS.line + ', ' + COLORS.blue + ')'
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const SceneCard: React.FC<{scene: ShortformScene; index: number}> = ({scene, index}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const enter = spring({
    fps,
    frame,
    config: {damping: 18, stiffness: 110, mass: 0.9}
  });
  const opacity = interpolate(
    frame,
    [0, 7, Math.max(8, durationInFrames - 10), durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );
  const y = interpolate(enter, [0, 1], [55, 0]);
  const isBrand = scene.type === 'brand-end';

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        opacity,
        padding: '190px 92px 150px',
        justifyContent: isBrand ? 'center' : 'flex-start'
      }}
    >
      {!isBrand && (
        <div style={{fontSize: 26, color: COLORS.blueSoft, fontWeight: 800, letterSpacing: 4}}>
          JOYLAB · AI WORKFORCE · {String(index + 1).padStart(2, '0')}
        </div>
      )}

      <div
        style={{
          marginTop: isBrand ? 0 : 94,
          transform: 'translateY(' + y + 'px) scale(' + (0.96 + enter * 0.04) + ')',
          transformOrigin: 'left center'
        }}
      >
        <div
          style={{
            color: scene.type === 'comparison' ? COLORS.blue : COLORS.white,
            fontSize: isBrand ? 82 : 92,
            lineHeight: 1.06,
            fontWeight: 900,
            letterSpacing: -3,
            maxWidth: 900,
            whiteSpace: 'pre-line'
          }}
        >
          {scene.headline}
        </div>

        {scene.subtext && (
          <div
            style={{
              marginTop: 34,
              color: COLORS.muted,
              fontSize: 39,
              lineHeight: 1.4,
              fontWeight: 650,
              whiteSpace: 'pre-line'
            }}
          >
            {scene.subtext}
          </div>
        )}

        {scene.type === 'node-network' && <Nodes mode="agent" />}
        {scene.type === 'workflow' && <Nodes mode="workforce" />}

        {scene.type === 'comparison' && (
          <div
            style={{
              marginTop: 86,
              height: 8,
              width: Math.min(620, 260 + frame * 8),
              borderRadius: 99,
              background: 'linear-gradient(90deg, ' + COLORS.blue + ', rgba(53,167,255,0))'
            }}
          />
        )}

        {isBrand && (
          <>
            <div style={{marginTop: 44, width: 92, height: 8, borderRadius: 8, background: COLORS.blue}} />
            <div
              style={{
                marginTop: 52,
                color: COLORS.blueSoft,
                fontSize: 34,
                lineHeight: 1.45,
                fontWeight: 700
              }}
            >
              생각을 분석하고, 분석을 실행으로.
            </div>
          </>
        )}
      </div>

      {!isBrand && (
        <div
          style={{
            position: 'absolute',
            left: 92,
            right: 92,
            bottom: 156,
            paddingTop: 26,
            borderTop: '1px solid ' + COLORS.line,
            color: 'rgba(248,251,255,.72)',
            fontSize: 30,
            lineHeight: 1.45,
            fontWeight: 600
          }}
        >
          {scene.narration}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const AIWorkforce20: React.FC<{contract: ShortformProject}> = ({contract}) => {
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 75% 18%, rgba(53,167,255,.19), transparent 30%), linear-gradient(180deg, ' +
          COLORS.navy2 + ' 0%, ' + COLORS.navy + ' 100%)',
        color: COLORS.white,
        overflow: 'hidden'
      }}
    >
      <Grid />

      <div
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          right: -250,
          top: 600,
          border: '1px solid rgba(53,167,255,.16)',
          boxShadow: '0 0 180px rgba(53,167,255,.08)'
        }}
      />

      {contract.scenes.map((scene, index) => {
        const from = Math.round(scene.start * fps);
        const duration = Math.max(1, Math.round((scene.end - scene.start) * fps));
        return (
          <Sequence key={scene.id} from={from} durationInFrames={duration}>
            <SceneCard scene={scene} index={index} />
          </Sequence>
        );
      })}

      <div
        style={{
          fontFamily: FONT,
          position: 'absolute',
          top: 64,
          right: 72,
          color: COLORS.white,
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 6,
          opacity: 0.86
        }}
      >
        JOYLAB
      </div>
    </AbsoluteFill>
  );
};
