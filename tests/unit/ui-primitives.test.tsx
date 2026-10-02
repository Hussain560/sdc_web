import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert, Button, Field } from '@/components/ui';

describe('ui primitives', () => {
  it('Button with a disabledReason is disabled and explains why', () => {
    render(<Button disabledReason="Registration closed">Register</Button>);
    const btn = screen.getByRole('button', { name: 'Register' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Registration closed');
  });

  it('Button in loading state is busy and disabled', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('Field links label, hint and error for assistive tech', () => {
    render(<Field label="Email" hint="Use your university email" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toMatch(/hint.*error/);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('Alert danger is announced as an alert', () => {
    render(<Alert tone="danger">Failed</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
