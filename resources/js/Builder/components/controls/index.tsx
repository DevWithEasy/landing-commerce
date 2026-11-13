import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    ChevronDown,
    ChevronUp,
    Info,
    Link2,
    Link2Off,
    Monitor,
    Smartphone,
    Tablet,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';

/* -------------------------------------------------------------------------
 | Shared compact control primitives
 |-------------------------------------------------------------------------
 | These controls intentionally mirror Elementor's compact inspector language:
 | small labels, 28px rows, inline steppers, and collapsible sections. They are
 | presentation-only and never render merchant-provided HTML or CSS.
 */

const DIMENSION_PATTERN = /^(-?(?:\d+\.?\d*|\.\d+))\s*([a-zA-Z%]*)$/;

function parseDimension(
    raw: string | undefined,
    defaultUnit: string
): { number: string; unit: string } {
    const text = (raw ?? '').trim();

    if (text === '') {
        return { number: '', unit: defaultUnit };
    }

    const match = text.match(DIMENSION_PATTERN);

    if (!match) {
        return { number: text, unit: defaultUnit };
    }

    return {
        number: match[1],
        unit: match[2] || defaultUnit,
    };
}

function formatStep(value: number): string {
    return String(Math.round(value * 1000) / 1000);
}

export interface NumberUnitInputProps {
    value?: string;
    onChange: (value: string) => void;
    units?: string[];
    /** Force a unit and hide the unit picker. Pass null for unitless values. */
    unit?: string | null;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    disabled?: boolean;
    ariaLabel?: string;
    showUnitLabel?: boolean;
    className?: string;
}

export function NumberUnitInput({
    value,
    onChange,
    units = ['px'],
    unit: forcedUnit,
    min,
    max,
    step = 1,
    placeholder,
    disabled = false,
    ariaLabel,
    showUnitLabel = true,
    className = '',
}: NumberUnitInputProps) {
    const defaultUnit = forcedUnit === null ? '' : forcedUnit || units[0] || 'px';
    const [number, setNumber] = useState(() => parseDimension(value, defaultUnit).number);
    const [unit, setUnit] = useState(() => parseDimension(value, defaultUnit).unit);

    useEffect(() => {
        const trimmed = (value ?? '').trim();

        if (trimmed === '') {
            setNumber('');
            return;
        }

        const parsed = parseDimension(trimmed, defaultUnit);
        setNumber(parsed.number);
        setUnit(parsed.unit);
    }, [value, defaultUnit]);

    const commit = (nextNumber: string, nextUnit: string) => {
        const trimmed = nextNumber.trim();

        if (trimmed === '') {
            onChange('');
            return;
        }

        // Allow intermediate states while the merchant is typing a decimal.
        if (trimmed === '-' || trimmed === '.' || trimmed === '-.') {
            return;
        }

        onChange(`${trimmed}${nextUnit}`);
    };

    const handleNumberChange = (next: string) => {
        if (!/^-?(?:\d+\.?\d*|\.\d*)?$/.test(next)) {
            return;
        }

        setNumber(next);
        commit(next, unit);
    };

    const handleStep = (direction: 1 | -1) => {
        if (disabled) return;

        const current = Number.parseFloat(number);
        let next = (Number.isFinite(current) ? current : 0) + direction * step;

        if (min !== undefined) next = Math.max(min, next);
        if (max !== undefined) next = Math.min(max, next);

        const text = formatStep(next);
        setNumber(text);
        onChange(`${text}${unit}`);
    };

    const handleUnitChange = (nextUnit: string) => {
        setUnit(nextUnit);
        commit(number, nextUnit);
    };

    return (
        <div
            className={`flex h-8 items-stretch overflow-hidden rounded-md border border-gray-300 bg-white transition focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 ${
                disabled ? 'opacity-50' : ''
            } ${className}`}
        >
            <input
                type="text"
                inputMode="decimal"
                value={number}
                disabled={disabled}
                aria-label={ariaLabel}
                placeholder={placeholder}
                onChange={(event) => handleNumberChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        handleStep(1);
                    }
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        handleStep(-1);
                    }
                }}
                className="min-w-0 flex-1 border-0 bg-transparent px-2 py-0 text-left font-mono text-xs text-gray-800 outline-none placeholder:text-gray-300"
            />

            {forcedUnit !== null && showUnitLabel && units.length <= 1 && (
                <span className="flex shrink-0 items-center justify-center border-l border-gray-100 bg-gray-50/70 px-1.5 text-[9.5px] font-semibold uppercase text-gray-400">
                    {unit}
                </span>
            )}

            {forcedUnit !== null && showUnitLabel && units.length > 1 && (
                <select
                    value={unit}
                    disabled={disabled}
                    aria-label={ariaLabel ? `${ariaLabel} unit` : 'Unit'}
                    onChange={(event) => handleUnitChange(event.target.value)}
                    className="h-full shrink-0 cursor-pointer border-0 border-l border-gray-200 bg-gray-50/70 pl-1.5 pr-5 py-0 text-left text-[10px] font-semibold text-gray-500 outline-none"
                >
                    {units.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            )}

            <div className="flex w-5 shrink-0 flex-col border-l border-gray-200 bg-gray-50/60">
                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={() => handleStep(1)}
                    title="Increase"
                    aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase value'}
                    className="flex flex-1 items-center justify-center text-gray-400 transition hover:bg-gray-200/70 hover:text-gray-800 disabled:cursor-not-allowed"
                >
                    <ChevronUp className="h-2.5 w-2.5" />
                </button>
                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    onClick={() => handleStep(-1)}
                    title="Decrease"
                    aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease value'}
                    className="flex flex-1 items-center justify-center border-t border-gray-200 text-gray-400 transition hover:bg-gray-200/70 hover:text-gray-800 disabled:cursor-not-allowed"
                >
                    <ChevronDown className="h-2.5 w-2.5" />
                </button>
            </div>
        </div>
    );
}

export interface NumberUnitControlProps extends Omit<NumberUnitInputProps, 'ariaLabel' | 'className'> {
    label: string;
    hint?: string;
    className?: string;
}

export function NumberUnitControl({ label, hint, className = '', ...inputProps }: NumberUnitControlProps) {
    return (
        <div className={className}>
            <ControlLabel label={label} hint={hint} />
            <NumberUnitInput {...inputProps} ariaLabel={label} />
            {hint && <ControlHint>{hint}</ControlHint>}
        </div>
    );
}

export interface ColorControlProps {
    label: string;
    value?: string;
    fallback?: string;
    onChange: (value: string) => void;
    hint?: string;
    presets?: string[];
}

export function ColorControl({
    label,
    value = '',
    fallback = '#000000',
    onChange,
    hint,
    presets = [],
}: ColorControlProps) {
    const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;

    return (
        <div>
            <ControlLabel label={label} hint={hint} />
            <div className="flex h-7 items-center space-x-1.5">
                <label
                    className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-gray-300 shadow-inner"
                    style={{ backgroundColor: pickerValue }}
                    title={label}
                >
                    <input
                        type="color"
                        value={pickerValue}
                        onChange={(event) => onChange(event.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={label}
                    />
                </label>
                <input
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={fallback}
                    className="h-7 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-2 font-mono text-[10.5px] text-gray-800 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
            </div>
            {presets.length > 0 && (
                <div className="mt-1 flex items-center gap-1">
                    {presets.map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            title={preset}
                            onClick={() => onChange(preset)}
                            style={{ backgroundColor: preset }}
                            className={`h-4 w-4 rounded-full border border-gray-300 transition hover:scale-110 ${
                                value === preset ? 'ring-2 ring-primary-500 ring-offset-1' : ''
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export interface SelectOption {
    label: string;
    value: string;
}

export interface SelectControlProps {
    label: string;
    value?: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    hint?: string;
}

export function SelectControl({ label, value = '', options, onChange, hint }: SelectControlProps) {
    return (
        <div>
            <ControlLabel label={label} hint={hint} />
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-8 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-2 py-0 text-xs leading-normal text-gray-800 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {hint && <ControlHint>{hint}</ControlHint>}
        </div>
    );
}

export interface TextControlProps {
    label?: string;
    value?: string;
    placeholder?: string;
    onChange: (value: string) => void;
    hint?: string;
    type?: 'text' | 'url' | 'email';
}

export function TextControl({
    label,
    value = '',
    placeholder,
    onChange,
    hint,
    type = 'text',
}: TextControlProps) {
    return (
        <div>
            {label && <ControlLabel label={label} hint={hint} />}
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="h-7 w-full rounded-md border border-gray-300 bg-white px-2 text-[11px] text-gray-800 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {hint && <ControlHint>{hint}</ControlHint>}
        </div>
    );
}

export interface TextareaControlProps {
    label?: string;
    value?: string;
    placeholder?: string;
    onChange: (value: string) => void;
    hint?: string;
    rows?: number;
}

export function TextareaControl({
    label,
    value = '',
    placeholder,
    onChange,
    hint,
    rows = 2,
}: TextareaControlProps) {
    return (
        <div>
            {label && <ControlLabel label={label} hint={hint} />}
            <textarea
                rows={rows}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="w-full resize-y rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] leading-snug text-gray-800 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {hint && <ControlHint>{hint}</ControlHint>}
        </div>
    );
}

export interface ToggleControlProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    hint?: string;
}

export function ToggleControl({ label, checked, onChange, hint }: ToggleControlProps) {
    return (
        <div>
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 transition hover:border-gray-300">
                <span className="min-w-0 truncate text-[10.5px] font-medium text-gray-700">{label}</span>
                <span className="relative inline-flex h-4 w-7 shrink-0 items-center">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => onChange(event.target.checked)}
                        className="peer sr-only"
                    />
                    <span className="absolute inset-0 rounded-full bg-gray-200 transition peer-checked:bg-primary-600" />
                    <span className="absolute left-0.5 h-3 w-3 rounded-full bg-white shadow transition peer-checked:translate-x-3" />
                </span>
            </label>
            {hint && <ControlHint>{hint}</ControlHint>}
        </div>
    );
}

export interface AlignmentControlProps {
    label?: string;
    value?: string;
    onChange: (value: string) => void;
}

const ALIGNMENT_OPTIONS = [
    { value: 'left', label: 'Left', icon: AlignLeft },
    { value: 'center', label: 'Center', icon: AlignCenter },
    { value: 'right', label: 'Right', icon: AlignRight },
    { value: 'justify', label: 'Justify', icon: AlignJustify },
];

export function AlignmentControl({ label, value = 'left', onChange }: AlignmentControlProps) {
    return (
        <div className="flex items-center justify-between gap-2">
            {label && (
                <span className="truncate text-[11px] font-medium text-gray-700">{label}</span>
            )}
            <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-gray-300 bg-white">
                {ALIGNMENT_OPTIONS.map((option, idx) => {
                    const Icon = option.icon;
                    const active = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            title={option.label}
                            aria-label={option.label}
                            aria-pressed={active}
                            onClick={() => onChange(option.value)}
                            className={`flex h-7 w-8 items-center justify-center transition ${
                                idx > 0 ? 'border-l border-gray-200' : ''
                            } ${
                                active
                                    ? 'bg-gray-200/80 text-gray-900'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export interface ControlSectionProps {
    title: string;
    icon?: LucideIcon;
    description?: string;
    defaultOpen?: boolean;
    children: ReactNode;
    action?: ReactNode;
}

export function ControlSection({
    title,
    icon: Icon,
    description,
    defaultOpen = false,
    children,
    action,
}: ControlSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentId = useId();

    return (
        <div className="border-b border-gray-200 bg-white">
            <div className="flex items-center">
                <button
                    type="button"
                    onClick={() => setIsOpen((current) => !current)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-between px-3 py-2.5 text-left transition hover:bg-gray-50"
                >
                    <span className="flex min-w-0 items-center space-x-2">
                        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />}
                        <span className="min-w-0">
                            <span className="block truncate text-[11.5px] font-bold text-gray-800">
                                {title}
                            </span>
                            {description && isOpen && (
                                <span className="mt-0.5 block truncate text-[9.5px] font-normal text-gray-400">
                                    {description}
                                </span>
                            )}
                        </span>
                    </span>
                    {isOpen ? (
                        <ChevronUp className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                    )}
                </button>
                {action && <div className="pr-2">{action}</div>}
            </div>

            {isOpen && (
                <div id={contentId} className="space-y-2.5 px-3 pb-3 pt-1">
                    {children}
                </div>
            )}
        </div>
    );
}

export interface SliderControlProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string | null;
    units?: string[];
    placeholder?: string;
    hint?: string;
}

export function SliderControl({
    label,
    value = '',
    onChange,
    min = 0,
    max = 100,
    step = 1,
    unit = 'px',
    units,
    placeholder,
    hint,
}: SliderControlProps) {
    const defaultUnit = unit === null ? '' : unit || units?.[0] || 'px';
    const parsed = parseDimension(value, defaultUnit);
    const numericValue = Number.parseFloat(parsed.number);
    const sliderValue = Number.isFinite(numericValue)
        ? Math.min(max, Math.max(min, numericValue))
        : min;

    return (
        <div>
            <ControlLabel label={label} hint={hint} />
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={sliderValue}
                    onChange={(event) => {
                        const nextUnit = parsed.unit || defaultUnit;
                        onChange(`${event.target.value}${nextUnit}`);
                    }}
                    aria-label={`${label} slider`}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary-600"
                />
                <NumberUnitInput
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    step={step}
                    unit={units ? undefined : unit}
                    units={units || (unit ? [unit] : ['px'])}
                    placeholder={placeholder}
                    ariaLabel={label}
                    className="w-24 shrink-0"
                />
            </div>
            {hint && <ControlHint>{hint}</ControlHint>}
        </div>
    );
}

export interface ResponsiveDeviceBarProps {
    viewport: 'desktop' | 'tablet' | 'mobile';
    onChange: (viewport: 'desktop' | 'tablet' | 'mobile') => void;
    label?: string;
}

export function ResponsiveDeviceBar({
    viewport,
    onChange,
    label = 'Editing for',
}: ResponsiveDeviceBarProps) {
    const devices: Array<{
        id: 'desktop' | 'tablet' | 'mobile';
        label: string;
        icon: LucideIcon;
    }> = [
        { id: 'desktop', label: 'Desktop', icon: Monitor },
        { id: 'tablet', label: 'Tablet', icon: Tablet },
        { id: 'mobile', label: 'Mobile', icon: Smartphone },
    ];

    return (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1.5">
            <div className="min-w-0">
                <span className="block text-[10.5px] font-bold text-indigo-950 capitalize">
                    {label}: {viewport}
                </span>
                <span className="block text-[9.5px] text-indigo-700/90">
                    {viewport === 'desktop'
                        ? 'Base styles (all devices)'
                        : `${viewport} override only`}
                </span>
            </div>
            <div className="flex items-center gap-0.5 rounded-md border border-indigo-200 bg-white p-0.5 shrink-0">
                {devices.map((device) => {
                    const Icon = device.icon;
                    const active = viewport === device.id;
                    return (
                        <button
                            key={device.id}
                            type="button"
                            onClick={() => onChange(device.id)}
                            title={`${device.label} view`}
                            aria-label={`${device.label} view`}
                            aria-pressed={active}
                            className={`flex h-6 w-6 items-center justify-center rounded transition ${
                                active
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-gray-400 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export interface SpacingControlProps {
    label: string;
    values: [string, string, string, string];
    onChange: (values: [string, string, string, string]) => void;
    unit?: string;
    units?: string[];
    step?: number;
    hint?: string;
    sides?: readonly [string, string, string, string];
    defaultLinked?: boolean;
}

const SPACING_LABELS = ['Top', 'Right', 'Bottom', 'Left'] as const;

export function SpacingControl({
    label,
    values,
    onChange,
    unit: initialUnit = 'px',
    units = ['px', 'rem', '%'],
    step = 1,
    hint,
    sides = SPACING_LABELS,
    defaultLinked = false,
}: SpacingControlProps) {
    const [linked, setLinked] = useState(defaultLinked);
    const [activeUnit, setActiveUnit] = useState(initialUnit);

    const update = (index: number, rawNumber: string) => {
        const formatted = rawNumber.trim() === '' ? '' : `${rawNumber.trim()}${activeUnit}`;
        if (linked) {
            onChange([formatted, formatted, formatted, formatted]);
            return;
        }

        const next = [...values] as [string, string, string, string];
        next[index] = formatted;
        onChange(next);
    };

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-700">{label}</span>
                {units.length > 1 && (
                    <select
                        value={activeUnit}
                        aria-label={`${label} unit`}
                        onChange={(event) => setActiveUnit(event.target.value)}
                        className="h-5 cursor-pointer border-0 bg-transparent px-1 py-0 text-[10px] font-semibold text-gray-500 outline-none hover:text-gray-800 focus:ring-0"
                    >
                        {units.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="flex items-stretch">
                {sides.map((side, index) => {
                    const parsed = parseDimension(values[index], activeUnit);
                    return (
                        <div key={side} className="flex min-w-0 flex-1 flex-col items-center">
                            <input
                                type="number"
                                step={step}
                                value={parsed.number}
                                placeholder="0"
                                aria-label={`${label} ${side}`}
                                onChange={(event) => update(index, event.target.value)}
                                className={`h-8 w-full min-w-0 border border-gray-300 bg-white px-1 py-0 text-center text-xs text-gray-800 outline-none transition placeholder:text-gray-300 focus:z-10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
                                    index === 0 ? 'rounded-l-md' : '-ml-px'
                                }`}
                            />
                            <span className="mt-1 text-[9px] font-medium text-gray-400">
                                {side}
                            </span>
                        </div>
                    );
                })}
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => setLinked((current) => !current)}
                        title={linked ? 'Unlink values' : 'Link values together'}
                        aria-pressed={linked}
                        className={`-ml-px flex h-8 w-8 shrink-0 items-center justify-center rounded-r-md border border-gray-300 transition ${
                            linked
                                ? 'bg-gray-200 text-gray-900'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                        }`}
                    >
                        {linked ? <Link2 className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </div>
            {hint && <ControlHint>{hint}</ControlHint>}
        </div>
    );
}

const RADIUS_CORNER_LABELS = ['TL', 'TR', 'BR', 'BL'] as const;

function parseBorderRadiusParts(raw: string): [string, string, string, string] {
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return ['', '', '', ''];
    if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
    if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
    if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
    return [parts[0], parts[1], parts[2], parts[3]];
}

function serializeBorderRadiusParts(values: [string, string, string, string]): string {
    const normalized = values.map((v) => v.trim());
    if (normalized.every((v) => v === '')) return '';
    const filled = normalized.map((v) => v || '0px');
    if (filled.every((v) => v === filled[0])) return filled[0];
    return filled.join(' ');
}

export function BorderRadiusControl({
    label = 'Border Radius',
    value = '',
    onChange,
    hint,
}: {
    label?: string;
    value?: string;
    onChange: (value: string) => void;
    hint?: string;
}) {
    const parts = parseBorderRadiusParts(value);
    const allEqual = parts[0] === parts[1] && parts[1] === parts[2] && parts[2] === parts[3];

    return (
        <SpacingControl
            label={label}
            values={parts}
            sides={RADIUS_CORNER_LABELS}
            units={['px', '%']}
            defaultLinked={allEqual}
            hint={hint}
            onChange={(next) => onChange(serializeBorderRadiusParts(next))}
        />
    );
}

export function ControlGrid({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 }) {
    return (
        <div className={`grid gap-1.5 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>{children}</div>
    );
}

export function ControlLabel({ label, hint }: { label: string; hint?: string }) {
    return (
        <div className="mb-0.5 flex items-center justify-between">
            <span className="truncate text-[10px] font-semibold text-gray-600">{label}</span>
            {hint && (
                <span title={hint} className="ml-1 shrink-0 text-gray-300">
                    <Info className="h-3 w-3" />
                </span>
            )}
        </div>
    );
}

export function ControlHint({ children }: { children: ReactNode }) {
    return <p className="mt-0.5 text-[9px] leading-snug text-gray-400">{children}</p>;
}

export function SettingsNotice({
    tone = 'info',
    children,
}: {
    tone?: 'info' | 'warning';
    children: ReactNode;
}) {
    const classes =
        tone === 'warning'
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-indigo-200 bg-indigo-50/70 text-indigo-700';

    return (
        <div className={`flex items-start space-x-1.5 rounded-md border px-2 py-1.5 text-[9.5px] leading-relaxed ${classes}`}>
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{children}</span>
        </div>
    );
}
