import { useState, useCallback } from 'react';

interface WordImporterProps {
  words: string[];
  onWordsChange: (words: string[]) => void;
}

export default function WordImporter({ words, onWordsChange }: WordImporterProps) {
  const [text, setText] = useState(words.join('\n'));

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    const parsed = newText
      .split('\n')
      .map(w => w.trim())
      .filter(w => w.length > 0);
    // Remove duplicates
    const unique = [...new Set(parsed)];
    onWordsChange(unique);
  }, [onWordsChange]);

  const wordCount = words.length;
  const pairCount = wordCount;
  const tileCount = wordCount * 2;

  return (
    <div className="word-importer">
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 20,
        fontWeight: 600,
        color: 'var(--color-maroon)',
        margin: '0 0 4px 0',
      }}>
        Sacred Words
      </h2>
      <p style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 13,
        color: 'var(--color-temple-text-light)',
        margin: '0 0 16px 0',
      }}>
        Enter your words below, one per line. Each word will appear as a matching pair.
      </p>

      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Enter words, one per line...&#10;&#10;Example:&#10;Dharma&#10;Karma&#10;Mantra&#10;Seva"
        spellCheck={false}
        aria-label="Word list input"
      />

      {/* Word count stats */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginTop: 12,
        padding: '12px 16px',
        borderRadius: 8,
        background: 'rgba(232, 217, 197, 0.3)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 20,
            fontWeight: 600,
            color: wordCount >= 6 ? 'var(--color-teal-dark)' : 'var(--color-maroon)',
          }}>
            {wordCount}
          </div>
          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: 'var(--color-temple-text-light)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Words
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--color-saffron-dark)',
          }}>
            {pairCount}
          </div>
          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: 'var(--color-temple-text-light)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Pairs
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--color-gold-dark)',
          }}>
            {tileCount}
          </div>
          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 10,
            color: 'var(--color-temple-text-light)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Tiles
          </div>
        </div>
      </div>

      {wordCount > 0 && wordCount < 6 && (
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          color: 'var(--color-maroon)',
          margin: '8px 0 0',
        }}>
          Add at least {6 - wordCount} more word{6 - wordCount > 1 ? 's' : ''} (minimum 6)
        </p>
      )}

      {wordCount > 72 && (
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 12,
          color: 'var(--color-saffron-dark)',
          margin: '8px 0 0',
        }}>
          Maximum 72 words supported. First 72 will be used.
        </p>
      )}
    </div>
  );
}
