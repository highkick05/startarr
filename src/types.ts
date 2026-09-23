export interface ShortcutItem {
  id: string;
  type?: 'app' | 'category' | 'container' | 'widget';
  widgetType?: 'terminal' | string;
  title: string;
  url: string;
  iconUrl?: string;
  invertIcon?: boolean;
  iconBackground?: 'transparent' | 'white' | 'black';
  isLoading?: boolean;
  x?: number;
  y?: number;
  sizeToContent?: boolean;
  w?: number;
  h?: number;
  children?: ShortcutItem[];
  widgetConfig?: Record<string, any>;
}

export interface SshProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'privateKey';
  privateKey?: string;
  passphrase?: string;
  createdAt?: number;
}

declare global {
  interface Window {
    removeShortcut: (id: string) => void;
  }
}
