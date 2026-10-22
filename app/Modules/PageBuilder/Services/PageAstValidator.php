<?php

declare(strict_types=1);

namespace App\Modules\PageBuilder\Services;

use Illuminate\Validation\ValidationException;

class PageAstValidator
{
    /**
     * Allowed CSS property names in style dictionaries (both camelCase and kebab-case).
     *
     * @var list<string>
     */
    public const ALLOWED_CSS_PROPERTIES = [
        // Core layout & sizing
        'display',
        'position',
        'top',
        'right',
        'bottom',
        'left',
        'zindex',
        'width',
        'height',
        'minwidth',
        'minheight',
        'maxwidth',
        'maxheight',
        'overflow',
        'overflowx',
        'overflowy',
        'boxsizing',
        'aspectratio',
        'verticalalign',
        // Flex / grid
        'flex',
        'flexdirection',
        'flexwrap',
        'flexgrow',
        'flexshrink',
        'flexbasis',
        'justifycontent',
        'alignitems',
        'aligncontent',
        'alignself',
        'justifyself',
        'gap',
        'rowgap',
        'columngap',
        'gridcolumn',
        'gridrow',
        // Spacing
        'padding',
        'paddingtop',
        'paddingright',
        'paddingbottom',
        'paddingleft',
        'margin',
        'margintop',
        'marginright',
        'marginbottom',
        'marginleft',
        // Typography
        'color',
        'fontfamily',
        'fontsize',
        'fontweight',
        'fontstyle',
        'lineheight',
        'letterspacing',
        'textalign',
        'texttransform',
        'textdecoration',
        'textdecorationcolor',
        'textunderlineoffset',
        'textshadow',
        'whitespace',
        'wordbreak',
        'overflowwrap',
        'liststyletype',
        // Background & effects
        'background',
        'backgroundcolor',
        'opacity',
        'boxshadow',
        'transform',
        'transformorigin',
        'transition',
        'filter',
        'backdropfilter',
        'cursor',
        'objectfit',
        'objectposition',
        // Borders
        'borderradius',
        'bordercolor',
        'borderwidth',
        'borderstyle',
        'bordertopwidth',
        'borderrightwidth',
        'borderbottomwidth',
        'borderleftwidth',
        'bordertopcolor',
        'borderrightcolor',
        'borderbottomcolor',
        'borderleftcolor',
    ];

    /**
     * Non-CSS style keys stored in the builder AST.
     *
     * @var list<string>
     */
    public const STRUCTURAL_STYLE_KEYS = [
        'responsive',
        'elements',
        'selfalign',
        'buttonbgcolor',
        'buttontextcolor',
        'buttonborderradius',
        'buttonpulseanimation',
    ];

    /**
     * Strict whitelist of permitted URL protocols.
     *
     * @var list<string>
     */
    public const ALLOWED_PROTOCOLS = [
        'http',
        'https',
        'tel',
        'mailto',
    ];

    /**
     * Maximum permitted z-index to prevent clickjacking overlay attacks.
     */
    public const MAX_Z_INDEX = 50;

    /**
     * Maximum permitted block nesting depth (root = level 1, deepest child = level 5).
     */
    public const MAX_NESTING_DEPTH = 5;

    /**
     * Validate the entire page AST.
     *
     * @param  array<string, mixed>  $ast
     * @return array<string, mixed> The validated AST
     *
     * @throws ValidationException
     */
    public function validate(array $ast): array
    {
        $errors = [];

        // 1. Root structure validation
        if (! isset($ast['version']) || ! is_int($ast['version']) || $ast['version'] < 1) {
            $errors['version'] = ['The AST version must be a positive integer.'];
        }

        if (! isset($ast['blocks']) || ! is_array($ast['blocks'])) {
            $errors['blocks'] = ['The AST must contain a blocks array.'];
            throw ValidationException::withMessages($errors);
        }

        // Validate settings if provided
        if (isset($ast['settings']) && is_array($ast['settings'])) {
            $this->validateSettings($ast['settings'], $errors);
        }

        // 2. Validate individual blocks and nested child trees recursively
        foreach ($ast['blocks'] as $index => $block) {
            $this->validateBlock($block, "blocks.{$index}", $errors, 1);
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        return $ast;
    }

    /**
     * Validate an individual block and its nested children recursively.
     *
     * @param  array<string, list<string>>  $errors
     */
    protected function validateBlock(mixed $block, string $prefix, array &$errors, int $depth = 1): void
    {
        if ($depth > self::MAX_NESTING_DEPTH) {
            $errors[$prefix] = ['Block nesting depth exceeds maximum permitted limit of '.self::MAX_NESTING_DEPTH.' levels.'];

            return;
        }

        if (! is_array($block)) {
            $errors[$prefix] = ["Block at {$prefix} must be an object."];

            return;
        }

        // Block ID
        if (empty($block['id']) || ! is_string($block['id'])) {
            $errors["{$prefix}.id"] = ["Block at {$prefix} must have a valid string ID."];
        }

        // Block Type
        $type = $block['type'] ?? null;
        if (empty($type) || ! is_string($type) || ! BlockRegistry::isApproved($type)) {
            $errors["{$prefix}.type"] = [
                "Block type '{$type}' is not recognized or permitted. Must be one of the approved registry types.",
            ];

            return; // Cannot validate unknown block further
        }

        // Block Props
        $props = $block['props'] ?? [];
        if (! is_array($props)) {
            $errors["{$prefix}.props"] = ['Block props must be an object/array.'];
        } else {
            $this->validateProps($props, $prefix, $type, $errors);
        }

        // Block Styles
        $styles = $block['styles'] ?? [];
        if (! is_array($styles)) {
            $errors["{$prefix}.styles"] = ['Block styles must be an object/array.'];
        } else {
            $this->validateStyles($styles, "{$prefix}.styles", $type, $errors);
        }

        // Block Children (Optional, but if present must be an array of child blocks)
        if (array_key_exists('children', $block)) {
            if (! is_array($block['children'])) {
                $errors["{$prefix}.children"] = ['Block children must be an array.'];
            } else {
                foreach ($block['children'] as $childIndex => $childBlock) {
                    $this->validateBlock($childBlock, "{$prefix}.children.{$childIndex}", $errors, $depth + 1);
                }
            }
        }
    }

    /**
     * Validate global page settings.
     *
     * @param  array<string, mixed>  $settings
     * @param  array<string, list<string>>  $errors
     */
    protected function validateSettings(array $settings, array &$errors): void
    {
        foreach ($settings as $key => $value) {
            if (is_string($value)) {
                $this->assertSafeString($value, "settings.{$key}", $errors);
            }
        }
    }

    /**
     * Validate block properties.
     *
     * @param  array<string, mixed>  $props
     * @param  array<string, list<string>>  $errors
     */
    protected function validateProps(array $props, string $prefix, string $blockType, array &$errors): void
    {
        if ($blockType === 'HtmlBlock') {
            if (isset($props['html']) && is_string($props['html'])) {
                $this->assertSafeHtml($props['html'], "{$prefix}.props.html", $errors);
            }
            if (isset($props['css']) && is_string($props['css'])) {
                $this->assertSafeCustomCss($props['css'], "{$prefix}.props.css", $errors);
            }

            return;
        }

        foreach ($props as $key => $value) {
            $propPath = "{$prefix}.props.{$key}";

            if (is_string($value)) {
                // Assert no unsafe HTML or scripts
                $this->assertSafeString($value, $propPath, $errors);

                // Assert URL protocol safety for URL-like fields
                $this->assertSafeUrl($value, $propPath, $errors);
            } elseif (is_array($value)) {
                // Recursively validate nested props (e.g. FAQ items, features grid)
                $this->validateNestedProps($value, $propPath, $errors);
            }
        }
    }

    /**
     * Validate merchant-provided HTML content for HtmlBlock, enforcing strict XSS prevention.
     *
     * @param  array<string, list<string>>  $errors
     */
    protected function assertSafeHtml(string $value, string $path, array &$errors): void
    {
        // 1. Reject <script> tags
        if (preg_match('/<\s*\/?\s*script/i', $value)) {
            $errors[$path] = ['Unsanitized <script> tags are strictly forbidden in HTML block.'];

            return;
        }

        // 2. Reject dangerous embedding tags
        if (preg_match('/<\s*(iframe|object|embed|applet|meta|link)/i', $value)) {
            $errors[$path] = ['Dangerous HTML embedding tags (iframe, object, embed, applet, meta, link) are strictly forbidden in HTML block.'];

            return;
        }

        // 3. Reject inline event handlers: onerror=, onload=, onclick=, etc.
        if (preg_match('/\bon[a-zA-Z]+\s*=/i', $value)) {
            $errors[$path] = ['Inline JavaScript event handlers (e.g. onerror, onclick) are strictly forbidden in HTML block.'];

            return;
        }

        // 4. Reject javascript:, vbscript:, and data: URI execution vectors
        if (preg_match('/(javascript|vbscript|data\s*:\s*text\/html)\s*:/i', $value)) {
            $errors[$path] = ['JavaScript and executable URI schemes are strictly forbidden in HTML block.'];
        }
    }

    /**
     * Validate merchant-provided scoped CSS for HtmlBlock.
     *
     * @param  array<string, list<string>>  $errors
     */
    protected function assertSafeCustomCss(string $value, string $path, array &$errors): void
    {
        if (preg_match('/(expression\s*\(|@import|javascript\s*:|behavior\s*:|-moz-binding|<\s*script)/i', $value)) {
            $errors[$path] = ['Unsafe CSS expression, external @import, or script vector detected in custom CSS.'];
        }

        if (preg_match('/position\s*:\s*(fixed|sticky)/i', $value)) {
            $errors[$path] = ['Fixed or sticky position overlays are strictly forbidden in custom CSS.'];
        }
    }

    /**
     * Recursively validate nested array props (e.g. lists of reviews, FAQs).
     *
     * @param  array<string, mixed>  $items
     * @param  array<string, list<string>>  $errors
     */
    protected function validateNestedProps(array $items, string $prefix, array &$errors): void
    {
        foreach ($items as $k => $v) {
            $path = "{$prefix}.{$k}";
            if (is_string($v)) {
                $this->assertSafeString($v, $path, $errors);
                $this->assertSafeUrl($v, $path, $errors);
            } elseif (is_array($v)) {
                $this->validateNestedProps($v, $path, $errors);
            }
        }
    }

    /**
     * Validate block CSS styles dictionary against strict whitelist and safety rules.
     *
     * @param  array<string, mixed>  $styles
     * @param  array<string, list<string>>  $errors
     */
    protected function validateStyles(
        array $styles,
        string $stylePathPrefix,
        string $blockType,
        array &$errors,
        bool $allowMeta = true,
        int $depth = 0
    ): void {
        foreach ($styles as $prop => $value) {
            if (! is_string($prop)) {
                $errors[$stylePathPrefix] = ['Style keys must be strings.'];

                continue;
            }

            $stylePath = "{$stylePathPrefix}.{$prop}";
            $normalizedProp = strtolower(str_replace(['-', '_'], '', $prop));

            if ($normalizedProp === 'responsive') {
                if (! $allowMeta) {
                    $errors[$stylePath] = ['Nested responsive style blocks are not permitted.'];

                    continue;
                }

                if (! is_array($value)) {
                    $errors[$stylePath] = ['Responsive styles must be an object.'];

                    continue;
                }

                foreach ($value as $device => $deviceStyles) {
                    if (! in_array($device, ['tablet', 'mobile'], true)) {
                        $errors["{$stylePath}.{$device}"] = ['Responsive device must be tablet or mobile.'];

                        continue;
                    }

                    if (! is_array($deviceStyles)) {
                        $errors["{$stylePath}.{$device}"] = ['Responsive style overrides must be an object.'];

                        continue;
                    }

                    $this->validateStyles(
                        $deviceStyles,
                        "{$stylePath}.{$device}",
                        $blockType,
                        $errors,
                        false
                    );
                }

                continue;
            }

            if ($normalizedProp === 'elements') {
                if (! $allowMeta || $depth > 0) {
                    $errors[$stylePath] = ['Nested element style blocks are not permitted here.'];

                    continue;
                }

                if (! is_array($value)) {
                    $errors[$stylePath] = ['Element styles must be an object.'];

                    continue;
                }

                foreach ($value as $elementKey => $elementStyles) {
                    if (! is_string($elementKey) || ! preg_match('/^[a-z][a-z0-9-]{0,39}$/', $elementKey)) {
                        $errors["{$stylePath}.{$elementKey}"] = ['Invalid inner element style key.'];

                        continue;
                    }

                    if (! is_array($elementStyles)) {
                        $errors["{$stylePath}.{$elementKey}"] = ['Inner element styles must be an object.'];

                        continue;
                    }

                    $this->validateStyles(
                        $elementStyles,
                        "{$stylePath}.{$elementKey}",
                        $blockType,
                        $errors,
                        true,
                        $depth + 1
                    );
                }

                continue;
            }

            if ($normalizedProp === 'selfalign') {
                if (! in_array($value, ['left', 'center', 'right'], true)) {
                    $errors[$stylePath] = ['Block self alignment must be left, center or right.'];
                }

                continue;
            }

            // Legacy builder style shortcuts are not emitted as raw CSS.
            if (in_array($normalizedProp, self::STRUCTURAL_STYLE_KEYS, true)) {
                continue;
            }

            // 1. Whitelist property check
            if (! in_array($normalizedProp, self::ALLOWED_CSS_PROPERTIES, true)) {
                $errors[$stylePath] = [
                    "Disallowed CSS property '{$prop}'. Only approved styling properties are permitted.",
                ];

                continue;
            }

            if (is_array($value) || is_object($value)) {
                $errors[$stylePath] = ["CSS property '{$prop}' must have a scalar value."];

                continue;
            }

            $strVal = is_string($value) ? $value : (string) $value;

            // 2. Reject unsafe CSS injection vectors.
            if (preg_match('/(expression\s*\(|@import|url\s*\(|behavior\s*:|-moz-binding|<script|onerror\s*=|[;{}<>\\\\])/i', $strVal)) {
                $errors[$stylePath] = [
                    "Unsafe CSS expression, import, or script vector detected in property '{$prop}'.",
                ];

                continue;
            }

            // 3. Prohibit fixed/sticky/absolute overlays on all blocks except StickyBarBlock
            if ($normalizedProp === 'position') {
                $cleanVal = strtolower(trim($strVal));
                if (in_array($cleanVal, ['fixed', 'sticky', 'absolute'], true) && $blockType !== 'StickyBarBlock') {
                    $errors[$stylePath] = [
                        "CSS 'position: {$cleanVal}' overlays are strictly prohibited on '{$blockType}'. Fixed positioning is reserved exclusively for StickyBarBlock.",
                    ];
                }
            }

            // 4. Validate z-index: must not exceed MAX_Z_INDEX (50) to prevent clickjacking
            if ($normalizedProp === 'zindex') {
                $zVal = is_numeric($value) ? (int) $value : null;
                if ($zVal === null || $zVal > self::MAX_Z_INDEX) {
                    $errors[$stylePath] = [
                        "z-index value '{$strVal}' exceeds maximum permitted limit of ".self::MAX_Z_INDEX.' to prevent clickjacking overlays.',
                    ];
                }
            }
        }
    }

    /**
     * Assert that a string value does not contain HTML tags, scripts, or inline event handlers.
     *
     * @param  array<string, list<string>>  $errors
     */
    protected function assertSafeString(string $value, string $path, array &$errors): void
    {
        // 1. Reject <script> tags
        if (preg_match('/<\s*\/?\s*script/i', $value)) {
            $errors[$path] = ['Unsanitized <script> tags are strictly forbidden in page builder content.'];

            return;
        }

        // 2. Reject dangerous embedding tags
        if (preg_match('/<\s*(iframe|object|embed|applet|meta|link|svg)/i', $value)) {
            $errors[$path] = ['Dangerous HTML embedding tags are strictly forbidden in page builder content.'];

            return;
        }

        // 3. Reject inline event handlers: onerror=, onload=, onclick=, etc.
        if (preg_match('/\bon[a-zA-Z]+\s*=/i', $value)) {
            $errors[$path] = ['Inline JavaScript event handlers (e.g. onerror, onclick) are strictly forbidden.'];

            return;
        }

        // 4. Reject javascript: or vbscript: pseudoprotocols anywhere in text
        if (preg_match('/(javascript|vbscript)\s*:/i', $value)) {
            $errors[$path] = ['JavaScript and VBScript execution URIs are strictly forbidden.'];
        }
    }

    /**
     * Assert that if a string is a URL or link target, it conforms strictly to the protocol whitelist.
     *
     * @param  array<string, list<string>>  $errors
     */
    protected function assertSafeUrl(string $value, string $path, array &$errors): void
    {
        $trimmed = trim($value);

        // Internal anchor hashes (#cod-checkout) or relative paths (/checkout) are always safe
        if (str_starts_with($trimmed, '#') || str_starts_with($trimmed, '/')) {
            return;
        }

        // If string matches protocol format: 'scheme:...'
        if (preg_match('/^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/s', $trimmed, $matches)) {
            $scheme = strtolower($matches[1]);

            // Specifically reject dangerous schemes immediately
            if (in_array($scheme, ['javascript', 'data', 'vbscript', 'file', 'about'], true)) {
                $errors[$path] = [
                    "Disallowed URL protocol '{$scheme}:'. Only http, https, tel, mailto, and internal anchors are permitted.",
                ];

                return;
            }

            // Must be in whitelist
            if (! in_array($scheme, self::ALLOWED_PROTOCOLS, true)) {
                $errors[$path] = [
                    "Disallowed URL protocol '{$scheme}:'. Only http, https, tel, mailto, and internal anchors are permitted.",
                ];
            }
        }
    }
}
