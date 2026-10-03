#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'This packaging script requires macOS.' >&2
  exit 1
fi
arch="${1:-$(uname -m)}"
[[ "$arch" == x86_64 ]] && arch=x64
case "$arch" in arm64|x64) ;; *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; esac
version="$(node -p "JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version")"
app="../VSCode-darwin-$arch/KunCode.app"
[[ -d "$app" ]] || { echo "Build the application first: $app" >&2; exit 1; }
output="$HOME/Desktop/KunCode-macOS-$arch-$version.pkg"
productbuild --component "$app" /Applications "$output"
echo "Created: $output (unsigned; not notarized)"
