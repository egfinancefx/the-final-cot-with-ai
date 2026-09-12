import re

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("<AIAnalysisOverlay", "<AIAnalysisOverlay\n        isAiOfflineMode={isAiOfflineMode}")

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)
