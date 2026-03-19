#!/usr/bin/env bash
#
# build-packages.sh
# Builds .termext packages (zip archives) for every plugin in registry/plugins/.
# Output goes to registry/packages/.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGINS_DIR="$REPO_ROOT/registry/plugins"
PACKAGES_DIR="$REPO_ROOT/registry/packages"

# Ensure the output directory exists
mkdir -p "$PACKAGES_DIR"

# Remove any stale packages from a previous run
rm -f "$PACKAGES_DIR"/*.termext

count=0

for plugin_dir in "$PLUGINS_DIR"/*/; do
  # Extract plugin id from the directory name
  plugin_id="$(basename "$plugin_dir")"
  output_file="$PACKAGES_DIR/${plugin_id}.termext"

  # Create zip with files at the root level (no subdirectory nesting)
  (cd "$plugin_dir" && zip -q "$output_file" ./*)

  count=$((count + 1))
done

echo "Built $count packages in registry/packages/"
