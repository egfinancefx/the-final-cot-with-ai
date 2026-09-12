import re

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("const sparkColor = themeMode === 'light' ? '#2563eb' : '#f97316';", "const sparkColor = themeMode === 'light' ? '#2563eb' : '#ffffff';")
# Any other orange?
content = content.replace('bg-orange-400', 'bg-white')
content = content.replace('text-orange-400', 'text-white')

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)


with open('components/AssetTrendCard.tsx', 'r') as f:
    content = f.read()
    
# In AssetTrendCard, the sparkline might use orange?
# We set: strokeColor = "#3b82f6"; gradientColor = "#3b82f6";
# So it's already blue. Wait, did I make it orange?
# No, AssetTrendCard has strokeColor = "#3b82f6" for both light and dark.

with open('components/AssetTrendCard.tsx', 'w') as f:
    f.write(content)
