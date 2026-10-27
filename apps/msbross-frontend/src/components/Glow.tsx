/**
 * Soft ambient glow — radial-gradient based.
 *
 * Replaces the previous pattern of huge `rounded-full blur-[NNNpx]` divs.
 * Each CSS filter layer forces WebKit (especially iOS Safari/WKWebView,
 * where ALL iOS browsers share the same engine) to allocate and composite
 * a full GPU surface per glow — a dozen of them makes iOS drop paint
 * tiles: sections vanish while scrolling and the page paints slowly.
 *
 * A radial-gradient looks virtually identical for these low-opacity
 * ambient glows and costs a cheap paint with zero filter layers.
 */
export default function Glow({
    color,
    className,
    fade = '70%',
}: {
    color: string;
    className?: string;
    /** Where the gradient reaches full transparency (radial falloff). */
    fade?: string;
}) {
    return (
        <div
            aria-hidden="true"
            className={`absolute rounded-full pointer-events-none ${className ?? ''}`}
            style={{
                background: `radial-gradient(closest-side, ${color}, transparent ${fade})`,
            }}
        />
    );
}
