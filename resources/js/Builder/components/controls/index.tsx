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
    Minus,
    Plus,
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
            className={`flex h-7 items-stretch overflow-hidden rounded-md border border-gray-300 bg-white transition focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 ${
                disabled ? 'opacity-50' : ''
            } ${className}`}
        >
            <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={() => handleStep(-1)}
                title="Decrease"
                aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease value'}
                className="flex w-6 shrink-0 items-center justify-center border-r border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed"
            >
                <Minus className="h-3 w-3" />
            </button>

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
                className="min-w-0 flex-1 border-0 bg-transparent px-1.5 text-center font-mono text-[11px] text-gray-800 outline-none placeholder:text-gray-300"
            />

            {forcedUnit !== null && showUnitLabel && units.length <= 1 && (
                <span className="flex w-6 shrink-0 items-center justify-center border-l border-gray-100 bg-gray-50/70 text-[9px] font-semibold uppercase text-gray-400">
                    {unit}
                </span>
            )}

            {forcedUnit !== null && showUnitLabel && units.length > 1 && (
                <select
                    value={unit}
                    disabled={disabled}
                    aria-label={ariaLabel ? `${ariaLabel} unit` : 'Unit'}
                    onChange={(event) => handleUnitChange(event.target.value)}
                    className="h-full w-[46px] shrink-0 cursor-pointer border-0 border-l border-gray-200 bg-gray-50/70 px-0.5 text-center text-[10px] font-semibold text-gray-500 outline-none"
                >
                    {units.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            )}

            <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                onClick={() => handleStep(1)}
                title="Increase"
                aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase value'}
                className="flex w-6 shrink-0 items-center justify-center border-l border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed"
            >
                <Plus className="h-3 w-3" />
            </button>
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
                className="h-7 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-1.5 text-[11px] text-gray-800 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
        <div>
            {label && <ControlLabel label={label} />}
            <div className="grid grid-cols-4 gap-0.5 rounded-md bg-gray-100 p-0.5">
                {ALIGNMENT_OPTIONS.map((option) => {
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
                            className={`flex h-6 items-center justify-center rounded transition ${
                                active
                                    ? 'bg-white text-primary-700 shadow-xs'
                                    : 'text-gray-400 hover:text-gray-700'
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
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center bg-gray-50/80">
                <button
                    type="button"
                    onClick={() => setIsOpen((current) => !current)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-between px-2.5 py-2 text-left transition hover:bg-gray-100/70"
                >
                    <span className="flex min-w-0 items-center space-x-1.5">
                        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-primary-600" />}
                        <span className="min-w-0">
                            <span className="block truncate text-[10.5px] font-bold text-gray-800">
                                {title}
                            </span>
                            {description && isOpen && (
                                <span className="mt-0.5 block truncate text-[9px] font-normal text-gray-400">
                                    {description}
                                </span>
                            )}
                        </span>
                    </span>
                    {isOpen ? (
                        <ChevronUp className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    )}
                </button>
                {action && <div className="pr-1.5">{action}</div>}
            </div>

            {isOpen && (
                <div id={contentId} className="space-y-2 p-2.5">
                    {children}
                </div>
            )}
        </div>
    );
}

export interface SpacingControlProps {
    label: string;
    values: [string, string, string, string];
    onChange: (values: [string, string, string, string]) => void;
    unit?: string;
    step?: number;
    hint?: string;
}

const SPACING_LABELS = ['Top', 'Right', 'Bottom', 'Left'] as const;

export function SpacingControl({
    label,
    values,
    onChange,
    unit = 'px',
    step = 1,
    hint,
}: SpacingControlProps) {
    const [linked, setLinked] = useState(false);

    const update = (index: number, value: string) => {
        if (linked) {
            onChange([value, value, value, value]);
            return;
        }

        const next = [...values] as [string, string, string, string];
        next[index] = value;
        onChange(next);
    };

    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-600">
                    {label}
                    {unit && <span className="ml-1 font-mono text-[9px] text-gray-400">({unit})</span>}
                </span>
                <button
                    type="button"
                    onClick={() => setLinked((current) => !current)}
                    title={linked ? 'Unlink sides' : 'Link all sides'}
                    aria-pressed={linked}
                    className={`flex h-5 w-5 items-center justify-center rounded transition ${
                        linked
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                >
                    {linked ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
                {SPACING_LABELS.map((side, index) => (
                    <div key={side} className="flex items-center space-x-1">
                        <span className="w-2.5 shrink-0 text-[8px] font-bold uppercase text-gray-400">
                            {side.charAt(0)}
                        </span>
                        <NumberUnitInput
                            value={values[index]}
                            onChange={(value) => update(index, value)}
                            units={[unit]}
                            unit={unit}
                            step={step}
                            ariaLabel={`${label} ${side}`}
                            showUnitLabel={false}
                            className="flex-1"
                        />
                    </div>
                ))}
            </div>
            {hint && <ControlHint>{hint}</ControlHint>}
        </div>
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
