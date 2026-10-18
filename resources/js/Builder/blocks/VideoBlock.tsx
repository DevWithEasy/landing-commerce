import { Play } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { BlockStyles, VideoBlockProps } from '@/types/builder';

export interface VideoBlockComponentProps {
    props: VideoBlockProps;
    styles?: BlockStyles;
    isEditor?: boolean;
}

export function VideoBlock({ props, styles = {}, isEditor = false }: VideoBlockComponentProps) {
    const inlineStyles: CSSProperties = {
        backgroundColor: styles.backgroundColor,
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

    const aspectRatioClass =
        props.aspectRatio === '4:3'
            ? 'aspect-4/3'
            : props.aspectRatio === '1:1'
              ? 'aspect-square'
              : 'aspect-video';

    // Parse sanitized embed URL
    const getEmbedUrl = (rawUrl: string): string => {
        if (!rawUrl) return '';

        // YouTube
        const ytMatch = rawUrl.match(
            /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
        );
        if (ytMatch) {
            return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`;
        }

        // Vimeo
        const vimeoMatch = rawUrl.match(
            /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/
        );
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        return rawUrl;
    };

    const embedUrl = getEmbedUrl(props.videoUrl);

    return (
        <section style={inlineStyles} className="w-full py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div
                    className={`relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-gray-800 ${aspectRatioClass}`}
                >
                    {isEditor ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white bg-slate-900 p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary-600/30 text-primary-400 flex items-center justify-center mb-3">
                                <Play className="w-8 h-8 fill-current ml-1" />
                            </div>
                            <span className="font-semibold text-base">Video Player Preview</span>
                            <span className="text-xs text-slate-400 mt-1 max-w-sm truncate">
                                {props.videoUrl ||
                                    'Enter a valid YouTube or Vimeo URL in the inspector'}
                            </span>
                        </div>
                    ) : embedUrl ? (
                        <iframe
                            src={embedUrl}
                            title="Product Video Showcase"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <span>No video URL configured</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
