import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Landing Commerce';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const pages = import.meta.glob<{ default: ComponentType<unknown> }>('./Pages/**/*.tsx');
        const page = await pages[`./Pages/${name}.tsx`]();
        return page.default;
    },
    setup({ el, App, props }) {
        if (!el) {
            return;
        }
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
