const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`        .dynamic-header-bg {
          background-color: rgba(0, 0, 0, \${(uiOpacity / 100) * 0.3}) !important;
          backdrop-filter: blur(\${uiBlur}px) !important;
          -webkit-backdrop-filter: blur(\${uiBlur}px) !important;
        }
      \`}</style>`,
`        .dynamic-header-bg {
          background-color: rgba(0, 0, 0, \${(uiOpacity / 100) * 0.3}) !important;
          backdrop-filter: blur(\${uiBlur}px) !important;
          -webkit-backdrop-filter: blur(\${uiBlur}px) !important;
        }
        .grid-stack-item.ui-draggable-dragging, .grid-stack-item.grid-stack-item-dragging {
          z-index: 99999 !important;
        }
      \`}</style>`
);

code = code.replace(
`      {/* Recycle Bin Drop Zone / Button */}
      {showRecycleBin && (
        <div 
          onClick={() => setIsRecycleBinModalOpen(true)}
          className="recycle-bin-zone fixed bottom-6 right-6 w-[88px] h-[88px] dynamic-ui-bg border-2 border-neutral-800/60 rounded-[1.25rem] shadow-2xl z-40 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-neutral-800/50 hover:border-neutral-600 hover:scale-105 active:scale-95 group"
        >
          <Trash2 size={32} className="text-neutral-500 group-hover:text-red-400 mb-1 transition-colors" />
          <span className="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-300 tracking-wide">Recycle Bin</span>
          {recycleBin.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-6 min-w-6 px-1 flex items-center justify-center shadow-lg border-2 border-neutral-900">
              {recycleBin.length}
            </div>
          )}
        </div>
      )}`,
`      {/* Recycle Bin Drop Zone / Button */}
      {showRecycleBin && (
        <div 
          onClick={() => setIsRecycleBinModalOpen(true)}
          className="recycle-bin-zone fixed bottom-6 right-6 w-[88px] h-[88px] dynamic-ui-bg border-2 border-neutral-800/60 rounded-[1.25rem] shadow-2xl z-20 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-neutral-800/50 hover:border-neutral-600 hover:scale-105 active:scale-95 group"
        >
          <img src="https://img.icons8.com/fluency/96/delete-trash.png" alt="Recycle Bin" className="w-10 h-10 mb-0.5 drop-shadow-md opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <span className="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-300 tracking-wide">Recycle Bin</span>
          {recycleBin.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-6 min-w-6 px-1 flex items-center justify-center shadow-lg border-2 border-neutral-900 z-10">
              {recycleBin.length}
            </div>
          )}
        </div>
      )}`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched Recycle Bin styling and z-index");
