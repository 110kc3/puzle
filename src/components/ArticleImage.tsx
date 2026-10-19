import { useState } from 'react';

interface Props {
  src: string;
  href: string;
  alt: string;
}

/** The article's front-page image, shown only after the reveal. */
export default function ArticleImage({ src, href, alt }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className="mx-auto mt-4 max-h-72 w-full rounded-xl object-cover shadow-sm"
      />
    </a>
  );
}
