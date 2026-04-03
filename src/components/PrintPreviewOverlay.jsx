// A visual overlay showing the A4 capture area on the map
export default function PrintPreviewOverlay({ orientation }) {
  const isPortrait = orientation === 'portrait';

  // A4 ratio: 210:297 portrait, 297:210 landscape
  const ratio = isPortrait ? 210 / 297 : 297 / 210;

  // Size the overlay to fill 85% of the smaller dimension of the viewport
  const overlayStyle = isPortrait
    ? { width: `min(85vw, calc(85vh * ${ratio}))`, aspectRatio: `${ratio}` }
    : { height: `min(85vh, calc(85vw * ${1 / ratio}))`, aspectRatio: `${ratio}` };

  return (
    <div className="absolute inset-0 pointer-events-none z-[500] flex items-center justify-center">
      {/* Dimmed area outside the capture zone */}
      <div className="absolute inset-0 bg-black/30" />

      {/* The A4 capture window */}
      <div
        className="relative border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
        style={overlayStyle}
      >
        {/* Corner marks */}
        {[
          'top-0 left-0 border-t-2 border-l-2',
          'top-0 right-0 border-t-2 border-r-2',
          'bottom-0 left-0 border-b-2 border-l-2',
          'bottom-0 right-0 border-b-2 border-r-2',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-5 h-5 border-white ${cls}`} />
        ))}

        {/* Label */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
          A4 {isPortrait ? 'Portrait' : 'Landscape'} — capture area
        </div>
      </div>
    </div>
  );
}