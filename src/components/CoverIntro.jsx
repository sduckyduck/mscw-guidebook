import IconFallback, { iconSourcesFromNames } from './IconFallback.jsx';

const BOOK_ICON_NAMES = [
  'book',
  'book-icon',
  'guidebook',
  'guide-book',
  'maple-guidebook',
  'cover-book',
];

export default function CoverIntro({ onEnter }) {
  return (
    <main className="cover-intro" aria-label="Open guidebook">
      <button className="cover-book-button" type="button" onClick={onEnter} aria-label="Enter guidebook">
        <IconFallback
          className="cover-book-image"
          sources={iconSourcesFromNames(BOOK_ICON_NAMES, ['icons', 'icons/book', 'icons/ui'])}
          alt=""
          fallback={<span className="cover-book-fallback" />}
        />
      </button>
    </main>
  );
}
