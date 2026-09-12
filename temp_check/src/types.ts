export interface ShortcutItem {
  id: string;
  type?: 'app' | 'category' | 'container';
  title: string;
  url: string;
  iconUrl?: string;
  invertIcon?: boolean;
  iconBackground?: 'transparent' | 'white' | 'black';
  x?: number;
  y?: number;
  sizeToContent?: boolean;
  w?: number;
  h?: number;
  children?: ShortcutItem[];
}

declare global {
  interface Window {
    removeShortcut: (id: string) => void;
  }
}
