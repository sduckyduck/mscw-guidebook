import IconFallback, { iconSourcesFromNames } from './IconFallback.jsx';

const BOOK_ICON_NAMES = [
  'book',
  'book-icon',
  'guidebook',
  'guide-book',
  'maple-guidebook',
  'cover-book',
  'cover',
  'home-book',
  'intro-book',
  '百科',
  '书',
];

const BOOK_FOLDERS = ['icons/book', 'icons/ui', 'icons'];

export default function CoverIntro({ onEnter }) {
  return (
    <main className="cover-intro" aria-label="Open guidebook">
      <button className="cover-book-button" type="button" onClick={onEnter} aria-label="Enter guidebook">
        <IconFallback
          className="cover-book-image"
          names={BOOK_ICON_NAMES}
          folders={BOOK_FOLDERS}
          sources={iconSourcesFromNames(BOOK_ICON_NAMES, BOOK_FOLDERS)}
          alt=""
          debugLabel="cover-book"
          fallback={<span className="cover-book-fallback" />}
        />
      </button>
    </main>
  );
}
