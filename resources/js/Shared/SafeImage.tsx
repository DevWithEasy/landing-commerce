import { Package } from 'lucide-react';
import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react';

export interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null;
    alt: string;
    className?: string;
    fallbackIconSize?: string;
    fallbackText?: string;
    fallbackClassName?: string;
    fallbackIcon?: ReactNode;
}

export function SafeImage({
    src,
    alt,
    className = 'w-full h-full object-cover',
    fallbackIconSize = 'w-8 h-8',
    fallbackText = 'No Image',
    fallbackClassName = '',
    fallbackIcon,
    ...rest
}: SafeImageProps) {
    const [hasError, setHasError] = useState(false);

    // Reset error state whenever the image source URL changes (e.g. variant switched)
    useEffect(() => {
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        return (
            <div
                className={`flex flex-col items-center justify-center p-2 text-center select-none bg-gray-50/80 w-full h-full text-gray-400 ${fallbackClassName}`}
                title={alt}
                aria-label={alt}
            >
                {fallbackIcon ? (
                    fallbackIcon
                ) : (
                    <Package className={`${fallbackIconSize} mb-1 text-gray-300 shrink-0`} />
                )}
                {fallbackText ? (
                    <span className="text-[10px] font-medium leading-none text-gray-400 truncate max-w-full">
                        {fallbackText}
                    </span>
                ) : null}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setHasError(true)}
            {...rest}
        />
    );
}

export default SafeImage;
