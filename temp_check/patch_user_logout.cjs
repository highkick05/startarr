const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add LogOut and User to lucide-react import
code = code.replace(
  /import { Plus, X, Link2, LayoutGrid, Search, Globe, Settings, Trash2, Image as ImageIcon, Video as VideoIcon, Upload, Trash } from 'lucide-react';/,
  "import { Plus, X, Link2, LayoutGrid, Search, Globe, Settings, Trash2, Image as ImageIcon, Video as VideoIcon, Upload, Trash, LogOut, User } from 'lucide-react';"
);

// 2. Destructure user from AuthContext
code = code.replace(
  "const { logout } = React.useContext(AuthContext);",
  "const { user, logout } = React.useContext(AuthContext);"
);

// 3. Update floating settings button to include user context and logout
const target = `{/* Settings floating button (bottom right) */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shadow-xl hover:bg-neutral-800 hover:text-white transition-all transform hover:scale-105 active:scale-95 pointer-events-auto"
        title="Settings"
      >
        <Settings size={22} />
      </button>`;

const replacement = `{/* Settings floating button & User controls (bottom right) */}
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
      </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
