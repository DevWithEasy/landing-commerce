<?php

declare(strict_types=1);

namespace App\Modules\Ai\Support;

use App\Modules\Ai\Exceptions\AiResponseValidationException;
use App\Modules\PageBuilder\Services\PageAstValidator;
use DOMComment;
use DOMDocument;
use DOMElement;
use DOMNode;
use DOMText;

/**
 * Sanitizes untrusted AI-generated HTML and CSS before it becomes an HtmlBlock.
 *
 * The generated HTML is rebuilt from a small element/attribute allowlist. CSS
 * is rejected when it contains execution vectors, external resources, overlay
 * positioning, or unapproved at-rules, and every selector is prefixed with a
 * server-generated scope class.
 */
class AiHtmlSanitizer
{
    private const MAX_HTML_BYTES = 80_000;

    private const MAX_CSS_BYTES = 40_000;

    private const MAX_ELEMENTS = 800;

    private const MAX_HTML_DEPTH = 20;

    /**
     * @var list<string>
     */
    private const ALLOWED_TAGS = [
        'a',
        'abbr',
        'address',
        'article',
        'aside',
        'b',
        'blockquote',
        'br',
        'button',
        'caption',
        'cite',
        'code',
        'col',
        'colgroup',
        'dd',
        'del',
        'dfn',
        'div',
        'dl',
        'dt',
        'em',
        'figcaption',
        'figure',
        'footer',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'header',
        'hr',
        'i',
        'img',
        'ins',
        'kbd',
        'label',
        'li',
        'main',
        'mark',
        'nav',
        'ol',
        'p',
        'pre',
        'q',
        's',
        'samp',
        'section',
        'small',
        'span',
        'strong',
        'sub',
        'sup',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'time',
        'tr',
        'u',
        'ul',
        'var',
    ];

    /**
     * Elements that participate in block layout. Only these are placed on
     * their own indented lines while pretty-printing generated HTML.
     *
     * @var list<string>
     */
    private const BLOCK_TAGS = [
        'address',
        'article',
        'aside',
        'blockquote',
        'caption',
        'col',
        'colgroup',
        'dd',
        'div',
        'dl',
        'dt',
        'figcaption',
        'figure',
        'footer',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'header',
        'hr',
        'li',
        'main',
        'nav',
        'ol',
        'p',
        'pre',
        'section',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'tr',
        'ul',
    ];

    /**
     * @var list<string>
     */
    private const VOID_TAGS = ['br', 'col', 'hr', 'img'];

    /**
     * @var list<string>
     */
    private const GLOBAL_ATTRIBUTES = [
        'aria-hidden',
        'aria-label',
        'class',
        'role',
        'title',
    ];

    /**
     * @var array<string, list<string>>
     */
    private const TAG_ATTRIBUTES = [
        'a' => ['href', 'rel', 'target'],
        'button' => ['disabled', 'type'],
        'col' => ['span'],
        'colgroup' => ['span'],
        'img' => ['alt', 'decoding', 'height', 'loading', 'referrerpolicy', 'src', 'width'],
        'ol' => ['reversed', 'start', 'type'],
        'td' => ['colspan', 'rowspan'],
        'th' => ['colspan', 'rowspan', 'scope'],
        'time' => ['datetime'],
    ];

    /**
     * @var list<string>
     */
    private const SAFE_REL_TOKENS = [
        'external',
        'nofollow',
        'noopener',
        'noreferrer',
        'sponsored',
        'ugc',
    ];

    /**
     * @var list<string>
     */
    private const SAFE_REFERRER_POLICIES = [
        'no-referrer',
        'no-referrer-when-downgrade',
        'origin',
        'origin-when-cross-origin',
        'same-origin',
        'strict-origin',
        'strict-origin-when-cross-origin',
        'unsafe-url',
    ];

    /**
     * @return array{html: string, css: string}
     */
    public function sanitize(string $html, string $css, string $scopeClass): array
    {
        if (! preg_match('/^[a-z][a-z0-9-]{2,63}$/', $scopeClass)) {
            throw new AiResponseValidationException('The generated design could not be scoped safely.');
        }

        if (strlen($html) > self::MAX_HTML_BYTES) {
            throw new AiResponseValidationException('The generated HTML is too large.');
        }

        if (strlen($css) > self::MAX_CSS_BYTES) {
            throw new AiResponseValidationException('The generated CSS is too large.');
        }

        $safeHtml = $this->sanitizeHtml($html, $scopeClass);
        $safeCss = $this->sanitizeCss($css, $scopeClass);

        return [
            'html' => $safeHtml,
            'css' => $safeCss,
        ];
    }

    private function sanitizeHtml(string $html, string $scopeClass): string
    {
        $html = trim($html);

        if ($html === '') {
            throw new AiResponseValidationException('The generated design did not contain any HTML.');
        }

        if (preg_match('//u', $html) !== 1) {
            throw new AiResponseValidationException('The generated HTML was not valid UTF-8.');
        }

        // Comments are never required in generated design markup. Remove them
        // before the preflight checks so their contents cannot hide markup.
        $html = preg_replace('/<!--.*?-->/s', '', $html) ?? $html;

        if (str_contains($html, '<?') || str_contains($html, '<%') || str_contains($html, '<!')) {
            throw new AiResponseValidationException('The generated HTML contained an unsafe declaration.');
        }

        if (preg_match('/<\s*(!doctype|html|head|body|script|style|iframe|object|embed|applet|meta|link|base|form|input|textarea|select|option|svg|math|template|noscript|video|audio|source|canvas|map|area)\b/i', $html)) {
            throw new AiResponseValidationException('The generated HTML contained an unsafe element.');
        }

        $previous = libxml_use_internal_errors(true);
        $dom = new DOMDocument('1.0', 'UTF-8');

        $loaded = $dom->loadHTML(
            '<?xml encoding="UTF-8"><div data-ai-root="1">'.$html.'</div>',
            LIBXML_NONET | LIBXML_HTML_NODEFDTD | LIBXML_HTML_NOIMPLIED
        );

        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded) {
            throw new AiResponseValidationException('The generated HTML could not be parsed.');
        }

        $root = null;
        foreach ($dom->getElementsByTagName('div') as $candidate) {
            if ($candidate instanceof DOMElement && $candidate->getAttribute('data-ai-root') === '1') {
                $root = $candidate;
                break;
            }
        }

        if (! $root instanceof DOMElement) {
            throw new AiResponseValidationException('The generated HTML could not be parsed.');
        }

        $elementCount = 0;
        foreach ($root->childNodes as $child) {
            $this->validateNode($child, 1, $elementCount);
        }

        $output = rtrim($this->formatHtmlChildNodes($root, $dom, 1));

        if (trim($output) === '') {
            throw new AiResponseValidationException('The generated design did not contain any visible HTML.');
        }

        return '<div class="'.$scopeClass.'">'."\n".$output."\n".'</div>';
    }

    private function formatHtmlChildNodes(DOMNode $container, DOMDocument $dom, int $depth): string
    {
        $output = '';
        $indent = str_repeat('  ', $depth);
        $inlineRun = '';

        $flushInlineRun = function () use (&$inlineRun, &$output, $indent): void {
            $inlineRun = trim($inlineRun);

            if ($inlineRun !== '') {
                $output .= $indent.$inlineRun."\n";
            }

            $inlineRun = '';
        };

        foreach ($container->childNodes as $child) {
            if ($child instanceof DOMText) {
                // Keep text in the current inline run so spacing around spans,
                // links, and inline images is preserved exactly.
                $inlineRun .= $this->serializeHtmlNode($child, $dom);

                continue;
            }

            if ($child instanceof DOMComment) {
                continue;
            }

            if (! $child instanceof DOMElement) {
                continue;
            }

            if (in_array(strtolower($child->tagName), self::BLOCK_TAGS, true)) {
                $flushInlineRun();
                $output .= $indent.$this->formatHtmlElement($child, $dom, $depth)."\n";

                continue;
            }

            $inlineRun .= $this->serializeHtmlNode($child, $dom);
        }

        $flushInlineRun();

        return $output;
    }

    private function formatHtmlElement(DOMElement $element, DOMDocument $dom, int $depth): string
    {
        $tag = strtolower($element->tagName);
        $open = $this->serializeHtmlOpenTag($element);

        if (in_array($tag, self::VOID_TAGS, true)) {
            return $open;
        }

        // Inline elements are serialized as-is so whitespace between links,
        // spans, and other inline nodes is never changed by the formatter.
        if (! in_array($tag, self::BLOCK_TAGS, true)) {
            return $this->serializeHtmlNode($element, $dom);
        }

        // Preserve preformatted content exactly, including its leading and
        // trailing whitespace.
        if ($tag === 'pre') {
            $inner = '';

            foreach ($element->childNodes as $child) {
                $inner .= $this->serializeHtmlNode($child, $dom);
            }

            return $open.$inner.'</'.$tag.'>';
        }

        $hasBlockChild = false;

        foreach ($element->childNodes as $child) {
            if ($child instanceof DOMElement && in_array(strtolower($child->tagName), self::BLOCK_TAGS, true)) {
                $hasBlockChild = true;
                break;
            }
        }

        // A paragraph or heading with only inline content should stay on one
        // line, otherwise the added newlines would become visible spaces.
        if (! $hasBlockChild) {
            $inner = '';

            foreach ($element->childNodes as $child) {
                $inner .= $this->serializeHtmlNode($child, $dom);
            }

            return $open.$inner.'</'.$tag.'>';
        }

        return $open."\n"
            .$this->formatHtmlChildNodes($element, $dom, $depth + 1)
            .str_repeat('  ', $depth).'</'.$tag.'>';
    }

    private function serializeHtmlOpenTag(DOMElement $element): string
    {
        $output = '<'.strtolower($element->tagName);

        foreach ($element->attributes as $attribute) {
            $output .= ' '.$attribute->nodeName.'="'.$this->escapeHtmlAttribute((string) $attribute->nodeValue).'"';
        }

        return $output.'>';
    }

    private function serializeHtmlNode(DOMNode $node, DOMDocument $dom): string
    {
        $serialized = $dom->saveHTML($node);

        if ($serialized === false) {
            throw new AiResponseValidationException('The generated HTML could not be serialized safely.');
        }

        return $serialized;
    }

    private function escapeHtmlAttribute(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function validateNode(DOMNode $node, int $depth, int &$elementCount): void
    {
        if ($node instanceof DOMText) {
            return;
        }

        if ($node instanceof DOMComment) {
            $node->parentNode?->removeChild($node);

            return;
        }

        if (! $node instanceof DOMElement) {
            throw new AiResponseValidationException('The generated HTML contained an unsupported node.');
        }

        if ($depth > self::MAX_HTML_DEPTH) {
            throw new AiResponseValidationException('The generated HTML was nested too deeply.');
        }

        $tag = strtolower($node->tagName);

        if (! in_array($tag, self::ALLOWED_TAGS, true)) {
            throw new AiResponseValidationException('The generated HTML contained an unsupported element.');
        }

        $elementCount++;
        if ($elementCount > self::MAX_ELEMENTS) {
            throw new AiResponseValidationException('The generated HTML contained too many elements.');
        }

        $this->validateAttributes($node, $tag);

        foreach ($node->childNodes as $child) {
            $this->validateNode($child, $depth + 1, $elementCount);
        }
    }

    private function validateAttributes(DOMElement $element, string $tag): void
    {
        $allowed = array_merge(
            self::GLOBAL_ATTRIBUTES,
            self::TAG_ATTRIBUTES[$tag] ?? []
        );

        foreach ($element->attributes as $attribute) {
            $name = strtolower($attribute->nodeName);

            if (str_starts_with($name, 'on')) {
                throw new AiResponseValidationException('The generated HTML contained an inline event handler.');
            }

            if ($name === 'style' || $name === 'id') {
                throw new AiResponseValidationException('The generated HTML contained a forbidden attribute.');
            }

            if (! in_array($name, $allowed, true)) {
                throw new AiResponseValidationException('The generated HTML contained an unsupported attribute.');
            }

            $value = (string) $attribute->nodeValue;
            $this->validateAttributeValue($element, $tag, $name, $value);
        }

        if ($tag === 'a' && $element->getAttribute('target') === '_blank') {
            $rel = $this->safeRelTokens($element->getAttribute('rel'));
            $rel = array_values(array_unique(array_merge($rel, ['noopener', 'noreferrer'])));
            $element->setAttribute('rel', implode(' ', $rel));
        }
    }

    private function validateAttributeValue(DOMElement $element, string $tag, string $name, string $value): void
    {
        switch ($name) {
            case 'class':
                $this->assertClassList($value);
                break;

            case 'title':
            case 'aria-label':
            case 'alt':
                $this->assertPlainAttribute($value, 300);
                break;

            case 'aria-hidden':
                if (! in_array($value, ['true', 'false'], true)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid accessibility value.');
                }
                break;

            case 'role':
                if (! preg_match('/^[a-z][a-z0-9-]{0,31}$/', $value)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid role.');
                }
                break;

            case 'href':
                $this->assertSafeUrl($value, true, true);
                break;

            case 'src':
                $this->assertSafeUrl($value, false, false);
                break;

            case 'target':
                if (! in_array($value, ['_blank', '_self'], true)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid link target.');
                }
                break;

            case 'rel':
                $this->safeRelTokens($value);
                break;

            case 'type':
                if ($tag === 'button' && $value !== 'button') {
                    throw new AiResponseValidationException('The generated HTML contained an invalid button type.');
                }

                if ($tag === 'ol' && ! in_array($value, ['1', 'a', 'A', 'i', 'I'], true)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid list type.');
                }
                break;

            case 'disabled':
            case 'reversed':
                if (! in_array($value, ['', $name], true)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid boolean attribute.');
                }
                break;

            case 'width':
            case 'height':
                if (! preg_match('/^\d{1,4}$/', $value) || (int) $value < 1) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid image dimension.');
                }
                break;

            case 'colspan':
            case 'rowspan':
                if (! preg_match('/^\d{1,2}$/', $value) || (int) $value < 1 || (int) $value > 100) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid table span.');
                }
                break;

            case 'span':
                if (! preg_match('/^\d{1,2}$/', $value) || (int) $value < 1 || (int) $value > 100) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid column span.');
                }
                break;

            case 'start':
                if (! preg_match('/^-?\d{1,4}$/', $value)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid list start.');
                }
                break;

            case 'scope':
                if (! in_array($value, ['col', 'colgroup', 'row', 'rowgroup'], true)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid table scope.');
                }
                break;

            case 'datetime':
                if (! preg_match('/^[0-9T:+\-.Z ]{1,40}$/', $value)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid date value.');
                }
                break;

            case 'loading':
                if (! in_array($value, ['eager', 'lazy'], true)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid image loading mode.');
                }
                break;

            case 'decoding':
                if (! in_array($value, ['async', 'auto', 'sync'], true)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid image decoding mode.');
                }
                break;

            case 'referrerpolicy':
                if (! in_array($value, self::SAFE_REFERRER_POLICIES, true)) {
                    throw new AiResponseValidationException('The generated HTML contained an invalid referrer policy.');
                }
                break;

            default:
                throw new AiResponseValidationException('The generated HTML contained an unsupported attribute.');
        }

        if ($tag === 'a' && $name === 'href' && $element->getAttribute('href') === '') {
            throw new AiResponseValidationException('The generated HTML contained an empty link.');
        }
    }

    private function assertClassList(string $value): void
    {
        $value = trim($value);

        if ($value === '') {
            return;
        }

        $classes = preg_split('/\s+/', $value) ?: [];

        if (count($classes) > 30) {
            throw new AiResponseValidationException('The generated HTML contained too many CSS classes.');
        }

        foreach ($classes as $class) {
            if (! preg_match('/^[A-Za-z_][A-Za-z0-9_-]{0,63}$/', $class)) {
                throw new AiResponseValidationException('The generated HTML contained an invalid CSS class.');
            }
        }
    }

    private function assertPlainAttribute(string $value, int $maxLength): void
    {
        if (mb_strlen($value) > $maxLength) {
            throw new AiResponseValidationException('The generated HTML contained an overly long attribute.');
        }

        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
            throw new AiResponseValidationException('The generated HTML contained invalid attribute characters.');
        }
    }

    private function assertSafeUrl(string $value, bool $allowFragment, bool $allowContact): string
    {
        $value = html_entity_decode(trim($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        if ($value === '') {
            throw new AiResponseValidationException('The generated HTML contained an empty URL.');
        }

        if (preg_match('/[\x00-\x1F\x7F<>"\'`\\\\]/', $value)) {
            throw new AiResponseValidationException('The generated HTML contained an unsafe URL.');
        }

        $schemeProbe = preg_replace('/[\x00-\x20\x7F]+/', '', $value) ?? $value;

        if (preg_match('/^(javascript|vbscript|data|file|blob):/i', $schemeProbe)) {
            throw new AiResponseValidationException('The generated HTML contained an unsafe URL protocol.');
        }

        if (str_starts_with($value, '#')) {
            if (! $allowFragment || ! preg_match('/^#[A-Za-z][A-Za-z0-9_-]{0,63}$/', $value)) {
                throw new AiResponseValidationException('The generated HTML contained an unsafe anchor.');
            }

            return $value;
        }

        if (str_starts_with($value, '/')) {
            if (str_starts_with($value, '//')) {
                throw new AiResponseValidationException('The generated HTML contained an unsafe relative URL.');
            }

            return $value;
        }

        if (preg_match('/^https?:\/\//i', $value)) {
            if (filter_var($value, FILTER_VALIDATE_URL) === false) {
                throw new AiResponseValidationException('The generated HTML contained an invalid URL.');
            }

            return $value;
        }

        if ($allowContact && preg_match('/^tel:\+?[0-9().\-\s]{3,30}$/i', $value)) {
            return $value;
        }

        if ($allowContact && preg_match('/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i', $value)) {
            return $value;
        }

        throw new AiResponseValidationException('The generated HTML contained an unsupported URL.');
    }

    /**
     * @return list<string>
     */
    private function safeRelTokens(string $value): array
    {
        $value = trim($value);

        if ($value === '') {
            return [];
        }

        $tokens = preg_split('/\s+/', $value) ?: [];

        foreach ($tokens as $token) {
            if (! in_array(strtolower($token), self::SAFE_REL_TOKENS, true)) {
                throw new AiResponseValidationException('The generated HTML contained an unsafe link relationship.');
            }
        }

        return array_map('strtolower', $tokens);
    }

    private function sanitizeCss(string $css, string $scopeClass): string
    {
        $css = trim($css);

        if ($css === '') {
            return '';
        }

        if (preg_match('//u', $css) !== 1) {
            throw new AiResponseValidationException('The generated CSS was not valid UTF-8.');
        }

        if (str_contains($css, '\\')) {
            throw new AiResponseValidationException('The generated CSS contained an unsafe escape sequence.');
        }

        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $css)) {
            throw new AiResponseValidationException('The generated CSS contained invalid control characters.');
        }

        $css = preg_replace('~/\*.*?\*/~s', '', $css) ?? $css;
        $css = trim($css);

        if ($css === '') {
            return '';
        }

        if (preg_match('/[<>]/', $css)) {
            throw new AiResponseValidationException('The generated CSS contained unsafe characters.');
        }

        $this->assertSafeCssPatterns($css);

        return $this->scopeCssRules($css, $scopeClass);
    }

    private function assertSafeCssPatterns(string $css): void
    {
        $patterns = [
            '/@import\b/i',
            '/@charset\b/i',
            '/@namespace\b/i',
            '/@font-face\b/i',
            '/@apply\b/i',
            '/@tailwind\b/i',
            '/@layer\b/i',
            '/@property\b/i',
            '/expression\s*\(/i',
            '/javascript\s*:/i',
            '/vbscript\s*:/i',
            '/behavior\s*:/i',
            '/-moz-binding/i',
            '/url\s*\(/i',
            '/src\s*\(/i',
            '/image-set\s*\(/i',
            '/cross-fade\s*\(/i',
            '/element\s*\(/i',
            '/position\s*:\s*(fixed|sticky)\b/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $css)) {
                throw new AiResponseValidationException('The generated CSS contained an unsafe rule.');
            }
        }

        preg_match_all('/position\s*:\s*([^;}{]+)/i', $css, $positionMatches);

        foreach ($positionMatches[1] ?? [] as $rawValue) {
            $rawValue = strtolower(trim((string) preg_replace('/\s*!important\s*$/i', '', trim($rawValue))));

            if (! in_array($rawValue, [
                'static',
                'relative',
                'absolute',
                'initial',
                'inherit',
                'unset',
                'revert',
                'revert-layer',
            ], true)) {
                throw new AiResponseValidationException('The generated CSS contained an unsafe position value.');
            }
        }

        preg_match_all('/z-index\s*:\s*([^;}{]+)/i', $css, $matches);

        foreach ($matches[1] ?? [] as $rawValue) {
            $rawValue = trim((string) preg_replace('/\s*!important\s*$/i', '', trim($rawValue)));

            if (strtolower($rawValue) === 'auto') {
                continue;
            }

            if (! preg_match('/^-?\d+$/', $rawValue)) {
                throw new AiResponseValidationException('The generated CSS contained an invalid z-index.');
            }

            if ((int) $rawValue > PageAstValidator::MAX_Z_INDEX) {
                throw new AiResponseValidationException('The generated CSS contained an unsafe z-index.');
            }
        }
    }

    private function scopeCssRules(string $css, string $scopeClass): string
    {
        $index = 0;
        $scoped = $this->parseCssRules($css, $index, $scopeClass);

        return trim($scoped);
    }

    private function parseCssRules(string $css, int &$index, string $scopeClass): string
    {
        $output = '';
        $prelude = '';
        $length = strlen($css);

        while ($index < $length) {
            $character = $css[$index];

            if ($character === '}') {
                $index++;

                if (trim($prelude) !== '') {
                    throw new AiResponseValidationException('The generated CSS contained an invalid rule.');
                }

                return $output;
            }

            if ($character === '{') {
                $index++;
                $prelude = trim($prelude);

                if ($prelude === '') {
                    throw new AiResponseValidationException('The generated CSS contained an empty selector.');
                }

                $content = $this->extractCssBlock($css, $index);
                $rule = $this->scopeCssRule($prelude, $content, $scopeClass);
                $output .= ($output === '' ? '' : "\n").$rule;
                $prelude = '';

                continue;
            }

            if ($character === ';' && trim($prelude) === '') {
                $index++;

                continue;
            }

            $prelude .= $character;
            $index++;
        }

        if (trim($prelude) !== '') {
            throw new AiResponseValidationException('The generated CSS contained an invalid rule.');
        }

        return $output;
    }

    private function extractCssBlock(string $css, int &$index): string
    {
        $content = '';
        $depth = 1;
        $quote = null;
        $length = strlen($css);

        while ($index < $length) {
            $character = $css[$index];

            if ($quote !== null) {
                $content .= $character;

                if ($character === $quote) {
                    $quote = null;
                }

                $index++;

                continue;
            }

            if ($character === '"' || $character === "'") {
                $quote = $character;
                $content .= $character;
                $index++;

                continue;
            }

            if ($character === '{') {
                $depth++;
                $content .= $character;
                $index++;

                continue;
            }

            if ($character === '}') {
                $depth--;

                if ($depth === 0) {
                    $index++;

                    return $content;
                }

                $content .= $character;
                $index++;

                continue;
            }

            $content .= $character;
            $index++;
        }

        throw new AiResponseValidationException('The generated CSS contained an unclosed block.');
    }

    private function scopeCssRule(string $prelude, string $content, string $scopeClass): string
    {
        if (str_starts_with($prelude, '@')) {
            return $this->scopeCssAtRule($prelude, $content, $scopeClass);
        }

        if (str_contains($content, '@')) {
            throw new AiResponseValidationException('The generated CSS contained an unsupported nested rule.');
        }

        $selectors = $this->splitSelectors($prelude);
        $scopedSelectors = [];

        foreach ($selectors as $selector) {
            $selector = trim($selector);

            if ($selector === '' || preg_match('/[{};@<&]/', $selector)) {
                throw new AiResponseValidationException('The generated CSS contained an invalid selector.');
            }

            $scopedSelectors[] = $this->scopeSelector($selector, $scopeClass);
        }

        $selectorList = implode(",\n", $scopedSelectors);
        $declarations = $this->formatCssDeclarations($content);

        if ($declarations === '') {
            return $selectorList.' {}';
        }

        return $selectorList." {\n".$this->indentCssText($declarations, 1)."\n}";
    }

    private function scopeSelector(string $selector, string $scopeClass): string
    {
        $scope = '.'.$scopeClass;

        // Models often include a small reset on :root, html, or body. Map those
        // roots to the generated wrapper instead of leaving selectors that can
        // never match inside the block.
        $selector = preg_replace('/^:root\b/i', $scope, $selector) ?? $selector;
        $selector = preg_replace('/^html\b/i', $scope, $selector) ?? $selector;
        $selector = preg_replace('/^body\b/i', $scope, $selector) ?? $selector;
        $selector = preg_replace('/^'.preg_quote($scope, '/').'\s+body\b/i', $scope, $selector) ?? $selector;

        if (preg_match('/^'.preg_quote($scope, '/').'(?![-_A-Za-z0-9])/', $selector)) {
            return $selector;
        }

        return $scope.' '.$selector;
    }

    private function scopeCssAtRule(string $prelude, string $content, string $scopeClass): string
    {
        if (preg_match('/^@(media|supports)\b/i', $prelude)) {
            if (preg_match('/[{};<>]/', $prelude)) {
                throw new AiResponseValidationException('The generated CSS contained an invalid at-rule.');
            }

            $index = 0;
            $inner = $this->parseCssRules($content, $index, $scopeClass);

            if (trim($inner) === '') {
                return $prelude.' {}';
            }

            return $prelude." {\n".$this->indentCssText($inner, 1)."\n}";
        }

        if (preg_match('/^@(?:-webkit-)?keyframes\s+[A-Za-z_][A-Za-z0-9_-]{0,63}$/i', $prelude)) {
            if (str_contains($content, '@')) {
                throw new AiResponseValidationException('The generated CSS contained an unsupported keyframe rule.');
            }

            $inner = $this->formatKeyframesContent($content);

            if ($inner === '') {
                return $prelude.' {}';
            }

            return $prelude." {\n".$this->indentCssText($inner, 1)."\n}";
        }

        throw new AiResponseValidationException('The generated CSS contained an unsupported at-rule.');
    }

    private function formatCssDeclarations(string $content): string
    {
        $content = trim($content);

        if ($content === '') {
            return '';
        }

        $declarations = [];
        $current = '';
        $depth = 0;
        $quote = null;
        $length = strlen($content);

        for ($index = 0; $index < $length; $index++) {
            $character = $content[$index];

            if ($quote !== null) {
                $current .= $character;

                if ($character === $quote) {
                    $quote = null;
                }

                continue;
            }

            if ($character === '"' || $character === "'") {
                $quote = $character;
                $current .= $character;

                continue;
            }

            if ($character === '(' || $character === '[') {
                $depth++;
            } elseif ($character === ')' || $character === ']') {
                $depth--;
            }

            if ($character === ';' && $depth === 0) {
                $declaration = $this->normalizeCssDeclaration($current);

                if ($declaration !== '') {
                    $declarations[] = $declaration;
                }

                $current = '';

                continue;
            }

            $current .= $character;
        }

        $declaration = $this->normalizeCssDeclaration($current);

        if ($declaration !== '') {
            $declarations[] = $declaration;
        }

        return implode("\n", $declarations);
    }

    private function normalizeCssDeclaration(string $declaration): string
    {
        $declaration = trim($declaration);

        if ($declaration === '') {
            return '';
        }

        if (preg_match('/^([A-Za-z-]+)\s*:\s*(.*)$/s', $declaration, $matches)) {
            $declaration = $matches[1].': '.trim($matches[2]);
        }

        return rtrim($declaration, ';').';';
    }

    private function formatKeyframesContent(string $content): string
    {
        $index = 0;
        $output = '';
        $length = strlen($content);

        while ($index < $length) {
            $prelude = '';

            while ($index < $length && $content[$index] !== '{' && $content[$index] !== '}') {
                $prelude .= $content[$index];
                $index++;
            }

            if ($index >= $length) {
                break;
            }

            if ($content[$index] === '}') {
                $index++;

                continue;
            }

            $index++;
            $prelude = trim($prelude);

            if ($prelude === '') {
                throw new AiResponseValidationException('The generated CSS contained an empty keyframe selector.');
            }

            $block = $this->extractCssBlock($content, $index);
            $declarations = $this->formatCssDeclarations($block);
            $rule = $declarations === ''
                ? $prelude.' {}'
                : $prelude." {\n".$this->indentCssText($declarations, 1)."\n}";
            $output .= ($output === '' ? '' : "\n").$rule;
        }

        return $output;
    }

    private function indentCssText(string $text, int $level): string
    {
        if ($text === '') {
            return '';
        }

        $indent = str_repeat('  ', $level);
        $lines = explode("\n", $text);

        foreach ($lines as $index => $line) {
            if ($line !== '') {
                $lines[$index] = $indent.$line;
            }
        }

        return implode("\n", $lines);
    }

    /**
     * @return list<string>
     */
    private function splitSelectors(string $selectorList): array
    {
        $selectors = [];
        $current = '';
        $depth = 0;
        $quote = null;
        $length = strlen($selectorList);

        for ($index = 0; $index < $length; $index++) {
            $character = $selectorList[$index];

            if ($quote !== null) {
                $current .= $character;

                if ($character === $quote) {
                    $quote = null;
                }

                continue;
            }

            if ($character === '"' || $character === "'") {
                $quote = $character;
                $current .= $character;

                continue;
            }

            if ($character === '(' || $character === '[') {
                $depth++;
            } elseif ($character === ')' || $character === ']') {
                $depth--;
            }

            if ($depth < 0) {
                throw new AiResponseValidationException('The generated CSS contained an invalid selector.');
            }

            if ($character === ',' && $depth === 0) {
                $selectors[] = $current;
                $current = '';

                continue;
            }

            $current .= $character;
        }

        if ($quote !== null || $depth !== 0) {
            throw new AiResponseValidationException('The generated CSS contained an invalid selector.');
        }

        $selectors[] = $current;

        return $selectors;
    }
}
