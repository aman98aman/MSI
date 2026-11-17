'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface BlogShareButtonProps {
  title: string;
  url: string;
  slug: string;
}

export default function BlogShareButton({ title, url, slug }: BlogShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const cleanUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/blog/${slug}`
        : url;

    if (navigator.share && /mobile/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title,
          url: cleanUrl,
        });
        return;
      } catch (_) {}
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(cleanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
        copied
          ? 'bg-emerald-600 text-white'
          : 'bg-white hover:bg-[#FFF3DD] text-[#10233F] border border-[#E8DCCB] hover:border-[#89190E]'
      }`}
      title="Share clean article link (without #)"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-white" />
          <span>Copied Link!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5 text-[#89190E]" />
          <span>Share Article</span>
        </>
      )}
    </button>
  );
}

