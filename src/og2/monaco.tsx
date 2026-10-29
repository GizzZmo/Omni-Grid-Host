import { useEffect } from 'react';

export type OnMount = (editor: unknown, monaco: unknown) => void;

export default function Editor({
  value = '',
  onChange,
  onMount,
  height = '100%',
}: {
  value?: string;
  onChange?: (value: string) => void;
  onMount?: OnMount;
  height?: string | number;
  language?: string;
  theme?: string;
  options?: unknown;
}) {
  useEffect(() => {
    onMount?.(
      { getValue: () => value, setValue: () => undefined, focus: () => undefined },
      { editor: { setModelLanguage: () => undefined } },
    );
  }, []);
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      spellCheck={false}
      style={{ height, width: '100%', minHeight: 140 }}
      className="w-full bg-black text-emerald-300 font-mono text-xs p-2 outline-none resize-none"
    />
  );
}
