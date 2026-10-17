import { render, screen } from '@testing-library/react';
import { MotionConfigContext } from 'motion/react';
import { useContext } from 'react';
import { describe, expect, it } from 'vitest';
import { MotionProvider } from '@/components/motion/MotionProvider';

function Probe() {
  const cfg = useContext(MotionConfigContext);
  return <p data-testid="mode">{String(cfg.reducedMotion)}</p>;
}

describe('MotionProvider', () => {
  it('makes every animation follow the user setting and renders its children at once', () => {
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('user');
  });

  it('accepts the max feature set for islands that drag or animate layout', () => {
    render(
      <MotionProvider features="max">
        <Probe />
      </MotionProvider>,
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('user');
  });
});
