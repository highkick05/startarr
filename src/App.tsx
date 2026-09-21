import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { Plus, X, Link2, Loader2, LayoutGrid, Search, Globe, Settings, Trash2, Image as ImageIcon, Video as VideoIcon, Upload, Trash, LogOut, User, ArrowRight, Sparkles, Check, RefreshCw } from 'lucide-react';
import { ShortcutItem } from './types';
import { AuthContext } from './Auth.tsx';
import { popularApps } from './data';
import { StartarrLogo } from './components/StartarrLogo';

type LayoutSize = 'small' | 'medium' | 'large';

const DEFAULT_CATEGORIES: string[] = [
  "3D & Animation", "AI Tools", "Airlines", "Analytics", "Antiques", "APIs & Microservices",
  "Art Supplies", "Audiobooks", "Automotive", "Aviation", "Banking", "Beauty & Fashion",
  "Bicycles", "Big Data", "Board Games", "Boating & Sailing", "Breweries & Wineries",
  "Car Rentals", "Cars & Trucks", "CI/CD", "Cloud Services", "Coffee & Tea", "Collaboration",
  "Collectibles", "Comics & Anime", "Communication", "Concerts", "Cosmetics", "CRM",
  "Crypto & Web3", "Data Science", "Databases", "Dating", "Deals & Coupons", "Delivery",
  "Design", "Development", "DevOps", "DIY & Crafts", "Education", "Entertainment",
  "Environment", "Esports", "Events & Ticketing", "Extreme Sports", "Family & Kids",
  "Farming & Agriculture", "Fashion & Apparel", "Festivals", "Finance", "Fitness & Health",
  "Fitness Equipment", "Food & Drink", "Freelance", "Game Dev", "Games", "Government",
  "Groceries", "Haircare", "Hardware", "History", "Home Improvement", "Hosting", "Hotels",
  "HR", "Hunting & Fishing", "Investing", "IoT", "Jewelry", "Job Search", "Language Learning",
  "Legal", "Lifestyle", "Local News", "Machine Learning", "Maps & Navigation", "Marketing",
  "Martial Arts", "Meal Kits", "Mobile Dev", "Motorcycles", "Museums & Arts", "Music & Audio",
  "Musical Instruments", "Networking", "News & Media", "Nightlife", "Non-profit",
  "Online Courses", "OS & Systems", "Outdoors", "Personal Finance", "Pets", "Philosophy",
  "Photography", "Podcasts", "Politics", "Productivity", "Public Transit", "Reading",
  "Real Estate", "Religion & Spirituality", "Research", "Restaurants", "Robotics",
  "RVs & Camping", "Security", "Shopping", "Skincare", "Smart Home", "Social", "Software",
  "Space & Science", "Sports", "Streaming", "Sustainability", "Team Sports", "Testing & QA",
  "Theater", "Travel", "Travel Planning", "Utilities", "Video Editing", "Video Meetings",
  "Volunteering", "VR & AR", "Weather", "Work", "Writing", "Yoga & Pilates"
];

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
        if (settings.show_recycle_bin !== undefined) setShowRecycleBin(!!settings.show_recycle_bin);
        if (settings.recycle_bin_json) {
           try {
             setRecycleBin(JSON.parse(settings.recycle_bin_json));
           } catch(e) {}
        }
      }
      if (settings && settings.shortcuts_json) {
        try {
          const parsed = JSON.parse(settings.shortcuts_json);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            setShortcuts(parsed.filter((p: any) => !!p).map((p: any) => ({
              ...p,
              w: p?.type === 'app' ? 1 : p?.w,
              // Multiply h by 8 if it's the old 1x format. 
              // We assume old apps have h:1. Old containers have h:2 or 3.
              // New apps will have h:8.
              h: (p.type === 'app' && p.h < 8) ? 8 : (p.type === 'category' && p.h < 4 ? 4 : (p.type === 'container' && p.h < 8 ? p.h * 8 : p.h))
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

    // Absolute fallback: globally observe for dragged items
    useEffect(() => {
      const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target instanceof HTMLElement) {
            if (target.classList.contains('ui-draggable-dragging') || target.classList.contains('grid-stack-item-dragging')) {
              const parent = target.parentElement?.closest('.grid-stack-item');
              if (parent) {
                parent.classList.add('subgrid-is-dragging');
                (parent as HTMLElement).style.zIndex = '2147483647';
              }
            } 
          }
          
          // Clean up if nothing is being dragged anywhere
          if (!document.querySelector('.ui-draggable-dragging, .grid-stack-item-dragging')) {
             document.querySelectorAll('.subgrid-is-dragging').forEach(el => {
               el.classList.remove('subgrid-is-dragging');
               (el as HTMLElement).style.zIndex = '';
             });
          }
        }
      });
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
      fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
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
       const imgWrapperEl = el.querySelector('.flex-1 > div');
       const imgEl = el.querySelector('img');
       if (imgEl && imgWrapperEl) {
          const domain = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
          const fallbackIcon = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128`;
          const googleIcon = domain ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128` : fallbackIcon;
          const primaryIcon = domain ? `https://icon.horse/icon/${domain}` : googleIcon;
          
          if (updates.iconUrl !== undefined || updates.url !== undefined || updates.title !== undefined) {
             imgEl.src = item.iconUrl || primaryIcon;
             if (item.iconUrl) {
                imgEl.removeAttribute('onload');
                imgEl.setAttribute('onerror', `this.onerror=null; this.src='${googleIcon}';`);
             } else {
                imgEl.setAttribute('onload', `if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='${fallbackIcon}'; }`);
                imgEl.setAttribute('onerror', `if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='${fallbackIcon}'; } else { this.onerror=null; }`);
             }
             imgEl.dataset.fallback = '0';
          }
          if (updates.invertIcon !== undefined) {
            imgEl.style.filter = item.invertIcon ? 'invert(1)' : 'none';
          }
          if (updates.iconBackground !== undefined) {
            const wrapper = imgWrapperEl as HTMLElement;
            wrapper.style.backgroundColor = item.iconBackground === 'white' ? 'white' : item.iconBackground === 'black' ? 'black' : 'transparent';
            if (item.iconBackground === 'white' || item.iconBackground === 'black') {
              wrapper.classList.add('p-2');
            } else {
              wrapper.classList.remove('p-2');
            }
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
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p: any) => !!p).map((p: any) => ({
            ...p,
            w: p?.type === 'app' ? 1 : p?.w,
            h: p?.type === 'app' ? 1 : p?.h
          }));
        }
      } catch (e) {
        console.error('Failed to parse shortcuts', e);
      }
    }
    return [
      { id: '1', title: 'Google', url: 'https://google.com', x: 0, y: 0, w: 1, h: 8, type: 'app' },
      { id: '2', title: 'GitHub', url: 'https://github.com', x: 1, y: 0, w: 1, h: 8, type: 'app' },
      { id: '3', title: 'YouTube', url: 'https://youtube.com', x: 2, y: 0, w: 1, h: 8, type: 'app' }
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
    if (typeof window === 'undefined') return 10;
    const w = window.innerWidth;
    let padding = 32;
    if (w >= 1024) padding = 64;
    else if (w >= 640) padding = 48;
    // We divide by 8 to create a fine-grained grid (10px height scale)
    return Math.max(5, Math.floor(Math.floor((w - padding) / getColumns(size)) / 8));
  };

  const currentCols = useRef(getColumns(layoutSize));
  const gridKey = useRef(0); // Used to force-remount grid when layout size changes
  const handleRemovedEventRef = useRef<(e: any, items: any[]) => void>();

  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [recycleBin, setRecycleBin] = useState<ShortcutItem[]>([]);
  const [isRecycleBinModalOpen, setIsRecycleBinModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{title: string, url: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [quickIconSearch, setQuickIconSearch] = useState('');

  const scanQuickIcons = async (targetUrl: string, searchQuery = '') => {
    if (!targetUrl) return;
    setContextMenu(prev => ({ ...prev, isScanning: true }));
    try {
      const res = await fetch('/api/scrape-metadata', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, query: searchQuery })
      });
      const data = await res.json();
      if (data && Array.isArray(data.icons)) {
        const hdScraped = data.icons.filter((i: string) => 
          i && 
          !i.toLowerCase().endsWith('.ico') && 
          !i.toLowerCase().includes('.ico?') && 
          !i.toLowerCase().includes('favicon.ico')
        );
        setContextMenu(prev => ({
          ...prev,
          isScanning: false,
          extraIcons: [...new Set([...(prev.extraIcons || []), ...hdScraped])]
        }));
      } else {
        setContextMenu(prev => ({ ...prev, isScanning: false }));
      }
    } catch (e) {
      console.error("Failed to scan site for icons", e);
      setContextMenu(prev => ({ ...prev, isScanning: false }));
    }
  };

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
  
  const [tintColor, setTintColor] = useState('#000000');
  const [tintOpacity, setTintOpacity] = useState(40);
  const [uiOpacity, setUiOpacity] = useState(100);
  const [uiBlur, setUiBlur] = useState(16);
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
    localStorage.setItem('uiOpacity', String(uiOpacity));
    localStorage.setItem('uiBlur', String(uiBlur));
    if (dataLoaded) {
      fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_background: activeBackground,
          tint_color: tintColor,
          tint_opacity: tintOpacity,
          ui_opacity: uiOpacity,
          ui_blur: uiBlur
        })
      }).catch(console.error);
    }
  }, [activeBackground, tintColor, tintOpacity, uiOpacity, uiBlur, dataLoaded]);

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
    extraIcons?: string[];
    isScanning?: boolean;
}>({ visible: false, x: 0, y: 0, shortcut: null, extraIcons: [], isScanning: false });

  

  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return popularApps
      .filter(app => app.title.toLowerCase().includes(searchQuery.toLowerCase()) || app.url.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim() || filteredApps.length > 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    const isUrl = /^https?:\/\//i.test(searchQuery) || /\.[a-z]{2,}$/i.test(searchQuery);
    if (isUrl || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (e) {
        console.error(e);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filteredApps.length]);


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
      
      // Lookup for recycle bin
      const findD = (arr: any[], tid: string): any => {
        for (const i of arr) {
          if (i.id === tid) return i;
          if (i.children) { const f = findD(i.children, tid); if (f) return f; }
        }
        return null;
      };
      const fullItem = findD(shortcuts, id) || findD(JSON.parse(localStorage.getItem('shortcuts') || '[]'), id);
      if (fullItem) {
        setRecycleBin(prev => {
          if (prev.find(i => i.id === fullItem.id)) return prev;
          const updated = [...prev, fullItem];
          // Auto-saved by useEffect
          return updated;
        });
      }

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
            fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
            
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

  
  // Sync Recycle Bin safely with debouncing
  useEffect(() => {
    if (!dataLoaded) return;
    const timer = setTimeout(() => {
      fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recycle_bin_json: JSON.stringify(recycleBin) }) }).catch(console.error);
    }, 500);
    return () => clearTimeout(timer);
  }, [recycleBin, dataLoaded]);


  // Update layout size in local storage
  useEffect(() => {
    localStorage.setItem('layoutSize', layoutSize);
    if (dataLoaded) {
      fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' },
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
      const availableHeight = window.innerHeight - 240;
      const ch = getCellHeight(layoutSize);
      return Math.max(1, Math.floor(availableHeight / ch));
    };

    gridInstance.current = GridStack.init({
      disableOneColumnMode: true,
      column: maxCols,
      cellHeight: getCellHeight(layoutSize),
      margin: 4,
      minRow: calculateMinRows(),
      float: true,
      animate: true,
      disableResize: false,
      acceptWidgets: true,
      removable: '.recycle-bin-zone',
      removeTimeout: 0,
      draggable: {
        cancel: '.no-drag', appendTo: 'body'
      }
    } as any, gridContainerRef.current);

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
          if (item && item.subGrid) {
            let widthChanged = false;
            if (item.w !== item.subGrid.getColumn()) {
              item.subGrid.column(item.w, 'list');
              widthChanged = true;
            }
            if ((item.subGrid as any).updateMinSize) {
              setTimeout(() => {
                 (item.subGrid as any).updateMinSize();
              }, 150);
            }
          }
        });
      }
      saveGridState();
    };
    
    const handleRemovedEvent = (e: any, items: any[]) => {
      console.log('REMOVED EVENT:', items.map(n => ({ id: n.id || n.el?.getAttribute('gs-id'), inDOM: document.body.contains(n.el) })));
      if (items) {
        items.forEach(node => {
          const rawId = node.id || node.el?.getAttribute('gs-id');
          if (rawId) {
            // Check if it's still in the DOM after a tiny delay (meaning it was moved to another grid, not deleted)
            setTimeout(() => {
              const el = document.querySelector(`[gs-id="${rawId}"]`);
              if (el && document.body.contains(el)) {
                 console.log('Item still in DOM, was moved to another grid, not recycled:', rawId);
                 return; // Do not recycle!
              }
              
              let fullItem = itemRegistry.current.get(rawId);
              if (!fullItem) {
                 const findD = (arr: any[], id: string): any => {
                   for (const i of arr) {
                     if (i.id === id) return i;
                     if (i.children) { const f = findD(i.children, id); if (f) return f; }
                   }
                   return null;
                 };
                 fullItem = findD(JSON.parse(localStorage.getItem('shortcuts') || '[]'), rawId);
              }
              if (fullItem) {
                setRecycleBin(prev => {
                  if (prev.find(i => i.id === fullItem.id)) return prev;
                  const updated = [...prev, fullItem];
                  return updated;
                });
              }
            }, 50);
          }
        });
      }
      handleGridChange(e, items);
    };
    handleRemovedEventRef.current = handleRemovedEvent;

    gridInstance.current.on('change', (e, items) => { handleGridChange(e, items); });
    gridInstance.current.on('added', handleGridChange);
    gridInstance.current.on('removed', handleRemovedEvent);

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
      if (target.closest('#app-context-menu')) return;
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
                x: Math.min(e.clientX, window.innerWidth - 280),
                y: Math.min(e.clientY, window.innerHeight - 520),
                shortcut: found,
                extraIcons: [],
                isScanning: false
              });
              setQuickIconSearch('');
              if (found.url && found.type !== 'container') {
                scanQuickIcons(found.url, '');
              }
            }
            return prev;
          });
        }
      } else {
        setContextMenu({ visible: false, x: 0, y: 0, shortcut: null });
      }
    });

    window.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#app-context-menu')) {
        setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
      }
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
  }, [layoutSize, dataLoaded, showRecycleBin]); // Re-init grid when layoutSize changes, data finishes loading, or recycle bin toggles

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

        const { el, subGrid, subGridOpts, content, ...restExisting } = existing as any;
        return {
          ...restExisting,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          children: mappedChildren.length > 0 ? mappedChildren : undefined
        };
      };

    const updated = items.map(mapItem).filter(Boolean) as ShortcutItem[];
      
      // Keep itemRegistry up to date with the latest tree structure!
      const refreshRegistry = (list: ShortcutItem[]) => {
        list.forEach(i => {
           itemRegistry.current.set(i.id, { ...i });
           if (i.children) refreshRegistry(i.children);
        });
      };
      // itemRegistry.current.clear(); removed to preserve detached items for the recycle bin
      refreshRegistry(updated);

      fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
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
    const isLarge = layoutSize === 'large';
    const paddingClass = isSmall ? 'p-1 pb-2' : isLarge ? 'p-3' : 'p-2';
    const textMarginClass = isSmall ? 'mt-0 mb-0.5' : isLarge ? 'mt-2' : 'mt-1';
    const titleStyle = isSmall ? 'font-size: 0.6rem; line-height: 0.8rem;' : isLarge ? 'font-size: clamp(0.75rem, 2.5vw, 0.9rem);' : 'font-size: clamp(0.65rem, 2vw, 0.75rem);';
    const iconWrapperClass = isSmall ? 'mt-0 p-0' : isLarge ? 'mt-2 p-1' : 'mt-1 p-1';
    const containerPt = isSmall ? 'pt-0' : 'pt-1';
    const containerPb = isSmall ? 'pb-0' : isLarge ? 'pb-0' : 'pb-1';

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
        <div class="grid-stack-item-content relative group dynamic-ui-bg border border-neutral-800/80 rounded-2xl shadow-lg flex flex-col ${containerPt} ${containerPb} px-1 ">
          <div class="flex justify-between items-center px-2 pb-1 border-b border-neutral-800/50 mb-0 pointer-events-none">
            <h3 class="font-semibold text-neutral-300 text-sm">${item.title}</h3>
            <button class="no-drag pointer-events-auto absolute top-2 right-2 p-1 bg-neutral-800 text-neutral-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500 hover:text-white" onclick="window.removeShortcut('${item.id}')" title="Remove container">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div class="grid-stack flex-1 mt-1 px-0 overflow-visible w-full"></div>
        </div>
      `;
    } else {
      const domain = (() => { try { return new URL(item.url).hostname; } catch { return ''; } })();
      const fallbackIcon = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title || 'Unknown')}&background=262626&color=fff&size=128`;
      const googleIcon = domain ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128` : fallbackIcon;
      const primaryIcon = domain ? `https://icon.horse/icon/${domain}` : googleIcon;
      const iconUrl = item.iconUrl || primaryIcon;
      
      const onloadAttr = item.iconUrl ? '' : `onload="if(this.naturalWidth < 64 && !this.dataset.fallback) { this.dataset.fallback='1'; this.src='${googleIcon}'; } else if (this.naturalWidth < 64 && this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='${fallbackIcon}'; }"`;
      const onerrorAttr = item.iconUrl 
        ? `onerror="this.onerror=null; this.src='${googleIcon}';"`
        : `onerror="if(!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${googleIcon}'; } else if (this.dataset.fallback === '1') { this.dataset.fallback='2'; this.src='${fallbackIcon}'; } else { this.onerror=null; }"`;

      htmlContent = `
        <div class="grid-stack-item-content relative group flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-300 hover:scale-105 hover:bg-neutral-800/30 rounded-2xl"
             onclick="if(!this.parentElement.classList.contains('ui-draggable-dragging') && !this.parentElement.classList.contains('grid-stack-item-dragging')) window.open('${item.url}', '_blank')">

          <div class="pointer-events-none w-full h-full flex flex-col items-center justify-between ${paddingClass}">
            <div class="flex-1 w-full min-h-0 flex items-center justify-center ${iconWrapperClass}">
              <div style="height: 100%; aspect-ratio: 1/1; ${item.iconBackground === 'white' ? 'background-color: white;' : item.iconBackground === 'black' ? 'background-color: black;' : ''}" class="flex items-center justify-center rounded-xl ${(item.iconBackground === 'white' || item.iconBackground === 'black') ? 'p-2' : ''} shadow-sm drop-shadow-md hover:drop-shadow-xl transition-all duration-300">
                <img src="${iconUrl}" ${onloadAttr} ${onerrorAttr} alt="${item.title}" draggable="false" style="width: 100%; height: 100%; object-fit: contain; ${item.invertIcon ? 'filter: invert(1);' : ''}" class="rounded-lg" />
              </div>
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
    if (item.type === 'container') {
      // opts.sizeToContent = true; // disabled because it conflicts with our manual updateMinSize calculation
    }
    
    if (item.x !== undefined) opts.x = item.x;
    if (item.y !== undefined) opts.y = item.y;

    // Create DOM element manually
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-stack-item';
    wrapper.setAttribute('gs-id', item.id); // Explicitly bind ID for context menu!
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
            disableOneColumnMode: true,
            cellHeight: getCellHeight(layoutSize),
            margin: 0,
            column: item.w || 4,
            acceptWidgets: true,
            dragOut: true,
            float: false,
            removable: '.recycle-bin-zone',
            removeTimeout: 0,
            disableResize: true,
            draggable: { appendTo: 'body', cancel: '.no-drag' }
          } as any);
          
          (subGrid as any)._autoColumn = true;
          
          if (item.children) {
            item.children.forEach(child => addWidgetToGrid(child, subGrid));
          }

          const updateMinSize = () => {
            if (!subGrid.engine) return;
            const nodes = subGrid.engine.nodes;
            
            let extra = layoutSize === 'small' ? 4 : layoutSize === 'large' ? 3 : 4;
            let requiredH = 8 + extra;
            if (nodes.length > 0) {
              let maxBottom = 0;
              nodes.forEach((n: any) => {
                const snappedY = Math.round((n.y || 0) / 8) * 8;
                const bottom = snappedY + (n.h || 1);
                if (bottom > maxBottom) maxBottom = bottom;
              });
              requiredH = maxBottom + extra;
            }
            
            const node = el.gridstackNode;
            if (node && node.h !== requiredH) {
               grid.update(el, { w: node.w, h: requiredH, minW: 1, minH: requiredH });
            }
          };

          subGrid.on('dragstart', (e, el) => {
            if (subGridEl) {
              const parentContainer = subGridEl.closest('.grid-stack-item');
              if (parentContainer) {
                parentContainer.classList.add('subgrid-is-dragging');
                (parentContainer as HTMLElement).style.zIndex = '99999';
              }
            }
          });
          subGrid.on('dragstop', (e, el) => {
            if (subGridEl) {
              const parentContainer = subGridEl.closest('.grid-stack-item');
              if (parentContainer) {
                parentContainer.classList.remove('subgrid-is-dragging');
                (parentContainer as HTMLElement).style.zIndex = '';
              }
            }
          });
          subGrid.on('added', () => updateMinSize());
          subGrid.on('removed', (e, items) => {
             updateMinSize();
             if (items) {
               handleRemovedEventRef.current?.(e, items);
             }
          });
          subGrid.on('change', () => updateMinSize());
          
          subGrid.on('change', (e, items) => {
            if (items) {
              items.forEach(node => {
                if (node.y !== undefined && node.y % 8 !== 0) {
                  const newY = Math.round(node.y / 8) * 8;
                  subGrid.update(node.el, { y: newY });
                }
              });
            }
          });
          subGrid.on('added', (e, items) => {
            if (items) {
              items.forEach(node => {
                if (node.y !== undefined && node.y % 8 !== 0) {
                  const newY = Math.round(node.y / 8) * 8;
                  subGrid.update(node.el, { y: newY });
                }
              });
            }
          });
          (subGrid as any).updateMinSize = updateMinSize;
          setTimeout(() => updateMinSize(), 50);
        }
      }
  };

  const handleAddShortcut = (app: {title: string, url: string, iconUrl?: string}) => {
    if (!gridInstance.current) return;
    
    const newItem: ShortcutItem = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'app',
      title: app.title,
      url: app.url,
      iconUrl: app.iconUrl,
      w: 1,
      h: 8,
    };

    setShortcuts(prev => {
      const updated = [...prev, newItem];
      fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
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
      url: '#',
      w: 1, // 1 app wide
      h: 8 + (layoutSize === 'small' ? 4 : layoutSize === 'large' ? 3 : 4), // 8 for 1 app + extra for padding
    };
    
    setShortcuts(prev => {
      const updated = [...prev, newItem];
      fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
      return updated;
    });

    addWidgetToGrid(newItem);
    setNewCategoryName('');
    
    setTimeout(() => {
      saveGridState();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const listLength = filteredApps.length > 0 ? filteredApps.length : searchResults.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, listLength - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredApps.length > 0) {
        handleAddShortcut(filteredApps[highlightedIndex]);
      } else if (searchResults.length > 0) {
        handleAddShortcut({ title: searchResults[highlightedIndex].title, url: searchResults[highlightedIndex].url, iconUrl: '' });
      } else if (searchQuery.trim().length > 0 && searchQuery.includes('.')) {
        const query = searchQuery.trim();
        const formattedUrl = /^https?:\/\//i.test(query) ? query : 'https://' + query;
        
        setIsInputFocused(false);
        setSearchQuery('');

        const newId = 'shortcut_' + Date.now();
        const fallbackDomain = (() => { try { return new URL(formattedUrl).hostname; } catch { return formattedUrl; } })();
        const horseIcon = `https://icon.horse/icon/${fallbackDomain}`;
        
        const newItem = {
          id: newId,
          type: 'app' as const,
          title: fallbackDomain,
          url: formattedUrl,
          iconUrl: horseIcon,
          w: 1, h: 8
        };

        // Instantly add it
        setShortcuts(prev => {
          const updated = [...prev, newItem];
          fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
          return updated;
        });
        addWidgetToGrid(newItem);

        // Fetch metadata in the background
        fetch('/api/scrape-metadata', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedUrl })
        })
        .then(res => res.json())
        .then(data => {
          let chosenIcon = data.icons?.[0];
          let updatedTitle = (data.title && data.title.trim() && data.title !== 'error') ? data.title.trim() : fallbackDomain;
          
          updateShortcutDynamically(newId, {
             title: updatedTitle,
             iconUrl: chosenIcon || horseIcon
          });
        })
        .catch(err => console.error("Failed to add custom shortcut", err));
      }
    } else if (e.key === 'Escape') {
      setIsInputFocused(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 selection:bg-blue-500/30 overflow-x-hidden relative">
      <style>{`
        .dynamic-ui-bg {
          background-color: rgba(23, 23, 23, ${uiOpacity / 100}) !important;
          backdrop-filter: blur(${uiBlur}px) !important;
          -webkit-backdrop-filter: blur(${uiBlur}px) !important;
        }
        .dynamic-header-bg {
          background-color: rgba(0, 0, 0, ${(uiOpacity / 100) * 0.3}) !important;
          backdrop-filter: blur(${uiBlur}px) !important;
          -webkit-backdrop-filter: blur(${uiBlur}px) !important;
        }
        .grid-stack-item.ui-draggable-dragging, .grid-stack-item.grid-stack-item-dragging {
          z-index: 99999 !important;
        }
      `}</style>

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
      <header className="absolute top-0 left-0 w-full z-30 py-2.5 px-4 sm:px-6 pointer-events-none flex justify-between dynamic-header-bg border-b border-white/10">
        <div className="w-full mx-auto flex items-center justify-between">
          <div className="flex items-center pointer-events-auto">
            <StartarrLogo size="md" />
          </div>
          <div className="flex items-center space-x-3 pointer-events-auto text-sm font-medium text-neutral-200">
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-neutral-500">•</span>
            <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            
            <div className="w-px h-4 bg-neutral-600/50 ml-1 mr-1"></div>
            
            {user && (
              <div className="flex items-center gap-2 mr-1">
                <span className="text-xs font-medium text-neutral-300">{user.username}</span>
                <button 
                  onClick={logout} 
                  className="text-neutral-400 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-neutral-800/50" 
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800/50 pointer-events-auto shrink-0"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 min-h-screen relative z-10">
        <div className="grid-stack" ref={gridContainerRef}></div>

        {/* Recycle Bin Drop Zone / Button */}
        {showRecycleBin && (
          <div 
            onClick={() => setIsRecycleBinModalOpen(true)}
            className="recycle-bin-zone fixed bottom-6 right-6 w-[88px] h-[88px] dynamic-ui-bg border-2 border-neutral-800/60 rounded-[1.25rem] shadow-2xl z-[200] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-neutral-800/50 hover:border-neutral-600 hover:scale-105 active:scale-95 group"
          >
            <img src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wastebasket/3D/wastebasket_3d.png" alt="Recycle Bin" className="w-10 h-10 mb-0.5 drop-shadow-md opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            <span className="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-300 tracking-wide">Recycle Bin</span>
            {recycleBin.length > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-6 min-w-6 px-1 flex items-center justify-center shadow-lg border-2 border-neutral-900 z-10">
                {recycleBin.length}
              </div>
            )}
          </div>
        )}
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
                        setSearchQuery('');

                        const newId = 'shortcut_' + Date.now();
                        const fallbackDomain = (() => { try { return new URL(formattedUrl).hostname; } catch { return formattedUrl; } })();
                        const horseIcon = `https://icon.horse/icon/${fallbackDomain}`;
                        
                        const newItem = {
                          id: newId,
                          type: 'app' as const,
                          title: fallbackDomain,
                          url: formattedUrl,
                          iconUrl: horseIcon,
                          w: 1, h: 8
                        };

                        // Instantly add it
                        setShortcuts(prev => {
                          const updated = [...prev, newItem];
                          fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shortcuts_json: JSON.stringify(updated) }) }).catch(console.error);
                          return updated;
                        });
                        addWidgetToGrid(newItem);

                        // Fetch metadata in the background
                        fetch('/api/scrape-metadata', {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: formattedUrl })
                        })
                        .then(res => res.json())
                        .then(data => {
                          let chosenIcon = data.icons?.[0];
                          let updatedTitle = (data.title && data.title.trim() && data.title !== 'error') ? data.title.trim() : fallbackDomain;
                          
                          updateShortcutDynamically(newId, {
                             title: updatedTitle,
                             iconUrl: chosenIcon || horseIcon
                          });
                        })
                        .catch(err => console.error("Failed to add custom shortcut", err));
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
                ) : searchResults.length > 0 ? (
                  <ul className="py-2">
                    <li className="px-4 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-900 sticky top-0">Web Search</li>
                    {searchResults.map((res, idx) => (
                      <li 
                        key={idx}
                        className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${
                          idx === highlightedIndex 
                            ? 'bg-blue-600/20 text-white border-l-2 border-blue-500' 
                            : 'text-neutral-400 hover:bg-neutral-800 hover:text-white border-l-2 border-transparent'
                        }`}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onMouseDown={(e) => { e.preventDefault(); handleAddShortcut({ title: res.title, url: res.url, iconUrl: '' }); }}
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                           <img 
                             src={getFaviconUrl(res.url)}
                             onError={(e) => {
                               const target = e.currentTarget;
                               try {
                                 const domain = new URL(res.url).hostname;
                                 if (target.dataset.fallback === '1') {
                                   target.onerror = null;
                                   target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(res.title || 'U')}&background=262626&color=fff&size=64`;
                                 } else {
                                   target.dataset.fallback = '1';
                                   target.src = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
                                 }
                               } catch {
                                 target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(res.title || 'U')}&background=262626&color=fff&size=64`;
                               }
                             }}
                             className="w-full h-full object-cover"
                             alt=""
                           />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium text-neutral-200 truncate">{res.title}</span>
                          <span className="text-xs text-neutral-500 truncate">{res.url.replace(/^https?:\/\//, '')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-neutral-500 text-xs">Searching web...</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-neutral-400 text-sm mb-1">No matching apps found</p>
                        {searchQuery.includes('.') ? (
                          <p className="text-neutral-500 text-xs">Press Enter to add custom URL</p>
                        ) : (
                          <p className="text-neutral-500 text-xs">Type a valid URL to add</p>
                        )}
                      </>
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
          <div className="flex items-center gap-2.5">
            <StartarrLogo size="sm" />
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Settings</span>
          </div>
          <button onClick={() => setIsSettingsOpen(false)} className="text-neutral-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-800">
             <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          
          {/* Background Settings */}
          <section className="border-t border-neutral-800 pt-6">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Features</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Show Recycle Bin</span>
              <button
                onClick={() => {
                  const val = !showRecycleBin;
                  setShowRecycleBin(val);
                  fetch('/api/settings', { method: 'PUT', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ show_recycle_bin: val }) }).catch(console.error);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative ${showRecycleBin ? 'bg-blue-500' : 'bg-neutral-700'}`}
              >
                <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-transform ${showRecycleBin ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>
          </section>

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
            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm text-neutral-400">UI Opacity</label>
                  <span className="text-sm font-medium text-neutral-300">{uiOpacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={uiOpacity} 
                  onChange={(e) => setUiOpacity(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm text-neutral-400">UI Blur</label>
                  <span className="text-sm font-medium text-neutral-300">{uiBlur}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="64" 
                  value={uiBlur} 
                  onChange={(e) => setUiBlur(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
            
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
                  {DEFAULT_CATEGORIES.map(cat => (
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
          id="app-context-menu"
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
                      style={{
                        filter: contextMenu.shortcut.invertIcon ? 'invert(1)' : 'none',
                        backgroundColor: contextMenu.shortcut.iconBackground === 'white' ? 'white' : contextMenu.shortcut.iconBackground === 'black' ? 'black' : 'transparent',
                        padding: contextMenu.shortcut.iconBackground === 'white' || contextMenu.shortcut.iconBackground === 'black' ? '2px' : '0'
                      }} 
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
                
                {(() => {
                  let domain = '';
                  try {
                    domain = new URL(contextMenu.shortcut.url).hostname;
                  } catch(e) {}
                  if (!domain) return null;
                  
                  const rawTitle = contextMenu.shortcut.title || '';
                  const domainClean = domain.replace(/^www\./, '').split('.')[0] || '';
                  // Clean rawTitle to strip subheadings like " – log in or sign up"
                  const cleanTitle = rawTitle.split(/[-|–|—|:•·]/)[0].trim();
                  const slug1 = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const slug2 = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                  const slug3 = domainClean.toLowerCase().replace(/[^a-z0-9]/g, '');

                  // STRICT: Slugs must have length >= 3 to prevent single-letter collisions like 'c' matching Coinbase!
                  const slugs = [...new Set([slug1, slug2, slug3].filter(s => s && s.length >= 3))];
                  
                  const quickIcons: string[] = [];
                  for (const s of slugs) {
                    quickIcons.push(`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg/${s}.svg`);
                    quickIcons.push(`https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${s}.png`);
                    quickIcons.push(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${s}.svg`);
                    quickIcons.push(`https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/${s}.svg`);
                  }

                  // High-res Google 128px Favicon (HD)
                  quickIcons.push(`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`);

                  // Append any extra icons found from live scanning
                  if (contextMenu.extraIcons && contextMenu.extraIcons.length > 0) {
                    quickIcons.push(...contextMenu.extraIcons);
                  }

                  // Strict filter: Exclude all .ico files and deduplicate
                  let displayedIcons = [...new Set(quickIcons)].filter(ico => 
                    !ico.toLowerCase().endsWith('.ico') && 
                    !ico.toLowerCase().includes('.ico?') && 
                    !ico.toLowerCase().includes('favicon.ico')
                  );

                  if (quickIconSearch.trim()) {
                    const term = quickIconSearch.trim().toLowerCase();
                    const filtered = displayedIcons.filter(ico => ico.toLowerCase().includes(term));
                    if (filtered.length > 0) {
                      displayedIcons = filtered;
                    }
                  }
                  
                  return (
                    <div className="flex flex-col space-y-2 mt-3">
                       <div className="flex items-center justify-between">
                         <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                           <span>Quick Icons</span>
                           {contextMenu.isScanning && (
                             <RefreshCw size={10} className="animate-spin text-blue-400" />
                           )}
                         </label>
                         <span className="text-[9px] text-neutral-500 font-medium">
                           {contextMenu.isScanning ? 'Scanning site...' : `${displayedIcons.length} HD Logos`}
                         </span>
                       </div>
                       
                       <div className="flex gap-2 flex-wrap max-h-36 overflow-y-auto pr-1">
                          {displayedIcons.map((ico, idx) => (
                             <button 
                                key={idx}
                                type="button"
                                title="Select icon"
                                onClick={() => {
                                   updateShortcutDynamically(contextMenu.shortcut!.id, { iconUrl: ico });
                                   setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, iconUrl: ico } }));
                                }}
                                className={`w-8 h-8 rounded-lg bg-neutral-950/60 border overflow-hidden flex items-center justify-center transition-all p-1 shrink-0 mb-1 ${
                                  contextMenu.shortcut?.iconUrl === ico 
                                    ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-500/10' 
                                    : 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                                }`}
                             >
                                <img 
                                   src={ico} 
                                   alt="icon"
                                   className="w-full h-full object-contain rounded" 
                                   onLoad={(e) => {
                                      const img = e.currentTarget;
                                      const isSvg = ico.toLowerCase().includes('.svg');
                                      // Strictly exclude low quality icons (< 64px width or height)
                                      if (!isSvg && img.naturalWidth > 0 && (img.naturalWidth < 64 || img.naturalHeight < 64)) {
                                         img.style.display = 'none';
                                         if (img.parentElement) {
                                            img.parentElement.style.display = 'none';
                                         }
                                      }
                                   }}
                                   onError={(e) => { 
                                      e.currentTarget.style.display = 'none'; 
                                      if (e.currentTarget.parentElement) {
                                         e.currentTarget.parentElement.style.display = 'none'; 
                                      }
                                   }} 
                                />
                             </button>
                          ))}
                       </div>

                       {/* Inline Scan & Search bar (No popup modal!) */}
                       <div className="flex gap-1.5 pt-1">
                         <div className="relative flex-1">
                           <input
                             type="text"
                             value={quickIconSearch}
                             onChange={(e) => setQuickIconSearch(e.target.value)}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 e.preventDefault();
                                 if (contextMenu.shortcut?.url) {
                                   scanQuickIcons(contextMenu.shortcut.url, quickIconSearch.trim());
                                 }
                               }
                             }}
                             placeholder="Search site logos..."
                             className="w-full bg-neutral-950/80 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                           />
                           {quickIconSearch && (
                             <button
                               type="button"
                               onClick={() => setQuickIconSearch('')}
                               className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                             >
                               <X size={11} />
                             </button>
                           )}
                         </div>
                         <button
                           type="button"
                           disabled={contextMenu.isScanning}
                           onClick={() => {
                             if (contextMenu.shortcut?.url) {
                               scanQuickIcons(contextMenu.shortcut.url, quickIconSearch.trim());
                             }
                           }}
                           className="px-2 py-1 bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors shrink-0 disabled:opacity-50"
                           title="Scan website for HD logos"
                         >
                           {contextMenu.isScanning ? (
                             <RefreshCw size={11} className="animate-spin text-blue-400" />
                           ) : (
                             <Search size={11} className="text-blue-400" />
                           )}
                           <span>{contextMenu.isScanning ? 'Scanning' : 'Scan'}</span>
                         </button>
                       </div>
                    </div>
                  );
                })()}
                
                <div className="flex flex-col space-y-2 mt-3 border-t border-neutral-800/50 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Invert Color</label>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newVal = !contextMenu.shortcut.invertIcon;
                        updateShortcutDynamically(contextMenu.shortcut!.id, { invertIcon: newVal });
                        setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, invertIcon: newVal } }));
                      }}
                      className={`cursor-pointer min-w-[40px] w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${contextMenu.shortcut.invertIcon ? 'bg-blue-500' : 'bg-neutral-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${contextMenu.shortcut.invertIcon ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Icon Background</label>
                    <div className="flex gap-2">
                      {(['transparent', 'white', 'black'] as const).map(bg => (
                        <button
                          key={bg}
                          onClick={() => {
                            updateShortcutDynamically(contextMenu.shortcut!.id, { iconBackground: bg });
                            setContextMenu(prev => ({ ...prev, shortcut: { ...prev.shortcut!, iconBackground: bg } }));
                          }}
                          className={`flex-1 py-1.5 text-[10px] rounded-md capitalize transition-colors border ${contextMenu.shortcut.iconBackground === bg || (!contextMenu.shortcut.iconBackground && bg === 'transparent') ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-800'}`}
                        >
                          {bg === 'transparent' ? 'None' : bg}
                        </button>
                      ))}
                    </div>
                  </div>
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

      {isRecycleBinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRecycleBinModalOpen(false)}></div>
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trash2 size={20} className="text-neutral-400" />
                Recycle Bin
              </h2>
              <button onClick={() => setIsRecycleBinModalOpen(false)} className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-neutral-950/50">
              {recycleBin.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-neutral-500 space-y-3">
                  <Trash size={48} className="opacity-20" />
                  <p>Recycle Bin is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recycleBin.map((item, idx) => (
                    <div key={item.id + idx} className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors">
                      <div className="flex items-center space-x-3 overflow-hidden">
                         <div className="w-10 h-10 shrink-0 bg-neutral-800 rounded-lg flex items-center justify-center">
                            {item.iconUrl ? <img src={item.iconUrl} className="w-6 h-6 object-contain" /> : <LayoutGrid size={16} className="text-neutral-400" />}
                         </div>
                         <div className="overflow-hidden">
                           <p className="text-sm font-medium text-white truncate">{item.title}</p>
                           <p className="text-xs text-neutral-500 uppercase">{item.type}</p>
                         </div>
                      </div>
                      <div className="flex space-x-2 shrink-0 ml-2">
                        <button 
                          onClick={() => {
                            // Restore item
                            setRecycleBin(prev => {
                               const updated = prev.filter(i => i.id !== item.id);
                               // Auto-saved by useEffect
                               return updated;
                            });
                            
                            // It will need to be re-added to the shortcuts state, and rendered by grid stack!
                            // Note: We use addWidgetToGrid for smooth entry!
                            setShortcuts(prev => {
                               // Make sure it doesn't already exist
                               if (prev.find(i => i.id === item.id)) return prev;
                               const updated = [...prev, item];
                               // fetch removed to prevent race conditions with saveGridState which runs momentarily
                               return updated;
                            });
                            
                            // Inject into GridStack natively so it appears seamlessly!
                            setTimeout(() => {
                               if (gridInstance.current) {
                                  addWidgetToGrid(item);
                                  setTimeout(() => saveGridState(), 100);
                               }
                            }, 10);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          Restore
                        </button>
                        <button 
                          onClick={() => {
                            // Perm Delete
                            setRecycleBin(prev => {
                               const updated = prev.filter(i => i.id !== item.id);
                               // Auto-saved by useEffect
                               return updated;
                            });
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {recycleBin.length > 0 && (
              <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 backdrop-blur flex justify-end">
                <button 
                  onClick={() => {
                    setRecycleBin([]);
                    // Auto-saved by useEffect
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Empty Recycle Bin
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
