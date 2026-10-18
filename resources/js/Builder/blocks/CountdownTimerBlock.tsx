import { Flame } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { BlockStyles, CountdownTimerBlockProps } from '@/types/builder';

export interface CountdownTimerBlockComponentProps {
    props: CountdownTimerBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

export function CountdownTimerBlock({ props, styles = {} }: CountdownTimerBlockComponentProps) {
    const calculateTimeRemaining = useCallback((): TimeRemaining => {
        if (!props.targetDate) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false };
        }

        const difference = new Date(props.targetDate).getTime() - new Date().getTime();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            isExpired: false,
        };
    }, [props.targetDate]);

    const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeRemaining());

    useEffect(() => {
        setTimeLeft(calculateTimeRemaining());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeRemaining());
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeRemaining]);

    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor || (styles.background ? 'transparent' : '#fee2e2'),
        background: styles.background,
        color: styles.color,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        marginTop: styles.marginTop,
        marginBottom: styles.marginBottom,
        borderRadius: styles.borderRadius,
        maxWidth: styles.maxWidth,
        boxShadow: styles.boxShadow,
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle,
        borderColor: styles.borderColor,
        textAlign: styles.textAlign,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
    };

    if (timeLeft.isExpired && props.expiryAction === 'hide') {
        return null;
    }

    return (
        <section
            style={inlineStyles}
            className="w-full py-8 text-rose-900 border-y border-rose-200"
        >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                {timeLeft.isExpired ? (
                    <div className="font-bold text-lg">
                        {props.expiryMessage || 'This limited time promotion has concluded.'}
                    </div>
                ) : (
                    <div>
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-200/80 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
                            <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                            <span>{props.headline || 'Urgent Limited Deal'}</span>
                        </div>

                        {props.urgencyText && (
                            <p className="text-sm font-semibold mb-4 text-rose-800">
                                {props.urgencyText}
                            </p>
                        )}

                        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                            <TimeBox label="Days" value={timeLeft.days} />
                            <span className="text-2xl font-bold text-rose-400">:</span>
                            <TimeBox label="Hours" value={timeLeft.hours} />
                            <span className="text-2xl font-bold text-rose-400">:</span>
                            <TimeBox label="Minutes" value={timeLeft.minutes} />
                            <span className="text-2xl font-bold text-rose-400">:</span>
                            <TimeBox label="Seconds" value={timeLeft.seconds} />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function TimeBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-14 sm:w-16 h-14 sm:h-16 bg-white rounded-xl shadow-md border border-rose-200 flex items-center justify-center font-extrabold text-2xl sm:text-3xl text-rose-600 font-mono">
                {String(value).padStart(2, '0')}
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 mt-1.5">
                {label}
            </span>
        </div>
    );
}
