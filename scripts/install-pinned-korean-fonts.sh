#!/usr/bin/env bash
set -euo pipefail

# Official Noto CJK Sans/Serif collections, pinned and checksum verified.
# Keep Korean rendering available without waiting for unrelated apt indexes.
font_revision=f8d157532fbfaeda587e826d4cd5b21a49186f7c
font_install_dir="${JOYLAB_FONT_DIR:-${HOME}/.local/share/fonts/joylab-noto-cjk}"
font_download_dir=$(mktemp -d)
trap 'rm -rf "$font_download_dir"' EXIT
for family in Sans Serif; do
  for weight in Regular Bold; do
    filename="Noto${family}CJK-${weight}.ttc"
    curl --fail --location --retry 2 --connect-timeout 15 --max-time 90 \
      "https://raw.githubusercontent.com/notofonts/noto-cjk/${font_revision}/${family}/OTC/${filename}" \
      --output "${font_download_dir}/${filename}"
  done
done
(
  cd "$font_download_dir"
  sha256sum --check <<'CHECKSUMS'
b76b0433203017ca80401b2ee0dd69350349871c4b19d504c34dbdd80541690a  NotoSansCJK-Regular.ttc
faa5f3656a78b2e2d450d27fe8382c778bc2b6bb5ea29c986664a6a435056ceb  NotoSansCJK-Bold.ttc
5d9c31a059600193c9d7968a998bde886ccdc77e934006ad243b41794c496a7d  NotoSerifCJK-Regular.ttc
1505ee3b9c0890fae6302ee0e9c6fd74d690f4a55a6ace1d9944f3f6352d622d  NotoSerifCJK-Bold.ttc
CHECKSUMS
)
mkdir -p "$font_install_dir"
cp "$font_download_dir"/*.ttc "$font_install_dir"/
fc-cache -f "$font_install_dir"
fc-match 'Noto Sans CJK KR' | grep -Fq 'Noto Sans CJK KR'
fc-match 'Noto Serif CJK KR' | grep -Fq 'Noto Serif CJK KR'
