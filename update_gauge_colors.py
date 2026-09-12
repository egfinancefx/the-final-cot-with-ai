import re

with open('components/AssetTrendCard.tsx', 'r') as f:
    content = f.read()

content = content.replace("activeFill={themeMode === 'light' ? '#2563eb' : '#3b82f6'}", "activeFill={themeMode === 'light' ? '#2563eb' : '#ffffff'}")
content = content.replace("inactiveFill={themeMode === 'light' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(59, 130, 246, 0.1)'}", "inactiveFill={themeMode === 'light' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255, 255, 255, 0.15)'}")

with open('components/AssetTrendCard.tsx', 'w') as f:
    f.write(content)
