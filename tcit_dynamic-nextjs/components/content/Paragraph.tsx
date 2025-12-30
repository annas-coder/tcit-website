interface ParagraphProps {
  text: string;
  className?: string;
}

export default function Paragraph({ text, className }: ParagraphProps) {
  return (
    <p className={className || 'content-paragraph'}>
      {text}
    </p>
  );
}

