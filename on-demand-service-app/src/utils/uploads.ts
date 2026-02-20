import fs from 'fs';
import path from 'path';

export function getUploadsRootDir() {
  const configured = process.env.UPLOADS_DIR;
  if (configured && configured.trim()) {
    const dir = path.resolve(configured.trim());
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  // Render persistent disk default mount.
  const renderData = path.resolve('/var/data');
  if (fs.existsSync(renderData)) {
    const dir = path.join(renderData, 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  // Fallback: local/dev (not persistent on many hosts).
  const dir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

