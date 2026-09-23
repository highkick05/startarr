import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Sliders,
  Server,
  Maximize2,
  Minimize2,
  Trash2,
  GripHorizontal,
  RefreshCw,
  Key,
  Lock,
  ChevronDown,
  Check,
  Edit2
} from 'lucide-react';
import { ShortcutItem, SshProfile } from '../types';

interface TerminalTab {
  id: string;
  title: string;
  host: string;
  port: number;
  username: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
  profileId?: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
}

interface TerminalWidgetProps {
  item: ShortcutItem;
  layoutSize?: 'small' | 'medium' | 'large';
  onUpdateConfig: (config: Record<string, any>) => void;
  onRemove: () => void;
}

export const TerminalWidget: React.FC<TerminalWidgetProps> = ({
  item,
  layoutSize = 'medium',
  onUpdateConfig,
  onRemove
}) => {
  // Widget configuration state
  const config = item.widgetConfig || {};
  const [bgOpacity, setBgOpacity] = useState<number>(config.opacity !== undefined ? config.opacity : 70);
  const [isTransparent, setIsTransparent] = useState<boolean>(config.transparent !== undefined ? config.transparent : true);
  const [bgBlur, setBgBlur] = useState<number>(config.blur !== undefined ? config.blur : 16);
  const [fontSize, setFontSize] = useState<number>(config.fontSize || (layoutSize === 'small' ? 11 : layoutSize === 'large' ? 14 : 12));

  // Fullscreen expansion mode
  const [isExpanded, setIsExpanded] = useState(false);

  // Tabs state
  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'tab-default',
      title: 'New Session',
      host: '',
      port: 22,
      username: '',
      status: 'disconnected'
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-default');

  // Menus and dialogs
  const [showAppearanceMenu, setShowAppearanceMenu] = useState(false);
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(true);

  // Saved SSH profiles
  const [profiles, setProfiles] = useState<SshProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // Connect form inside active tab
  const [formName, setFormName] = useState('');
  const [formHost, setFormHost] = useState('');
  const [formPort, setFormPort] = useState(22);
  const [formUser, setFormUser] = useState('');
  const [formAuthType, setFormAuthType] = useState<'password' | 'privateKey'>('password');
  const [formPassword, setFormPassword] = useState('');
  const [formPrivateKey, setFormPrivateKey] = useState('');
  const [formPassphrase, setFormPassphrase] = useState('');
  const [formSaveProfile, setFormSaveProfile] = useState(false);

  // Editing profile in manager
  const [editingProfile, setEditingProfile] = useState<Partial<SshProfile> | null>(null);

  // Terminals and WebSockets map per tab
  const terminalInstances = useRef<Map<string, { term: Terminal; fitAddon: FitAddon; ws: WebSocket | null }>>(new Map());
  const terminalContainers = useRef<Map<string, HTMLDivElement>>(new Map());
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Load saved SSH profiles from backend
  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoadingProfiles(true);
      const res = await fetch('/api/ssh/profiles');
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (e) {
      console.error('Failed to load SSH profiles:', e);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Persist background settings to parent
  const handleConfigChange = (updates: Partial<{ opacity: number; transparent: boolean; blur: number; fontSize: number }>) => {
    const newConfig = {
      ...config,
      opacity: updates.opacity !== undefined ? updates.opacity : bgOpacity,
      transparent: updates.transparent !== undefined ? updates.transparent : isTransparent,
      blur: updates.blur !== undefined ? updates.blur : bgBlur,
      fontSize: updates.fontSize !== undefined ? updates.fontSize : fontSize,
    };
    if (updates.opacity !== undefined) setBgOpacity(updates.opacity);
    if (updates.transparent !== undefined) setIsTransparent(updates.transparent);
    if (updates.blur !== undefined) setBgBlur(updates.blur);
    if (updates.fontSize !== undefined) {
      setFontSize(updates.fontSize);
      // update all running terminals
      terminalInstances.current.forEach(({ term, fitAddon }) => {
        term.options.fontSize = updates.fontSize;
        try { fitAddon.fit(); } catch {}
      });
    }
    onUpdateConfig(newConfig);
  };

  // Adjust font size dynamically when layoutSize changes if not manually overridden
  useEffect(() => {
    if (!config.fontSize) {
      const defaultSize = layoutSize === 'small' ? 11 : layoutSize === 'large' ? 14 : 12;
      setFontSize(defaultSize);
      terminalInstances.current.forEach(({ term, fitAddon }) => {
        term.options.fontSize = defaultSize;
        try { fitAddon.fit(); } catch {}
      });
    }
  }, [layoutSize, config.fontSize]);

  // Connect active tab to SSH
  const connectTab = useCallback((tabId: string, conn: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
  }) => {
    const container = terminalContainers.current.get(tabId);
    if (!container) return;

    // Close any existing connection for this tab
    const existing = terminalInstances.current.get(tabId);
    if (existing?.ws) {
      try { existing.ws.close(); } catch {}
    }

    // Set tab status
    setTabs(prev => prev.map(t => t.id === tabId ? {
      ...t,
      host: conn.host,
      port: conn.port,
      username: conn.username,
      status: 'connecting',
      errorMessage: undefined,
      title: `${conn.username}@${conn.host}`
    } : t));

    // Clear terminal container or reuse
    let term: Terminal;
    let fitAddon: FitAddon;

    if (existing) {
      term = existing.term;
      fitAddon = existing.fitAddon;
      term.clear();
      term.reset();
    } else {
      term = new Terminal({
        cursorBlink: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: fontSize,
        theme: {
          background: 'rgba(0, 0, 0, 0)',
          foreground: '#f3f4f6',
          cursor: '#60a5fa',
          cursorAccent: '#1e293b',
          selectionBackground: 'rgba(59, 130, 246, 0.35)',
          black: '#1e293b',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#38bdf8',
          white: '#f3f4f6',
          brightBlack: '#64748b',
          brightRed: '#ef4444',
          brightGreen: '#22c55e',
          brightYellow: '#eab308',
          brightBlue: '#3b82f6',
          brightMagenta: '#a855f7',
          brightCyan: '#0ea5e9',
          brightWhite: '#ffffff'
        },
        allowTransparency: true,
        scrollback: 2000
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(container);
      try { fitAddon.fit(); } catch {}
    }

    term.writeln(`\x1b[36mConnecting to \x1b[1m${conn.username}@${conn.host}:${conn.port}\x1b[0;36m...\x1b[0m\r\n`);

    // Determine WS protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/terminal/ws`;
    const ws = new WebSocket(wsUrl);

    terminalInstances.current.set(tabId, { term, fitAddon, ws });

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'connect',
        host: conn.host,
        port: conn.port,
        username: conn.username,
        password: conn.password,
        privateKey: conn.privateKey,
        passphrase: conn.passphrase,
        cols: term.cols || 80,
        rows: term.rows || 24,
        term: 'xterm-256color'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'data') {
          term.write(msg.data);
        } else if (msg.type === 'status') {
          if (msg.status === 'connected') {
            setTabs(prev => prev.map(t => t.id === tabId ? { ...t, status: 'connected' } : t));
            term.writeln(`\x1b[32m✔ ${msg.message}\x1b[0m\r\n`);
          } else if (msg.status === 'closed' || msg.status === 'disconnected') {
            setTabs(prev => prev.map(t => t.id === tabId ? { ...t, status: 'disconnected' } : t));
            term.writeln(`\x1b[33m${msg.message}\x1b[0m`);
          }
        } else if (msg.type === 'error') {
          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, status: 'error', errorMessage: msg.message } : t));
          term.writeln(`\r\n\x1b[31m✖ Error: ${msg.message}\x1b[0m\r\n`);
        }
      } catch (err) {
        term.write(event.data);
      }
    };

    ws.onerror = () => {
      setTabs(prev => prev.map(t => t.id === tabId ? { ...t, status: 'error', errorMessage: 'WebSocket connection failed' } : t));
      term.writeln(`\r\n\x1b[31m✖ WebSocket network error.\x1b[0m\r\n`);
    };

    ws.onclose = () => {
      setTabs(prev => prev.map(t => t.id === tabId && t.status !== 'error' ? { ...t, status: 'disconnected' } : t));
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'data', data }));
      }
    });

    // Auto-fit immediately
    setTimeout(() => {
      try {
        fitAddon.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'resize', cols: term.cols, rows: term.rows }));
        }
      } catch {}
    }, 100);
  }, [fontSize]);

  // Handle active tab change and refit
  useEffect(() => {
    const inst = terminalInstances.current.get(activeTabId);
    if (inst) {
      setTimeout(() => {
        try {
          inst.fitAddon.fit();
          inst.term.focus();
        } catch {}
      }, 50);
    }
  }, [activeTabId]);

  // ResizeObserver for GridStack scaling and responsive fit
  useEffect(() => {
    if (!widgetContainerRef.current) return;

    resizeObserver.current = new ResizeObserver(() => {
      terminalInstances.current.forEach(({ term, fitAddon, ws }) => {
        try {
          fitAddon.fit();
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'resize', cols: term.cols, rows: term.rows }));
          }
        } catch {}
      });
    });

    resizeObserver.current.observe(widgetContainerRef.current);

    return () => {
      resizeObserver.current?.disconnect();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      terminalInstances.current.forEach(({ term, ws }) => {
        try { ws?.close(); } catch {}
        try { term.dispose(); } catch {}
      });
      terminalInstances.current.clear();
    };
  }, []);

  // Add new tab
  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: TerminalTab = {
      id: newId,
      title: `Session ${tabs.length + 1}`,
      host: '',
      port: 22,
      username: '',
      status: 'disconnected'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setShowConnectDialog(true);
    // Reset quick connect form
    setFormHost('');
    setFormUser('');
    setFormPort(22);
    setFormPassword('');
    setFormPrivateKey('');
    setFormPassphrase('');
  };

  // Close tab
  const closeTab = (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const inst = terminalInstances.current.get(tabId);
    if (inst) {
      try { inst.ws?.close(); } catch {}
      try { inst.term.dispose(); } catch {}
      terminalInstances.current.delete(tabId);
      terminalContainers.current.delete(tabId);
    }

    if (tabs.length === 1) {
      // Re-initialize single tab
      const newId = `tab-${Date.now()}`;
      setTabs([{
        id: newId,
        title: 'New Session',
        host: '',
        port: 22,
        username: '',
        status: 'disconnected'
      }]);
      setActiveTabId(newId);
      setShowConnectDialog(true);
      return;
    }

    const nextTabs = tabs.filter(t => t.id !== tabId);
    setTabs(nextTabs);
    if (activeTabId === tabId) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
  };

  // Submit connect form
  const handleConnectSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formHost.trim() || !formUser.trim()) return;

    if (formSaveProfile) {
      try {
        const res = await fetch('/api/ssh/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim() || `${formUser}@${formHost}`,
            host: formHost.trim(),
            port: Number(formPort) || 22,
            username: formUser.trim(),
            authType: formAuthType,
            privateKey: formPrivateKey,
            passphrase: formPassphrase
          })
        });
        if (res.ok) {
          fetchProfiles();
        }
      } catch (err) {
        console.error('Failed to save profile:', err);
      }
    }

    connectTab(activeTabId, {
      host: formHost.trim(),
      port: Number(formPort) || 22,
      username: formUser.trim(),
      password: formAuthType === 'password' ? formPassword : undefined,
      privateKey: formAuthType === 'privateKey' ? formPrivateKey : undefined,
      passphrase: formPassphrase
    });

    setShowConnectDialog(false);
  };

  // Pick profile to connect
  const handleSelectProfile = (p: SshProfile) => {
    setFormName(p.name);
    setFormHost(p.host);
    setFormPort(p.port);
    setFormUser(p.username);
    setFormAuthType(p.authType);
    setFormPrivateKey(p.privateKey || '');
    setFormPassphrase(p.passphrase || '');

    if (p.authType === 'password') {
      // Prompt for password if not saved
      setShowConnectDialog(true);
    } else {
      connectTab(activeTabId, {
        host: p.host,
        port: p.port,
        username: p.username,
        privateKey: p.privateKey,
        passphrase: p.passphrase
      });
      setShowConnectDialog(false);
      setShowProfilesModal(false);
    }
  };

  // Delete profile
  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ssh/profiles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProfiles(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete profile:', err);
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Background styling computation
  const backgroundStyle = isTransparent
    ? {
        backgroundColor: `rgba(15, 17, 23, ${bgOpacity / 100})`,
        backdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : 'none',
        WebkitBackdropFilter: bgBlur > 0 ? `blur(${bgBlur}px)` : 'none'
      }
    : {
        backgroundColor: '#0f1117'
      };

  return (
    <div
      ref={widgetContainerRef}
      className={`grid-stack-item-content relative flex flex-col w-full h-full rounded-2xl border border-neutral-800/80 shadow-2xl overflow-hidden transition-colors ${
        isExpanded ? '!fixed !inset-4 !z-[999999] !w-auto !h-auto !rounded-2xl' : ''
      }`}
      style={backgroundStyle}
    >
      {/* Top Header / Tab Bar (acts as drag handle for GridStack) */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-neutral-800/80 bg-neutral-900/60 select-none shrink-0 gap-1.5 cursor-grab active:cursor-grabbing">
        
        {/* Left: Drag grip & Tab strip */}
        <div className="flex items-center space-x-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar">
          <div className="text-neutral-500 hover:text-neutral-300 p-0.5 shrink-0" title="Drag Widget">
            <GripHorizontal size={14} />
          </div>

          <div className="flex items-center space-x-1 min-w-0">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    if (tab.status === 'disconnected') {
                      setShowConnectDialog(true);
                    }
                  }}
                  className={`no-drag group relative flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 max-w-[140px] truncate ${
                    isActive
                      ? 'bg-neutral-800/90 text-neutral-100 shadow-sm border border-neutral-700/60'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                  }`}
                >
                  {/* Status Indicator Dot */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      tab.status === 'connected'
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : tab.status === 'connecting'
                        ? 'bg-amber-400 animate-pulse'
                        : tab.status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-neutral-600'
                    }`}
                  />
                  
                  <span className="truncate">{tab.title}</span>

                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-0.5 rounded transition-opacity"
                    title="Close session"
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}

            {/* Add Tab Button */}
            <button
              onClick={addTab}
              className="no-drag flex items-center justify-center p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors shrink-0"
              title="New Terminal Tab"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Right: Controls & Options */}
        <div className="no-drag flex items-center space-x-1 shrink-0">
          
          {/* Quick Connect / Profiles Dialog Trigger */}
          <button
            onClick={() => setShowProfilesModal(true)}
            className="p-1 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-neutral-800/50 transition-colors"
            title="Saved SSH Connections"
          >
            <Server size={13} />
          </button>

          {/* Reconnect button for active tab */}
          {activeTab && activeTab.host && (
            <button
              onClick={() => {
                if (activeTab.host) {
                  connectTab(activeTab.id, {
                    host: activeTab.host,
                    port: activeTab.port || 22,
                    username: activeTab.username,
                    password: activeTab.password,
                    privateKey: activeTab.privateKey,
                    passphrase: activeTab.passphrase
                  });
                }
              }}
              className="p-1 rounded-lg text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800/50 transition-colors"
              title="Reconnect Session"
            >
              <RefreshCw size={13} className={activeTab.status === 'connecting' ? 'animate-spin' : ''} />
            </button>
          )}

          {/* Appearance / Transparency Settings */}
          <div className="relative">
            <button
              onClick={() => setShowAppearanceMenu(prev => !prev)}
              className={`p-1 rounded-lg transition-colors ${
                showAppearanceMenu ? 'bg-neutral-800 text-blue-400' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              title="Appearance & Transparency"
            >
              <Sliders size={13} />
            </button>

            {/* Appearance Popover Menu */}
            {showAppearanceMenu && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-64 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 rounded-xl p-3.5 shadow-2xl z-50 text-xs text-neutral-200 space-y-3 animate-in fade-in zoom-in-95 duration-100"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="font-semibold text-neutral-100">Terminal Appearance</span>
                  <button 
                    onClick={() => setShowAppearanceMenu(false)}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Transparency Mode Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Transparent Glass</span>
                  <button
                    onClick={() => handleConfigChange({ transparent: !isTransparent })}
                    className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                      isTransparent ? 'bg-blue-600' : 'bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isTransparent ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Opacity Slider */}
                {isTransparent && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Background Opacity</span>
                      <span className="text-neutral-200 font-mono">{bgOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgOpacity}
                      onChange={(e) => handleConfigChange({ opacity: Number(e.target.value) })}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                )}

                {/* Blur Slider */}
                {isTransparent && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Backdrop Blur</span>
                      <span className="text-neutral-200 font-mono">{bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={bgBlur}
                      onChange={(e) => handleConfigChange({ blur: Number(e.target.value) })}
                      className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                )}

                {/* Font Size Selector */}
                <div className="space-y-1 pt-1 border-t border-neutral-800">
                  <div className="flex justify-between text-neutral-400 text-[11px]">
                    <span>Font Size</span>
                    <span className="text-neutral-200 font-mono">{fontSize}px</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[10, 11, 12, 13, 14, 16].map(sz => (
                      <button
                        key={sz}
                        onClick={() => handleConfigChange({ fontSize: sz })}
                        className={`flex-1 py-1 rounded text-center text-[10px] font-mono transition-colors ${
                          fontSize === sz ? 'bg-blue-600 text-white font-bold' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Expansion Toggle */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors"
            title={isExpanded ? 'Restore Size' : 'Expand Terminal'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Remove Widget */}
          <button
            onClick={onRemove}
            className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/50 transition-colors"
            title="Remove Terminal Widget"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Terminal Viewport / Content Area */}
      <div className="no-drag relative flex-1 w-full min-h-0 overflow-hidden">
        
        {/* Render each tab's container (hidden when not active to preserve scrollback & session) */}
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(el) => {
              if (el) terminalContainers.current.set(tab.id, el);
            }}
            className={`w-full h-full p-2 overflow-hidden ${tab.id === activeTabId ? 'block' : 'hidden'}`}
          />
        ))}

        {/* Quick Connect / New Session Overlay when tab is disconnected */}
        {activeTab && activeTab.status === 'disconnected' && showConnectDialog && (
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-20 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-sm bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 my-auto">
              
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <TerminalIcon size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-100">SSH Connect</h4>
                    <p className="text-[10px] text-neutral-400">Connect to remote Linux / Unix host</p>
                  </div>
                </div>

                {profiles.length > 0 && (
                  <button
                    onClick={() => setShowProfilesModal(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <span>Saved ({profiles.length})</span>
                  </button>
                )}
              </div>

              {/* Quick Pick Profiles if any */}
              {profiles.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Quick Saved Connection</span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                    {profiles.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProfile(p)}
                        className="flex items-center space-x-2 p-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/50 text-left transition-colors"
                      >
                        <Server size={13} className="text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-neutral-200 truncate">{p.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{p.username}@{p.host}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Connect Form */}
              <form onSubmit={handleConnectSubmit} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-medium text-neutral-400">Host / IP</label>
                    <input
                      type="text"
                      placeholder="192.168.1.50 or vps.net"
                      value={formHost}
                      onChange={e => setFormHost(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-neutral-400">Port</label>
                    <input
                      type="number"
                      value={formPort}
                      onChange={e => setFormPort(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-neutral-400">Username</label>
                  <input
                    type="text"
                    placeholder="root, ubuntu, or user"
                    value={formUser}
                    onChange={e => setFormUser(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Auth Mode Toggle */}
                <div className="flex rounded-lg bg-neutral-950 p-0.5 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setFormAuthType('password')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      formAuthType === 'password' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Lock size={12} />
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAuthType('privateKey')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      formAuthType === 'privateKey' ? 'bg-neutral-800 text-neutral-100 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Key size={12} />
                    Private Key
                  </button>
                </div>

                {formAuthType === 'password' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-neutral-400">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-neutral-400">Private Key (OpenSSH / PEM)</label>
                      <textarea
                        rows={3}
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                        value={formPrivateKey}
                        onChange={e => setFormPrivateKey(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-neutral-400">Passphrase (if key is encrypted)</label>
                      <input
                        type="password"
                        placeholder="Optional"
                        value={formPassphrase}
                        onChange={e => setFormPassphrase(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Save connection checkbox */}
                <div className="pt-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`save-prof-${activeTabId}`}
                    checked={formSaveProfile}
                    onChange={e => setFormSaveProfile(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-800 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor={`save-prof-${activeTabId}`} className="text-xs text-neutral-300 select-none">
                    Save connection profile
                  </label>
                </div>

                {formSaveProfile && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Profile label (e.g. Home Server)"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
                  >
                    <span>Connect</span>
                  </button>
                  {activeTab.host && (
                    <button
                      type="button"
                      onClick={() => setShowConnectDialog(false)}
                      className="px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2 rounded-xl text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Saved SSH Profiles Modal */}
      {showProfilesModal && (
        <div 
          className="fixed inset-0 z-[1000000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowProfilesModal(false)}
        >
          <div 
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-neutral-200 space-y-4 max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Server size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">Saved SSH Connections</h3>
                  <p className="text-xs text-neutral-400">Quickly launch remote shell sessions</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfilesModal(false)}
                className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profiles List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-[140px]">
              {profiles.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  No saved SSH profiles yet. Check "Save connection profile" when connecting to save one!
                </div>
              ) : (
                profiles.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className="group flex items-center justify-between p-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/50 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 group-hover:bg-blue-500/10 flex items-center justify-center text-neutral-400 group-hover:text-blue-400 transition-colors">
                        <TerminalIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-200 truncate">{p.name}</p>
                        <p className="text-xs text-neutral-400 truncate">
                          {p.username}@{p.host}:{p.port}
                          <span className="ml-2 text-[10px] text-neutral-500 uppercase">{p.authType}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={(e) => handleDeleteProfile(p.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-700 transition-all"
                        title="Delete connection"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-neutral-800 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setShowProfilesModal(false);
                  setShowConnectDialog(true);
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>New Connection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
