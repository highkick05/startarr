import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { Plus, X, Link2, Loader2, LayoutGrid, Search, Globe, Settings, Trash2, Image as ImageIcon, Video as VideoIcon, Upload, Trash, LogOut, User, ArrowRight } from 'lucide-react';
import { ShortcutItem } from './types';
import { AuthContext } from './Auth.tsx';
import { popularApps } from './data';

type LayoutSize = 'small' | 'medium' | 'large';

export default function App() {
  const { user, logout } = React.useContext(AuthContext);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(res => res.ok ? res.json() : null).catch(() => null),
      fetch('/api/backgrounds').then(res => res.ok ? res.json() : []).catch(() => [])
    ]).then(([settings, bgData]) => {
      if (settings) {
        if (settings.layout_size) setLayoutSize(settings.layout_size);
        if (settings.active_background) setActiveBackground(settings.active_background);
        if (settings.tint_color) setTintColor(settings.tint_color);
        if (settings.tint_opacity !== null) setTintOpacity(settings.tint_opacity);
      }
      if (settings && settings.shortcuts_json) {
        try {
          const parsed = JSON.parse(settings.shortcuts_json);
          if (parsed && parsed.length > 0) {
            setShortcuts(parsed.map((p: any) => ({
              ...p,
              w: p.type === 'app' ? 1 : p.w,
              h: p.type === 'app' ? 1 : p.h
            })));
            // Also need to re-render grid since API loaded!
          }
        } catch (e) {}
      }
      if (bgData && Array.isArray(bgData)) setBackgrounds(bgData);
      if (false) {
        // Build hierarchy if needed, assuming the DB returns flat or hierarchical. 
        // For simplicity, assuming backend stores flat and we just use the raw array if we stringified it.
        // Oh wait, backend shortcuts are flat. But localStorage shortcuts had nested children.
      }
      setDataLoaded(true);
    }).catch(console.error);
  }, []);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const gridInstance = useRef<GridStack | null>(null);
  const itemRegistry = useRef<Map<string, ShortcutItem>>(new Map());

  const [layoutSize, setLayoutSize] = useState<LayoutSize>('medium');

    const updateShortcutDynamically = (id: string, updates: Partial<ShortcutItem>) => {
    // 1. Update React state and localStorage
    setShortcuts(prev => {
      const updateDeep = (list: ShortcutItem[]): ShortcutItem[] => {
        return list.map(item => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          if (item.children) {
            return { ...item, children: updateDeep(item.children) };
          }
          return item;
        });
      };
      const updated = updateDeep(prev);
      fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
      return updated;
    });
    
    // 2. Update the registry
    const existing = itemRegistry.current.get(id);
    if (existing) {
       itemRegistry.current.set(id, { ...existing, ...updates });
    }

    // 3. Update the DOM element
    const el = document.querySelector(`[gs-id="${id}"]`);
    if (el) {
       const item = { ...existing, ...updates } as ShortcutItem;
       // Since it's an app, it has title and icon.
       const titleEl = el.querySelector('span.font-medium');
       if (titleEl && updates.title !== undefined) {
         titleEl.textContent = updates.title || 'Unknown';
       }
       const imgEl = el.querySelector('img');
       if (imgEl) {
          const domain = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
          const fallbackIcon = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128`;
          const googleIcon = domain ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128` : fallbackIcon;
      const primaryIcon = domain ? `https://icon.horse/icon/${domain}` : googleIcon;
          
          if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
             imgEl.src = item.iconUrl || primaryIcon;
             imgEl.setAttribute('onload', `if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='${fallbackIcon}'; }`);
             imgEl.setAttribute('onerror', `if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='${fallbackIcon}'; } else { this.onerror=null; }`);
             imgEl.dataset.fallback = '0';
          }
       }
       
       // Handle category titles
       const h2El = el.querySelector('h2');
       if (h2El && updates.title !== undefined) {
           h2El.textContent = updates.title || 'Unknown';
       }
       
       // Handle container titles
       const h3El = el.querySelector('h3');
       if (h3El && updates.title !== undefined) {
           h3El.textContent = updates.title || 'Unknown';
       }
       
       // Handle onclick URL
       const contentEl = el.querySelector('.grid-stack-item-content');
       if (contentEl && item.type === 'app' && updates.url !== undefined) {
          contentEl.setAttribute('onclick', `if(!this.parentElement.classList.contains('ui-draggable-dragging') && !this.parentElement.classList.contains('grid-stack-item-dragging')) window.open('${updates.url}', '_blank')`);
       }
    }
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    const saved = localStorage.getItem('shortcuts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed.map((p: any) => ({
            ...p,
            w: p.type === 'app' ? 1 : p.w,
            h: p.type === 'app' ? 1 : p.h
          }));
        }
      } catch (e) {
        console.error('Failed to parse shortcuts', e);
      }
    }
    return [
      { id: '1', title: 'Google', url: 'https://google.com', x: 0, y: 0, w: 1, h: 1, type: 'app' },
      { id: '2', title: 'GitHub', url: 'https://github.com', x: 1, y: 0, w: 1, h: 1, type: 'app' },
      { id: '3', title: 'YouTube', url: 'https://youtube.com', x: 2, y: 0, w: 1, h: 1, type: 'app' }
    ];
  });

  const getMaxColumns = (size = layoutSize) => {
    if (size === 'small') return 24;
    if (size === 'large') return 12;
    return 18;
  };
  const getColumns = (size = layoutSize) => {
    if (typeof window === 'undefined') return 6;
    const w = window.innerWidth;
    if (size === 'small') {
      if (w < 480) return 8;
      if (w < 768) return 12;
      if (w < 1024) return 16;
      if (w < 1280) return 20;
      return 24;
    }
    if (size === 'large') {
      if (w < 480) return 4;
      if (w < 768) return 6;
      if (w < 1024) return 8;
      if (w < 1280) return 10;
      return 12;
    }
    // medium
    if (w < 480) return 6;
    if (w < 768) return 8;
    if (w < 1024) return 12;
    if (w < 1280) return 14;
    if (w < 1600) return 16;
    return 18;
  };

  const getCellHeight = (size = layoutSize) => {
    if (typeof window === 'undefined') return 80;
    const w = window.innerWidth;
    let padding = 32; // w-full mx-auto px-4 (16px * 2) = 32px
    if (w >= 1024) padding = 64; // lg:px-8 (32px * 2) = 64px
    else if (w >= 640) padding = 48; // sm:px-6 (24px * 2) = 48px
    
    return Math.max(40, Math.floor((w - padding) / getColumns(size)));
  };

  const currentCols = useRef(getColumns(layoutSize));
  const gridKey = useRef(0); // Used to force-remount grid when layout size changes

  const [searchQuery, setSearchQuery] = useState('');
  const [customAppModal, setCustomAppModal] = useState<{ visible: boolean, url: string }>({ visible: false, url: '' });
  const [iconSelectorModal, setIconSelectorModal] = useState<{ visible: boolean, shortcut: ShortcutItem | null }>({ visible: false, shortcut: null });
  const [scrapedMetadata, setScrapedMetadata] = useState<{ title: string, icons: string[] } | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [selectedCustomIcon, setSelectedCustomIcon] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);

  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMouseNearBottom, setIsMouseNearBottom] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [activeBackground, setActiveBackground] = useState('https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2560&q=80');
  console.log("Current activeBackground:", activeBackground);
  const [tintColor, setTintColor] = useState('#000000');
  const [tintOpacity, setTintOpacity] = useState(40);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    fetch('/api/backgrounds')
      .then(res => {
        if (res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) setBackgrounds(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('activeBackground', activeBackground);
    localStorage.setItem('tintColor', tintColor);
    localStorage.setItem('tintOpacity', String(tintOpacity));
    if (dataLoaded) {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_background: activeBackground,
          tint_color: tintColor,
          tint_opacity: tintOpacity
        })
      }).catch(console.error);
    }
  }, [activeBackground, tintColor, tintOpacity, dataLoaded]);

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    setUploadingBg(true);
    try {
      const res = await fetch('/api/backgrounds', { method: 'POST', body: formData });
      if (!res.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Upload intercepted or failed');
      }
      const newBg = await res.json();
      setBackgrounds(prev => [...prev, newBg]);
      setActiveBackground(newBg.url);
    } catch (err) {
      // silently fail if intercepted
    } finally {
      setUploadingBg(false);
      e.target.value = '';
    }
  };

  const handleDeleteBg = async (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/backgrounds/${id}`, { method: 'DELETE' });
      setBackgrounds(prev => prev.filter(b => b.id !== id));
      if (activeBackground === url) {
        setActiveBackground('none');
      }
    } catch (err) {
      // silently fail if intercepted
    }
  };

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    shortcut: ShortcutItem | null;
  }>({ visible: false, x: 0, y: 0, shortcut: null });

  

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return popularApps
      .filter(app => app.title.toLowerCase().includes(searchQuery.toLowerCase()) || app.url.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8);
  }, [searchQuery]);

  // Track mouse position to reveal bottom bar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 120; // Show when within 120px of bottom
      const nearBottom = (window.innerHeight - e.clientY) <= threshold;
      setIsMouseNearBottom(nearBottom);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Set up global shortcut removal for inline HTML onclick handlers
  useEffect(() => {
    (window as any).removeShortcut = (id: string) => {
      const event = new CustomEvent('remove-shortcut', { detail: { id } });
      window.dispatchEvent(event);
    };

    const handleRemove = (e: any) => {
      const id = e.detail.id;
      if (gridInstance.current) {
        const el = document.querySelector(`[gs-id="${id}"]`);
        if (el) {
          let removed = false;
          // Try GridStack node's grid reference
          if ((el as any).gridstackNode && (el as any).gridstackNode.grid) {
             (el as any).gridstackNode.grid.removeWidget(el, true);
             removed = true;
          } 
          if (!removed) {
            const parentGrid = el.closest('.grid-stack');
            if (parentGrid && (parentGrid as any).gridstack) {
              (parentGrid as any).gridstack.removeWidget(el, true);
              removed = true;
            }
          }
          if (!removed) {
            gridInstance.current.removeWidget(el, true);
          }
          
          // Force remove from DOM if gridstack failed
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
          
          // Force update React state
          setShortcuts(prev => {
            const removeDeep = (list: ShortcutItem[]): ShortcutItem[] => {
              return list.filter(i => i.id !== id).map(i => {
                if (i.children) return { ...i, children: removeDeep(i.children) };
                return i;
              });
            };
            const updated = removeDeep(prev);
            fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
            
            // Trigger a resize event to ensure layout recalculations (instead of full reload)
            setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
            return updated;
          });
        }
      }
    };

    window.addEventListener('remove-shortcut', handleRemove);
    return () => {
      window.removeEventListener('remove-shortcut', handleRemove);
      delete (window as any).removeShortcut;
    };
  }, []);

  // Update layout size in local storage
  useEffect(() => {
    localStorage.setItem('layoutSize', layoutSize);
    if (dataLoaded) {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_size: layoutSize })
      }).catch(console.error);
    }
  }, [layoutSize, dataLoaded]);

  const isInitializing = useRef(false);
  const allowSave = useRef(false);

  // Initialize GridStack
  useEffect(() => {
    if (!gridContainerRef.current) return;
    isInitializing.current = true;
    
    currentCols.current = getColumns(layoutSize);
    const maxCols = getMaxColumns(layoutSize);
    gridContainerRef.current.innerHTML = '';
    
    const calculateMinRows = () => {
      if (typeof window === 'undefined') return 1;
      const availableHeight = window.innerHeight - 240; // Approx header and footer space
      const ch = getCellHeight(layoutSize) + 2;
      return Math.max(1, Math.floor(availableHeight / ch));
    };

    gridInstance.current = GridStack.init({
      column: maxCols,
      cellHeight: getCellHeight(layoutSize),
      margin: 2,
      minRow: calculateMinRows(),
      float: true,
      animate: true,
      disableResize: false,
      acceptWidgets: true,
      draggable: {
        cancel: '.no-drag' // don't drag if clicking buttons like remove
      }
    }, gridContainerRef.current);

    // Initial load silently
    gridInstance.current.removeAll();
    shortcuts.forEach(item => addWidgetToGrid(item));

    if (maxCols !== currentCols.current) {
      gridInstance.current.column(currentCols.current, 'move');
    }

    isInitializing.current = false;
    setTimeout(() => { allowSave.current = true; }, 2000);

    // Now listen to events
    
    // Ensure all items are in registry
    const addToRegistry = (list: ShortcutItem[]) => {
      list.forEach(i => {
        itemRegistry.current.set(i.id, { ...i });
        if (i.children) addToRegistry(i.children);
      });
    };
    addToRegistry(shortcuts);

    const handleGridChange = (event, items) => {
      // If a container was resized, make sure its subgrid column count matches
      if (items && gridInstance.current) {
        (items as any[]).forEach(item => {
          if (item.subGrid) {
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'move');
            }
            if ((item.subGrid as any).updateMinSize) {
              setTimeout(() => {
                 (item.subGrid as any).updateMinSize();
                 // Force a layout refresh for the parent grid so it reflects the snapped height
              }, 150);
            }
          }
        });
      }
      saveGridState();
    };
    
    gridInstance.current.on('change', (e, items) => { handleGridChange(e, items); });
    gridInstance.current.on('added', handleGridChange);
    gridInstance.current.on('removed', handleGridChange);

    const handleResize = () => {
      allowSave.current = false;
      if (!gridInstance.current) return;
      const newCols = getColumns(layoutSize);
      if (currentCols.current !== newCols) {
        currentCols.current = newCols;
        gridInstance.current.column(newCols, 'move');
      }
      
      const newCellHeight = getCellHeight(layoutSize);
      gridInstance.current.cellHeight(newCellHeight);
      
      // Also update any subgrids
      gridInstance.current.engine.nodes.forEach(node => {
        if (node.subGrid) {
          node.subGrid.cellHeight(newCellHeight);
        }
      });
    };

    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        handleResize();
        setTimeout(() => { allowSave.current = true; }, 1000);
      }, 150);
    };

    
    window.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      const itemEl = target.closest('.grid-stack-item');
      if (itemEl) {
        e.preventDefault();
        const id = itemEl.getAttribute('gs-id');
        if (id) {
          // Find the shortcut
          setShortcuts(prev => {
            const findDeep = (list: ShortcutItem[], searchId: string): ShortcutItem | null => {
               for (const i of list) {
                 if (i.id === searchId) return i;
                 if (i.children) {
                   const found = findDeep(i.children, searchId);
                   if (found) return found;
                 }
               }
               return null;
            };
            const found = findDeep(prev, id);
            if (found && found.type !== 'category') {
              setContextMenu({
                visible: true,
                x: Math.min(e.clientX, window.innerWidth - 200),
                y: Math.min(e.clientY, window.innerHeight - 200),
                shortcut: found
              });
            }
            return prev;
          });
        }
      } else {
        setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
      }
    });

    window.addEventListener('click', () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    });

    window.addEventListener('resize', debouncedResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (gridInstance.current) {
        gridInstance.current.off('change', handleGridChange);
        gridInstance.current.off('added', handleGridChange);
        gridInstance.current.off('removed', handleGridChange);
        gridInstance.current.destroy(false);
      }
    };
  }, [layoutSize, dataLoaded]); // Re-init grid when layoutSize changes or data finishes loading

  const saveGridState = () => {

    if (!gridInstance.current || isInitializing.current || !allowSave.current) return;
    const extractNodes = (grid: any): any[] => {
      if (!grid || !grid.engine || !grid.engine.nodes) return [];
      return grid.engine.nodes.map((node: any) => {
        const rawId = node.id || node.el?.getAttribute("gs-id");
        const id = rawId ? String(rawId) : undefined;
        const res: any = { id, x: node.x, y: node.y, w: node.w, h: node.h };
        if (node.subGrid) {
          res.children = extractNodes(node.subGrid);
        }
        return res;
      });
    };
    const items = extractNodes(gridInstance.current);


    
    setShortcuts(prev => {
      // Deep find helper
      const findDeep = (list: ShortcutItem[], searchId: string): ShortcutItem | null => {
         for (const i of list) {
           if (i.id === searchId) return i;
           if (i.children) {
             const found = findDeep(i.children, searchId);
             if (found) return found;
           }
         }
         return null;
      };

      const safeFind = (searchId: string) => {
        if (itemRegistry.current.has(searchId)) {
           return itemRegistry.current.get(searchId);
        }
        let found = findDeep(prev, searchId);
        if (!found) found = findDeep(JSON.parse(localStorage.getItem('shortcuts') || '[]'), searchId);
        return found;
      };

      // Recursive map to preserve children
      const mapItem = (item: any): ShortcutItem | null => {
        const rawId = item.id || item.content?.match(/gs-id="([^"]+)"/)?.[1] || item.el?.getAttribute('gs-id');
        const id = rawId ? String(rawId) : null;
        const existing = id ? safeFind(id) : null;
        if (!existing) return null;

        const childrenData = item.subGrid?.children || item.subGridOpts?.children || item.children;
        const mappedChildren = (childrenData && Array.isArray(childrenData))
          ? childrenData.map(mapItem).filter(Boolean) as ShortcutItem[]
          : [];

        return {
          id: existing.id,
          type: existing.type,
          title: existing.title,
          url: existing.url,
          iconUrl: existing.iconUrl,
          sizeToContent: existing.sizeToContent,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          children: mappedChildren.length > 0 ? mappedChildren : undefined
        };
      };

      const updated = items.map(mapItem).filter(Boolean) as ShortcutItem[];
      fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
      return updated;
    });
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://icon.horse/icon/${domain}`;
    } catch {
      return '';
    }
  };

  const addWidgetToGrid = (item: ShortcutItem, targetGrid?: any) => {
    const grid = targetGrid || gridInstance.current;
    if (!grid) return;
    
    let htmlContent = '';
    const isSmall = layoutSize === 'small';
    const paddingClass = isSmall ? 'p-1' : 'p-2';
    const textMarginClass = isSmall ? 'mt-0' : 'mt-1';
    const titleStyle = isSmall ? 'font-size: 0.6rem; line-height: 0.8rem;' : 'font-size: clamp(0.65rem, 2vw, 0.75rem);';

    if (item.type === 'category') {
      htmlContent = `
        <div class="grid-stack-item-content relative group flex flex-col justify-end pb-2 border-b-2 border-neutral-800/60 hover:border-neutral-600 transition-colors cursor-grab active:cursor-grabbing">
          <h2 class="text-xl font-bold text-neutral-300 px-2 tracking-wide pointer-events-none">${item.title}</h2>
          <button class="no-drag absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500" onclick="window.removeShortcut('${item.id}')" title="Remove category">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      `;
    } else if (item.type === 'container') {
      htmlContent = `
        <div class="grid-stack-item-content relative group bg-neutral-900 border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col p-2">
          <div class="flex justify-between items-center px-2 pb-2 border-b border-neutral-800/50 mb-2 pointer-events-none">
            <h3 class="font-semibold text-neutral-300 text-sm">${item.title}</h3>
            <button class="no-drag pointer-events-auto absolute top-2 right-2 p-1 bg-neutral-800 text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white" onclick="window.removeShortcut('${item.id}')" title="Remove container">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div class="grid-stack flex-1"></div>
        </div>
      `;
    } else {
      const domain = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
      const fallbackIcon = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128`;
      const googleIcon = domain ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128` : fallbackIcon;
      const primaryIcon = domain ? `https://icon.horse/icon/${domain}` : googleIcon;
      const iconUrl = item.iconUrl || primaryIcon;

      htmlContent = `
        <div class="grid-stack-item-content relative group flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-300 hover:scale-105 hover:bg-neutral-800/30 rounded-2xl"
             onclick="if(!this.parentElement.classList.contains('ui-draggable-dragging') && !this.parentElement.classList.contains('grid-stack-item-dragging')) window.open('${item.url}', '_blank')">

          <div class="pointer-events-none w-full h-full flex flex-col items-center justify-between ${paddingClass}">
            <div class="flex-1 w-full min-h-0 flex items-center justify-center mt-1">
              <img src="${iconUrl}"  onload="if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='${fallbackIcon}'; }" onerror="if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='${fallbackIcon}'; } else { this.onerror=null; }" alt="${item.title}" draggable="false" style="width: 100%; height: 100%; aspect-ratio: 1/1;" class="object-contain drop-shadow-md hover:drop-shadow-xl transition-transform duration-300 rounded-xl" />
            </div>
            <span style="${titleStyle}" class="font-medium text-neutral-300 truncate w-full text-center px-0.5 ${textMarginClass} tracking-wide drop-shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
              ${item.title}
            </span>
          </div>

          
        </div>
      `;
    }

    const opts: any = {
      id: item.id,
      w: item.w || 1,
      h: item.h || 1,
      noResize: item.type !== 'container',
    };
    if (item.x !== undefined) opts.x = item.x;
    if (item.y !== undefined) opts.y = item.y;

            // Create DOM element manually
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-stack-item';
    wrapper.innerHTML = htmlContent;
    
    // Append to grid container directly
    if (!targetGrid) {
      gridContainerRef.current.appendChild(wrapper);
    } else {
      targetGrid.el.appendChild(wrapper);
    }
    
    const el = grid.makeWidget(wrapper, opts);
      
      if (item.type === 'container') {
        const subGridEl = el.querySelector('.grid-stack') as HTMLElement;
        if (subGridEl) {
          const subGrid = GridStack.addGrid(subGridEl, {
            cellHeight: getCellHeight(layoutSize),
            margin: 2,
            column: item.w || 4,
            acceptWidgets: true,
            float: false,
            disableResize: true
          });
          
          subGrid.on('change', () => {
            if ((subGrid as any).updateMinSize) {
              (subGrid as any).updateMinSize();
            }
            saveGridState();
          });
          subGrid.on('added', () => {
            if ((subGrid as any).updateMinSize) {
              (subGrid as any).updateMinSize();
            }
            saveGridState();
          });
          subGrid.on('removed', () => {
            if ((subGrid as any).updateMinSize) {
              (subGrid as any).updateMinSize();
            }
            saveGridState();
          });
          
          (subGrid as any)._autoColumn = true;
          
          if (item.children) {
            item.children.forEach(child => addWidgetToGrid(child, subGrid));
          }

          const updateMinSize = () => {
            if (!subGrid.engine) return;
            const nodes = subGrid.engine.nodes;
            if (nodes.length === 0) {
              grid.update(el, { minW: 1, h: 2 });
            } else {
              const maxW = Math.max(...nodes.map(n => (n.x || 0) + (n.w || 1)));
              const maxH = Math.max(...nodes.map(n => (n.y || 0) + (n.h || 1)));
              
              const ch = getCellHeight(layoutSize);
              const headerPx = 56; // 8px top pad + 8px bot pad + 36px header + buffer
              const neededH = maxH + Math.ceil(headerPx / ch);
              
              
              
              grid.update(el, { minW: 1, h: neededH });
              
            }
          };

          subGrid.on('added removed change', updateMinSize);
          (subGrid as any).updateMinSize = updateMinSize;
          setTimeout(updateMinSize, 50);
        }
      }
  };

  const handleAddShortcut = (app: {title: string, url: string}) => {
    if (!gridInstance.current) return;
    
    const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'app',
      title: app.title,
      url: app.url,
      w: 1,
      h: 1,
    };

    setShortcuts(prev => {
      const updated = [...prev, newItem];
      fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
      return updated;
    });

    addWidgetToGrid(newItem);
    setSearchQuery('');
    
    setTimeout(() => {
      saveGridState();
    }, 100);
  };

  const addContainerToGrid = (title: string) => {
    if (!title.trim() || !gridInstance.current) return;
    const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'container',
      title: title.trim(),
      url: '#', // unused for containers but required by type
      w: Math.max(4, Math.floor(currentCols.current / 2)),
      h: 3,
      
    };
    
    setShortcuts(prev => {
      const updated = [...prev, newItem];
      fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
      return updated;
    });

    addWidgetToGrid(newItem);
    setNewCategoryName('');
    
    setTimeout(() => {
      saveGridState();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredApps.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredApps.length > 0) {
        handleAddShortcut(filteredApps[highlightedIndex]);
      } else if (searchQuery.trim().length > 0 && searchQuery.includes('.')) {
        const query = searchQuery.trim();
        const formattedUrl = /^https?:\/\//i.test(query) ? query : 'https://' + query;
        
        setIsInputFocused(false);
        setIsAddingShortcut(true);
        setSearchQuery('');

        fetch('/api/scrape-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedUrl })
        })
        .then(res => res.json())
        .then(data => {
          const newId = 'shortcut_' + Date.now();
          let chosenIcon = data.icons?.[0];
          const horseIcon = `https://icon.horse/icon/${new URL(formattedUrl).hostname}`;
          
          if (!chosenIcon || data.icons?.length === 0) {
             chosenIcon = horseIcon;
          }

          const newItem = {
            id: newId,
            type: 'app' as const,
            title: data.title && data.title.trim() ? data.title.trim() : new URL(formattedUrl).hostname,
            url: formattedUrl,
            iconUrl: chosenIcon || horseIcon,
            w: 1, h: 1
          };
          
          setShortcuts(prev => {
            const updated = [...prev, newItem];
            fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
            return updated;
          });
          addWidgetToGrid(newItem);
        })
        .catch(err => console.error("Failed to add custom shortcut", err))
        .finally(() => setIsAddingShortcut(false));
      }
    } else if (e.key === 'Escape') {
      setIsInputFocused(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* Background Media */}
      {activeBackground && activeBackground !== 'none' && (
        <div key={activeBackground} className="absolute inset-0 z-0 pointer-events-none">
          {activeBackground.match(/\.(mp4|webm|ogg)$/i) || backgrounds.find(b => b.url === activeBackground)?.type === 'video' ? (
            <video 
              key={activeBackground}
              src={activeBackground}
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover"
              ref={(el) => {
                if (el && el.getAttribute('data-current-src') !== activeBackground) {
                  el.setAttribute('data-current-src', activeBackground);
                  el.load();
                  const playPromise = el.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                  }
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${activeBackground}")` }} />
          )}
        </div>
      )}
      {/* Tint Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{ 
          backgroundColor: tintColor, 
          opacity: tintOpacity / 100,
          display: activeBackground && activeBackground !== 'none' ? 'block' : 'none' 
        }} 
      />
      {/* Dynamic Main BG */}
      <div className={`absolute inset-0 z-[-1] ${activeBackground && activeBackground !== 'none' ? '' : 'bg-neutral-950'}`} />

      
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-30 py-2.5 px-4 sm:px-6 pointer-events-none flex justify-between bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="w-full mx-auto flex items-center justify-between">
          <div className="flex items-center pointer-events-auto">
            <span className="font-semibold text-lg tracking-tight">starterr</span>
          </div>
          <div className="flex items-center space-x-3 pointer-events-auto text-sm font-medium text-neutral-200">
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-neutral-500">•</span>
            <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      {/* Settings floating button & User controls (bottom right) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 h-12 shadow-xl">
            <div className="flex items-center gap-2">
              <User size={16} className="text-neutral-500" />
              <span className="text-sm font-medium text-neutral-300">{user.username}</span>
            </div>
            <div className="w-px h-4 bg-neutral-800"></div>
            <button 
              onClick={logout} 
              className="text-neutral-500 hover:text-red-400 transition-colors" 
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shadow-xl hover:bg-neutral-800 hover:text-white transition-all transform hover:scale-105 active:scale-95 pointer-events-auto shrink-0"
          title="Settings"
        >
          <Settings size={22} />
        </button>
      </div>

      {/* Main Content */}
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 min-h-screen relative z-10">
        <div className="grid-stack" ref={gridContainerRef}></div>
      </main>

      {/* Bottom Floating Bar */}
      <div 
        className={`fixed bottom-0 left-0 w-full pointer-events-none transition-transform duration-300 ease-out z-40 ${
          isMouseNearBottom || isInputFocused ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-xl mx-auto mb-6 px-4 pointer-events-auto">
          
          {/* Smart Input Bar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div 
              className={`relative flex items-center bg-neutral-900 border transition-colors duration-300 shadow-2xl overflow-visible ${
                isInputFocused ? 'border-blue-500/50 ring-1 ring-blue-500/50 rounded-b-3xl rounded-t-lg' : 'border-neutral-800 hover:border-neutral-700 rounded-full'
              }`}
            >
              <div className="pl-5 pr-3 text-neutral-400">
                <Search size={20} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                   setIsInputFocused(false);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type an app name or URL..."
                className="w-full bg-transparent border-none outline-none py-4 text-neutral-200 placeholder:text-neutral-600 focus:ring-0"
              />
              {searchQuery && (
                <div className="flex items-center pr-2 gap-1">
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchQuery('');
                    }}
                    className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors rounded-full hover:bg-neutral-800"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const query = searchQuery.trim();
                      const isUrl = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(query);

                      if (isUrl || (query.length > 0 && query.includes('.'))) {
                        const formattedUrl = /^https?:\/\//i.test(query) ? query : 'https://' + query;
                        
                        setIsInputFocused(false);
                        setIsAddingShortcut(true);
                        setSearchQuery('');

                        fetch('/api/scrape-metadata', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: formattedUrl })
                        })
                        .then(res => res.json())
                        .then(data => {
                          const newId = 'shortcut_' + Date.now();
                          let chosenIcon = data.icons?.[0];
                          const horseIcon = `https://icon.horse/icon/${new URL(formattedUrl).hostname}`;
                          
                          if (!chosenIcon || data.icons?.length === 0) {
                             chosenIcon = horseIcon;
                          }

                          const newItem = {
                            id: newId,
                            type: 'app' as const,
                            title: data.title && data.title.trim() ? data.title.trim() : new URL(formattedUrl).hostname,
                            url: formattedUrl,
                            iconUrl: chosenIcon || horseIcon,
                            w: 1, h: 1
                          };
                          
                          setShortcuts(prev => {
                            const updated = [...prev, newItem];
                            fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
                            return updated;
                          });
                          addWidgetToGrid(newItem);
                        })
                        .catch(err => console.error("Failed to add custom shortcut", err))
                        .finally(() => setIsAddingShortcut(false));
                      } else if (filteredApps.length > 0) {
                        handleAddShortcut(filteredApps[highlightedIndex]);
                      }
                    }}
                    className="p-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors rounded-full shadow-lg"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isInputFocused && searchQuery.trim().length > 0 && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-neutral-900 border border-neutral-800 rounded-t-3xl rounded-b-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                
                {filteredApps.length > 0 ? (
                  <ul className="py-2">
                    {filteredApps.map((app, idx) => (
                      <li 
                        key={app.url}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddShortcut(app);
                        }}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`px-4 py-3 cursor-pointer flex items-center space-x-3 transition-colors ${
                          idx === highlightedIndex ? 'bg-neutral-800/80' : 'hover:bg-neutral-800/40'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                           <img 
                             src={app.iconUrl || getFaviconUrl(app.url)} 
                             onError={(e) => {
                               const target = e.currentTarget;
                               try {
                                 const domain = new URL(app.url).hostname;
                                 if (target.dataset.fallback === '1') {
                                   target.onerror = null;
                                   target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.title || 'U')}&background=262626&color=fff&size=64`;
                                 } else {
                                   target.dataset.fallback = '1';
                                   target.src = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
                                 }
                               } catch {
                                 target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.title || 'U')}&background=262626&color=fff&size=64`;
                               }
                             }}
                             className="w-full h-full object-cover"
                             alt=""
                           />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium text-neutral-200 truncate">{app.title}</span>
                          <span className="text-xs text-neutral-500 truncate">{app.url.replace(/^https?:\/\//, '')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center">
                    <p className="text-neutral-400 text-sm mb-1">No matching apps found</p>
                    {searchQuery.includes('.') ? (
                      <p className="text-neutral-500 text-xs">Press Enter to add custom URL</p>
                    ) : (
                      <p className="text-neutral-500 text-xs">Type a valid URL to add</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Side Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-neutral-900 border-l border-neutral-800 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSettingsOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50 backdrop-blur sticky top-0 z-10 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings size={20} className="text-neutral-400" />
            starterr Settings
          </h2>
          <button onClick={() => setIsSettingsOpen(false)} className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800">
             <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          
          {/* Background Settings */}
          <section className="border-t border-neutral-800 pt-6">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Background & Theme</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-neutral-700 rounded-xl hover:border-neutral-500 hover:bg-neutral-800/50 cursor-pointer transition-all group">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload size={24} className="text-neutral-500 group-hover:text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-400 group-hover:text-neutral-300">
                      {uploadingBg ? 'Uploading...' : 'Upload Image or Video'}
                    </span>
                  </div>
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUploadBg} disabled={uploadingBg} />
                </label>
              </div>

              {backgrounds.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div 
                    onClick={() => setActiveBackground('none')}
                    className={`aspect-video rounded-lg cursor-pointer overflow-hidden relative border-2 flex items-center justify-center bg-neutral-950 ${activeBackground === 'none' ? 'border-blue-500' : 'border-transparent hover:border-neutral-700'}`}
                  >
                     <span className="text-xs text-neutral-500 font-medium">None</span>
                  </div>
                  {backgrounds.map(bg => (
                    <div 
                      key={bg.id}
                      onClick={() => setActiveBackground(bg.url)}
                      className={`aspect-video rounded-lg cursor-pointer overflow-hidden relative group border-2 ${activeBackground === bg.url ? 'border-blue-500' : 'border-transparent hover:border-neutral-700'}`}
                    >
                      {bg.type === 'video' ? (
                        <video src={bg.url} className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <img src={bg.url} className="w-full h-full object-cover pointer-events-none" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={(e) => handleDeleteBg(bg.id, bg.url, e)} className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-md transition-colors">
                          <Trash size={14} />
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 backdrop-blur-sm">
                        {bg.type === 'video' ? <VideoIcon size={10} className="text-neutral-300" /> : <ImageIcon size={10} className="text-neutral-300" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400">Tint Color</label>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-neutral-500 uppercase">{tintColor}</span>
                    <input 
                      type="color" 
                      value={tintColor} 
                      onChange={(e) => setTintColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm text-neutral-400">Tint Opacity</label>
                    <span className="text-sm font-medium text-neutral-300">{tintOpacity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={tintOpacity} 
                    onChange={(e) => setTintOpacity(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Layout Size */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Grid Layout Size</h3>
            <div className="grid grid-cols-3 gap-3">
               {(['small', 'medium', 'large'] as LayoutSize[]).map(size => (
                 <button 
                   key={size}
                   onClick={() => setLayoutSize(size)}
                   className={`py-3 rounded-xl border ${layoutSize === size ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800'} capitalize font-medium transition-colors`}
                 >
                   {size}
                 </button>
               ))}
            </div>
            <p className="text-xs text-neutral-500 mt-3">Changes the density and size of application icons.</p>
          </section>

          {/* Categories & Containers */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Category Containers</h3>
            <p className="text-sm text-neutral-400 mb-4">Add visual separators to organize your dashboard.</p>
            
            <div className="flex space-x-2 mb-6">
              <input 
                type="text" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addContainerToGrid(newCategoryName);
                }}
                placeholder="Custom category name..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
              />
              <button 
                 onClick={() => addContainerToGrid(newCategoryName)}
                 className="bg-neutral-100 hover:bg-white text-neutral-900 px-6 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                 <Plus size={18} />
                 Add
              </button>
            </div>

            <div>
               <h4 className="text-xs font-semibold text-neutral-500 mb-3 uppercase tracking-wider">Default Categories</h4>
               <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {["Work","Social","Entertainment","Finance","AI Tools","Development","Games","Shopping","Productivity","News & Media","Travel","Utilities","Lifestyle","Crypto & Web3","Design","Marketing","Research","Education","Fitness & Health","Streaming","Music & Audio","Reading","Writing","Hosting","Databases","Security","Legal","Real Estate","Food & Drink","Delivery","Cloud Services","Analytics","CRM","HR","Collaboration","Communication","Video Meetings","Smart Home","Automotive","Photography","Video Editing","3D & Animation","Job Search","Freelance","Dating","Family & Kids","Pets","Deals & Coupons","Beauty & Fashion","Sports","Outdoors","DIY & Crafts","Home Improvement","Personal Finance","Investing","Banking","Language Learning","Online Courses","Podcasts","Audiobooks","Comics & Anime","Esports","Board Games","VR & AR","Hardware","Software","OS & Systems","Networking","DevOps","CI/CD","Testing & QA","APIs & Microservices","Mobile Dev","Game Dev","Data Science","Machine Learning","Big Data","IoT","Robotics","Space & Science","History","Philosophy","Religion & Spirituality","Politics","Government","Non-profit","Volunteering","Environment","Sustainability","Travel Planning","Airlines","Hotels","Car Rentals","Public Transit","Maps & Navigation","Weather","Local News","Events & Ticketing","Museums & Arts","Theater","Concerts","Festivals","Nightlife","Restaurants","Coffee & Tea","Breweries & Wineries","Groceries","Meal Kits","Farming & Agriculture","Fashion & Apparel","Jewelry","Cosmetics","Skincare","Haircare","Fitness Equipment","Yoga & Pilates","Martial Arts","Team Sports","Extreme Sports","Hunting & Fishing","Boating & Sailing","Aviation","Motorcycles","Bicycles","Cars & Trucks","RVs & Camping","Collectibles","Antiques","Art Supplies","Musical Instruments"].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => addContainerToGrid(cat)}
                      className="flex items-center space-x-2 bg-neutral-800/50 hover:bg-neutral-700 border border-neutral-700 px-3 py-2 rounded-lg text-sm text-neutral-300 transition-colors group"
                    >
                      <span>{cat}</span>
                      <Plus size={14} className="text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                    </button>
                  ))}
               </div>
            </div>
          </section>

        </div>
      </div>
      
      {/* Backdrop for side panel */}
      
      {/* Context Menu */}
      {contextMenu.visible && contextMenu.shortcut && (
        <div 
          className="fixed z-[99999] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-3 w-64 animate-in fade-in zoom-in duration-150 flex flex-col"
          style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 999999 }}
          onMouseLeave={() => setContextMenu(prev => ({ ...prev, visible: false }))}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pb-3 mb-3 border-b border-neutral-800 flex items-center space-x-3">
             <div className="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
               {contextMenu.shortcut.type === 'container' ? (
                 <LayoutGrid size={16} className="text-neutral-400" />
               ) : (
                 <img 
                      src={contextMenu.shortcut.iconUrl || getFaviconUrl(contextMenu.shortcut.url)} 
                      onError={(e) => { 
                        const target = e.currentTarget;
                        try {
                          const domain = new URL(contextMenu.shortcut.url).hostname;
                          if (target.dataset.fallback === '1') {
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contextMenu.shortcut?.title || 'U')}&background=262626&color=fff&size=64`;
                          } else {
                            target.dataset.fallback = '1';
                            target.src = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
                          }
                        } catch {
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contextMenu.shortcut?.title || 'U')}&background=262626&color=fff&size=64`;
                        }
                      }}
                      className="w-full h-full object-cover" 
                   />
               )}
             </div>
             <span className="text-sm font-semibold text-neutral-200 truncate">{contextMenu.shortcut.title || 'Unknown'}</span>
          </div>
          
          <div className="px-4 flex flex-col space-y-3 mb-3">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Label</label>
              <input 
                type="text" 
                value={contextMenu.shortcut.title || ''}
                onChange={e => {
                  const newVal = e.target.value;
                  setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, title: newVal } }));
                  updateShortcutDynamically(contextMenu.shortcut!.id, { title: newVal });
                }}
                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            {contextMenu.shortcut.type !== 'container' && (
              <>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">URL</label>
                  <input 
                    type="text" 
                    value={contextMenu.shortcut.url || ''}
                    onChange={e => {
                      const newVal = e.target.value;
                      setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, url: newVal } }));
                      updateShortcutDynamically(contextMenu.shortcut!.id, { url: newVal });
                    }}
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Icon URL</label>
                  <input 
                    type="text" 
                    value={contextMenu.shortcut.iconUrl || ''}
                    onChange={e => {
                      const newVal = e.target.value;
                      setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, iconUrl: newVal } }));
                      updateShortcutDynamically(contextMenu.shortcut!.id, { iconUrl: newVal });
                    }}
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="px-4 pt-2 border-t border-neutral-800">
            <button 
              className="w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors flex items-center justify-center border border-red-500/20"
              onClick={() => {
                const id = contextMenu.shortcut!.id;
                window.removeShortcut(id);
                setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
              }}
            >
              <Trash2 size={12} className="mr-1.5" /> Delete
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors flex items-center mt-1 border-t border-neutral-700 pt-1.5"
              onClick={() => {
                const shortcut = contextMenu.shortcut!;
                setIconSelectorModal({ visible: true, shortcut });
                setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
              }}
            >
              <ImageIcon size={12} className="mr-1.5" /> Change Icon
            </button>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSettingsOpen(false)}
        />
      )}


      
      {isAddingShortcut && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 text-white px-6 py-5 rounded-2xl shadow-2xl flex items-center gap-4">
            <Loader2 className="animate-spin text-blue-500" size={28} />
            <div className="flex flex-col">
              <span className="font-bold text-lg">Adding Shortcut</span>
              <span className="text-neutral-400 text-sm">Discovering site icons and metadata...</span>
            </div>
          </div>
        </div>
      )}

      {iconSelectorModal.visible && iconSelectorModal.shortcut && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon size={18} className="text-purple-500" /> Change Icon for {iconSelectorModal.shortcut.title}
              </h2>
              <button onClick={() => { setIconSelectorModal({ visible: false, shortcut: null }); setScrapedMetadata(null); }} className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {!scrapedMetadata && !isScraping ? (
                <div className="flex flex-col items-center justify-center py-8">
                   <button 
                     className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                     onClick={async () => {
                       setIsScraping(true);
                       try {
                         const res = await fetch('/api/scrape-metadata', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ url: iconSelectorModal.shortcut!.url })
                         });
                         const data = await res.json();
                         setScrapedMetadata(data);
                         setSelectedCustomIcon(iconSelectorModal.shortcut!.iconUrl || data.icons?.[0] || '');
                       } catch (e) {
                         console.error(e);
                       } finally {
                         setIsScraping(false);
                       }
                     }}
                   >
                     Scan Site for Icons
                   </button>
                </div>
              ) : isScraping ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <div className="animate-spin mb-4"><Loader2 size={32} /></div>
                  <p>Discovering site icons...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Select Icon</label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1">
                      {scrapedMetadata?.icons.map((icon, i) => (
                        <button 
                          key={i} 
                          onClick={() => setSelectedCustomIcon(icon)}
                          className={`aspect-square rounded-xl border-2 flex items-center justify-center p-2 transition-all ${selectedCustomIcon === icon ? 'border-purple-500 bg-purple-500/10' : 'border-transparent bg-neutral-950 hover:border-neutral-700'}`}
                        >
                          <img src={icon} className="max-w-full max-h-full object-contain rounded-lg" onError={(e: any) => e.target.style.display='none'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors"
                    onClick={() => {
                      // Update shortcut
                      const idToUpdate = iconSelectorModal.shortcut!.id;
                      setShortcuts(prev => {
                        // Deep clone and update
                        const updateRecursive = (items: ShortcutItem[]): ShortcutItem[] => {
                          return items.map(item => {
                            if (item.id === idToUpdate) return { ...item, iconUrl: selectedCustomIcon };
                            if (item.children) return { ...item, children: updateRecursive(item.children) };
                            return item;
                          });
                        };
                        const updated = updateRecursive(prev);
                        fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
                        return updated;
                      });
                      
                      // Force DOM update
                      if (gridContainerRef.current) {
                        const el = gridContainerRef.current.querySelector(`[gs-id="${idToUpdate}"]`);
                        if (el) {
                          const img = el.querySelector('img');
                          if (img) {
                            img.src = selectedCustomIcon;
                            img.dataset.fallback = '';
                          }
                        }
                      }

                      setIconSelectorModal({ visible: false, shortcut: null });
                      setScrapedMetadata(null);
                    }}
                  >
                    Save Icon
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
