"""Create distributable website ZIP. Run: uv run python scripts/package_site.py."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
target = root / 'Alpha_Zone_website_v1.zip'
files = [root / name for name in ('index.html', 'styles.css', 'story-data.js', 'app.js', 'README.md')]
for directory in ('assets', 'scripts', 'previews'):
    files.extend(p for p in (root / directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(files):
        archive.write(file, 'Alpha_Zone/' + file.relative_to(root).as_posix())
with ZipFile(target) as archive:
    assert archive.testzip() is None
    print(f'{target.name}: {len(archive.namelist())} files, {target.stat().st_size:,} bytes, integrity OK')
