/**
 * EditableField Component Tests
 * Click-to-edit inline field for the Preview page
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableField } from '@/components/preview/EditableField';

describe('EditableField', () => {
  describe('Read mode', () => {
    it('should render the value inside the specified tag', () => {
      const { container } = render(
        <EditableField tag="h1" value="John Doe" onSave={vi.fn()} />
      );
      const el = container.querySelector('h1');
      expect(el).toBeTruthy();
      expect(el!.textContent).toBe('John Doe');
    });

    it('should render a span tag when tag="span"', () => {
      const { container } = render(
        <EditableField tag="span" value="test@email.com" onSave={vi.fn()} />
      );
      const el = container.querySelector('span');
      expect(el).toBeTruthy();
      expect(el!.textContent).toBe('test@email.com');
    });

    it('should render a p tag when tag="p"', () => {
      const { container } = render(
        <EditableField tag="p" value="Paragraph text" onSave={vi.fn()} />
      );
      const el = container.querySelector('p');
      expect(el).toBeTruthy();
      expect(el!.textContent).toBe('Paragraph text');
    });

    it('should apply the provided className', () => {
      const { container } = render(
        <EditableField tag="p" value="test" className="font-bold text-lg" onSave={vi.fn()} />
      );
      const el = container.querySelector('p');
      expect(el!.className).toContain('font-bold');
      expect(el!.className).toContain('text-lg');
    });

    it('should show cursor-text styling for editability hint', () => {
      const { container } = render(
        <EditableField tag="p" value="test" onSave={vi.fn()} />
      );
      const el = container.querySelector('p');
      expect(el!.className).toContain('cursor-text');
    });

    it('should render empty string when value is empty', () => {
      const { container } = render(
        <EditableField tag="span" value="" onSave={vi.fn()} />
      );
      const el = container.querySelector('span');
      expect(el).toBeTruthy();
      // Empty span should still render with a non-breaking space or similar for clickability
    });
  });

  describe('Edit mode activation', () => {
    it('should switch to input on click', async () => {
      const { container } = render(
        <EditableField tag="p" value="Click me" onSave={vi.fn()} />
      );
      const p = container.querySelector('p')!;
      fireEvent.click(p);

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input!.value).toBe('Click me');
    });

    it('should switch to textarea when multiline=true', async () => {
      const multilineValue = 'Line 1\nLine 2';
      const { container } = render(
        <EditableField tag="p" value={multilineValue} multiline onSave={vi.fn()} />
      );
      const p = container.querySelector('p')!;
      fireEvent.click(p);

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(textarea!.value).toBe('Line 1\nLine 2');
    });

    it('should auto-focus the input on activation', () => {
      const { container } = render(
        <EditableField tag="p" value="focus me" onSave={vi.fn()} />
      );
      fireEvent.click(container.querySelector('p')!);

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(document.activeElement).toBe(input);
    });

    it('should not switch to edit mode when disabled', () => {
      const { container } = render(
        <EditableField tag="p" value="Disabled" disabled onSave={vi.fn()} />
      );
      fireEvent.click(container.querySelector('p')!);

      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('p')).toBeTruthy();
    });
  });

  describe('Saving', () => {
    it('should call onSave with new value on blur', async () => {
      const onSave = vi.fn();
      const { container } = render(
        <EditableField tag="p" value="old" onSave={onSave} />
      );
      fireEvent.click(container.querySelector('p')!);

      const input = container.querySelector('input')!;
      fireEvent.change(input, { target: { value: 'new' } });
      fireEvent.blur(input);

      expect(onSave).toHaveBeenCalledWith('new');
    });

    it('should call onSave on Enter key for single-line input', async () => {
      const onSave = vi.fn();
      const { container } = render(
        <EditableField tag="p" value="old" onSave={onSave} />
      );
      fireEvent.click(container.querySelector('p')!);

      const input = container.querySelector('input')!;
      fireEvent.change(input, { target: { value: 'updated' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSave).toHaveBeenCalledWith('updated');
    });

    it('should NOT call onSave on Enter for multiline textarea', async () => {
      const onSave = vi.fn();
      const { container } = render(
        <EditableField tag="p" value="line1" multiline onSave={onSave} />
      );
      fireEvent.click(container.querySelector('p')!);

      const textarea = container.querySelector('textarea')!;
      fireEvent.change(textarea, { target: { value: 'line1\nline2' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should return to read mode after save', async () => {
      const { container } = render(
        <EditableField tag="p" value="text" onSave={vi.fn()} />
      );
      fireEvent.click(container.querySelector('p')!);
      const input = container.querySelector('input')!;
      fireEvent.blur(input);

      // Should be back in read mode
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('p')).toBeTruthy();
    });

    it('should display the new value after save', async () => {
      const onSave = vi.fn();
      const { container, rerender } = render(
        <EditableField tag="p" value="old" onSave={onSave} />
      );
      fireEvent.click(container.querySelector('p')!);

      const input = container.querySelector('input')!;
      fireEvent.change(input, { target: { value: 'new value' } });
      fireEvent.blur(input);

      // Parent re-renders with new value
      rerender(<EditableField tag="p" value="new value" onSave={onSave} />);
      expect(container.querySelector('p')!.textContent).toBe('new value');
    });

    it('should not call onSave when value has not changed', async () => {
      const onSave = vi.fn();
      const { container } = render(
        <EditableField tag="p" value="same" onSave={onSave} />
      );
      fireEvent.click(container.querySelector('p')!);
      const input = container.querySelector('input')!;
      // Don't change the value, just blur
      fireEvent.blur(input);

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Cancelling', () => {
    it('should revert to original value on Escape', async () => {
      const onSave = vi.fn();
      const { container } = render(
        <EditableField tag="p" value="original" onSave={onSave} />
      );
      fireEvent.click(container.querySelector('p')!);

      const input = container.querySelector('input')!;
      fireEvent.change(input, { target: { value: 'changed' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should be back in read mode with original value
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('p')!.textContent).toBe('original');
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should pass className to the input in edit mode', () => {
      const { container } = render(
        <EditableField tag="p" value="styled" className="text-xl font-bold" onSave={vi.fn()} />
      );
      fireEvent.click(container.querySelector('p')!);

      const input = container.querySelector('input')!;
      expect(input.className).toContain('text-xl');
      expect(input.className).toContain('font-bold');
    });
  });
});
