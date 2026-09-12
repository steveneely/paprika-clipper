"""Build a reproducible store ZIP containing only reviewed extension files."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
extension = root / 'extension'
manifest = json.loads((extension / 'manifest.json').read_text())
files = [
    'manifest.json', 'background.js', 'capture.js', 'connect.js', 'protocol.js',
    'popup.html', 'popup.css', 'popup.js', 'icons/icon.svg',
    'icons/icon-16.png', 'icons/icon-32.png', 'icons/icon-48.png', 'icons/icon-128.png',
]
actual = {p.relative_to(extension).as_posix() for p in extension.rglob('*') if p.is_file()}
assert actual == set(files), f'Review unexpected or missing extension files: {actual ^ set(files)}'
assert manifest['host_permissions'] == ['https://www.paprikaapp.com/*']
assert manifest['permissions'] == ['activeTab', 'scripting', 'storage']
payload = {name: (extension / name).read_bytes() for name in files}
payload['LICENSE'] = (root / 'LICENSE').read_bytes()
output = root / 'dist'
output.mkdir(exist_ok=True)
archive = output / f"paprika-recipe-clipper-{manifest['version']}.zip"
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    for name in sorted(payload):
        info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        bundle.writestr(info, payload[name])
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    assert 'manifest.json' in bundle.namelist()
    assert bundle.read('LICENSE') == (root / 'LICENSE').read_bytes()
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(archive.with_suffix('.zip.sha256')).write_text(f'{checksum}  {archive.name}\n')
print(f'{archive.name}: {len(payload)} files, {archive.stat().st_size:,} bytes')
print(f'SHA256 {checksum}')
