const fs = require('fs');

const path = 'src/app/gallery/[slug]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// The problematic code blocks to move:
const useMemoBlock = `  const visibleAlbums = useMemo(() => {
    return albums.filter(album => {
      return media.some(m => m.Album_ID === album.Album_ID && m.Media_Type === (viewMode === 'photos' ? 'photo' : 'video'));
    });
  }, [albums, media, viewMode]);`;

const useEffectBlock = `  useEffect(() => {
    if (visibleAlbums.length > 0 && !visibleAlbums.some(a => a.Album_ID === activeAlbumId)) {
      setActiveAlbumId(visibleAlbums[0].Album_ID);
    } else if (visibleAlbums.length === 0 && activeAlbumId !== null) {
      setActiveAlbumId(null);
    }
  }, [viewMode, visibleAlbums, activeAlbumId]);`;

// Remove them from their current location
code = code.replace(useMemoBlock, '');
code = code.replace(useEffectBlock, '');

// Insert them BEFORE the early returns
const insertionPoint = '  const handleDownloadAll = () => {';
const insertionIndex = code.indexOf(insertionPoint);

if (insertionIndex !== -1) {
  const newCode = code.slice(0, insertionIndex) + useMemoBlock + '\n\n' + useEffectBlock + '\n\n' + code.slice(insertionIndex);
  fs.writeFileSync(path, newCode);
  console.log("Fixed!");
} else {
  console.log("Could not find insertion point");
}
