import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox, RadioGroup, Switch } from '@/components/ui';

vi.mock('@/i18n/navigation', () => ({ Link: 'a' }));

describe('Checkbox', () => {
  it('toggles from its label', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="I agree" onChange={onChange} />);
    await userEvent.click(screen.getByText('I agree'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByRole('checkbox', { name: 'I agree' })).toBeChecked();
  });

  it('indeterminate sets the native property', () => {
    render(<Checkbox label="All" indeterminate readOnly />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).indeterminate).toBe(true);
  });

  it('links hint and error', () => {
    render(<Checkbox label="Terms" hint="Read them first" error="Required" />);
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});

describe('RadioGroup', () => {
  function Demo() {
    const [v, setV] = useState<'a' | 'b' | ''>('');
    return (
      <RadioGroup
        legend="Audience"
        value={v}
        onChange={setV}
        options={[
          { value: 'a', label: 'Members' },
          { value: 'b', label: 'Everyone', hint: 'Open to all' },
        ]}
      />
    );
  }

  it('is a fieldset with a legend and selects on click', async () => {
    render(<Demo />);
    expect(screen.getByRole('group', { name: 'Audience' })).toBeInTheDocument();
    await userEvent.click(screen.getByText('Everyone'));
    expect(screen.getByRole('radio', { name: /Everyone/ })).toBeChecked();
    expect(screen.getByText('Open to all')).toBeInTheDocument();
  });

  it('arrow keys move through the options', async () => {
    render(<Demo />);
    screen.getByRole('radio', { name: 'Members' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /Everyone/ })).toBeChecked();
  });
});

describe('Switch', () => {
  it('is a switch that reports its state', async () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Show my university" />);
    const sw = screen.getByRole('switch', { name: 'Show my university' });
    expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('disabled cannot be toggled', async () => {
    const onChange = vi.fn();
    render(<Switch checked onChange={onChange} label="x" disabled />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
