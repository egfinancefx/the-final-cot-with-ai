import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

old_colors = r"const ASSET_COLORS = isLight \? \['#2563eb', '#ea580c', '#475569'\] : \['#3b82f6', '#f97316', '#ffffff'\];"
new_colors = "const ASSET_COLORS = isLight ? ['#2563eb', '#64748b', '#ea580c'] : ['#3b82f6', '#ffffff', '#f97316'];"

content = re.sub(old_colors, new_colors, content)

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
