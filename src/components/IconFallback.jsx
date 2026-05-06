import { useEffect, useMemo, useState } from 'react';

const IMAGE_EXTENSIONS = ['png', 'webp', 'gif', 'jpg', 'jpeg'];

export function baseUrl() {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

export function slugifyIconName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\bjr\.?\b/g, 'jr')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function iconSourcesFromNames(names, folders = ['icons'], extensions = IMAGE_EXTENSIONS) {
  const root = `${baseUrl()}icons`;
  const output = [];
  for (const rawName of names.filter(Boolean)) {
    const clean = String(rawName).replace(/^\/+/, '').replace(/\.(png|webp|gif|jpe?g)$/i, '');
    const slug = slugifyIconName(clean);
    const variants = [...new Set([clean, slug, slug.replace(/-/g, '_'), slug.replace(/-/g, '')].filter(Boolean))];
    for (const folder of folders) {
      const folderPath = folder.replace(/^\/+|\/+$/g, '');
      for (const variant of variants) {
        for (const ext of extensions) {
          output.push(`${baseUrl()}${folderPath}/${variant}.${ext}`);
        }
      }
    }
    for (const variant of variants) {
      for (const ext of extensions) {
        output.push(`${root}/${variant}.${ext}`);
      }
    }
  }
  return [...new Set(output)];
}

export default function IconFallback({ sources = [], alt = '', className = '', style, fallback = null, onLoad }) {
  const list = useMemo(() => [...new Set(sources.filter(Boolean))], [sources.join('|')]);
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [list.join('|')]);

  if (!list[index]) return fallback;

  return (
    <img
      className={className}
      src={list[index]}
      alt={alt}
      draggable="false"
      onLoad={onLoad}
      onError={() => setIndex((value) => value + 1)}
      style={style}
    />
  );
}
