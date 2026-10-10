import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorSummary, Field, PasswordField, Select, Textarea } from '@/components/ui';

vi.mock('@/i18n/navigation', () => ({ Link: 'a' }));

describe('Field', () => {
  it('shows required as text after the label', () => {
    render(<Field label="Email" requiredLabel="required" />);
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('email, tel and url inputs are forced left-to-right', () => {
    render(
      <>
        <Field label="Mail" type="email" />
        <Field label="Phone" type="tel" />
        <Field label="Name" type="text" />
      </>,
    );
    expect(screen.getByLabelText(/Mail/)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByLabelText(/Phone/)).toHaveAttribute('dir', 'ltr');
    expect(screen.getByLabelText(/Name/)).not.toHaveAttribute('dir');
  });

  it('error keeps the hint and wires both ids', () => {
    render(<Field label="Phone" hint="05xxxxxxxx" error="Enter 10 digits" />);
    const input = screen.getByLabelText('Phone');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0]!)).toHaveTextContent('05xxxxxxxx');
    expect(document.getElementById(ids[1]!)).toHaveTextContent('Enter 10 digits');
  });

  it('success shows a status message', () => {
    render(<Field label="Handle" success="Available" />);
    expect(screen.getByRole('status')).toHaveTextContent('Available');
  });
});

describe('PasswordField', () => {
  it('toggles visibility with a pressed button and keeps the value', async () => {
    render(<PasswordField label="Password" showLabel="Show password" hideLabel="Hide password" />);
    const input = screen.getByLabelText('Password');
    await userEvent.type(input, 'abc');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('abc');
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('Select and Textarea', () => {
  it('Select keeps the label and error wiring', () => {
    render(
      <Select label="Track" error="Pick one">
        <option>A</option>
      </Select>,
    );
    expect(screen.getByLabelText('Track')).toHaveAttribute('aria-invalid', 'true');
  });

  it('Textarea shows a counter and starts at four rows', () => {
    render(<Textarea label="Bio" value="hello" maxLength={500} counter onChange={() => {}} />);
    expect(screen.getByText('5/500')).toBeInTheDocument();
    expect(screen.getByLabelText('Bio')).toHaveAttribute('rows', '4');
  });
});

describe('ErrorSummary', () => {
  it('lists each error as a link, takes focus, and clicking focuses the control', async () => {
    render(
      <>
        <ErrorSummary
          title="Fix 2 fields"
          errors={[
            { fieldId: 'a', message: 'Name is required' },
            { fieldId: 'b', message: 'Enter a valid e-mail' },
          ]}
        />
        <input id="a" aria-label="a" />
        <input id="b" aria-label="b" />
      </>,
    );
    expect(screen.getByRole('alert')).toHaveFocus();
    await userEvent.click(screen.getByRole('link', { name: 'Enter a valid e-mail' }));
    expect(screen.getByLabelText('b')).toHaveFocus();
  });

  it('renders nothing without errors', () => {
    const { container } = render(<ErrorSummary title="x" errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
