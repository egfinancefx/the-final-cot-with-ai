import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# Remove global ASSET_COLORS
content = re.sub(r"// Distinct modern color palette.*?const ASSET_COLORS = \['#3b82f6', '#06b6d4', '#818cf8'\];\n", "", content, flags=re.DOTALL)

# Add it inside CompareView before processedAssets
insert_pos = content.find('const processedAssets = useMemo(() => {')
if insert_pos != -1:
    new_colors = "  const ASSET_COLORS = isLight ? ['#2563eb', '#ea580c', '#475569'] : ['#3b82f6', '#f97316', '#ffffff'];\n\n  "
    content = content[:insert_pos] + new_colors + content[insert_pos:]

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
