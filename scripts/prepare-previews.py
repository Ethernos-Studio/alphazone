"""Archive verified screenshots and create a presentation sheet (no AI imagery)."""
from pathlib import Path
import argparse
from PIL import Image, ImageOps, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument('--desktop', required=True)
parser.add_argument('--mobile', required=True)
parser.add_argument('--mobile-crop', nargs=4, type=int)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / 'previews'
out.mkdir(exist_ok=True)
desktop = Image.open(args.desktop).convert('RGB')
mobile = Image.open(args.mobile).convert('RGB')
if args.mobile_crop:
    mobile = mobile.crop(tuple(args.mobile_crop))
desktop.save(out / 'alpha_zone_desktop_v1.png')
mobile.save(out / 'alpha_zone_mobile_v1.png')
board = Image.new('RGB', (1600, 1280), '#e5ebe9')
draw = ImageDraw.Draw(board)
font_path = root / 'assets/fonts/BigShoulders-Bold.ttf'
font = ImageFont.truetype(str(font_path), 50)
small = ImageFont.truetype(str(root / 'assets/fonts/InstrumentSans-Regular.ttf'), 15)
draw.text((64, 32), 'ALPHA ZONE', font=font, fill='#101c25')
draw.text((1150, 52), 'WORLD ARCHIVE / CONCEPT 01', font=small, fill='#405563')
draw.line((64, 111, 1536, 111), fill='#82949f', width=1)
desktop = ImageOps.contain(desktop, (950, 1040), Image.Resampling.LANCZOS)
mobile = ImageOps.contain(mobile, (420, 960), Image.Resampling.LANCZOS)
board.paste(desktop, (64, 151))
board.paste(mobile, (1074, 194))
draw.text((64, 1212), 'DESKTOP / LOCAL BROWSER CAPTURE', font=small, fill='#405563')
draw.text((1074, 1212), 'MOBILE / 390 PX VIEWPORT', font=small, fill='#405563')
board.save(out / 'alpha_zone_preview_v1.png')
for file in out.glob('*.png'):
    with Image.open(file) as image:
        image.verify()
    print(file.name, Image.open(file).size)
