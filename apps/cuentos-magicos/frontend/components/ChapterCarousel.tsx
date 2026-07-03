"use client";

interface ChapterCarouselProps {
  chapters: Array<{
    id: string;
    chapter_number: number;
    chapter_title: string;
    url_image?: string | null;
    image_status?: string;
  }>;
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function ChapterCarousel({
  chapters,
  currentIndex,
  onSelect,
}: ChapterCarouselProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {chapters.map((chapter, i) => (
        <button
          key={chapter.id}
          onClick={() => onSelect(i)}
          className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition ${
            i === currentIndex
              ? "border-amber-400 ring-2 ring-amber-400/40"
              : "border-white/10 hover:border-white/30"
          }`}
        >
          {chapter.url_image ? (
            <img
              src={chapter.url_image}
              alt={chapter.chapter_title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-white/40">
              {chapter.chapter_number}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
