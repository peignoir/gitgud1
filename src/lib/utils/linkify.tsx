/**
 * Linkify - Convert URLs in text to clickable links
 */

export function linkifyText(text: string): React.ReactNode[] {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the clickable link
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 underline"
      >
        {url}
      </a>
    );
    
    lastIndex = match.index + url.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
}

interface LinkifiedTextProps {
  children: string;
  className?: string;
}

export function LinkifiedText({ children, className = '' }: LinkifiedTextProps) {
  return (
    <div className={className}>
      {linkifyText(children)}
    </div>
  );
}
