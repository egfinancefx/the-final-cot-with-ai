import re

with open('components/AssetTrendCard.tsx', 'r') as f:
    content = f.read()

# Update Line Chart Animation Duration
content = content.replace('animationDuration={1600}', 'animationDuration={800}')
content = content.replace('animationDuration={1800}', 'animationDuration={1000}')

# Update Gauge delay so it fires after the shorter line chart animation
content = content.replace('animationDelayMs={index * 140 + 1600}', 'animationDelayMs={index * 140 + 850}')

with open('components/AssetTrendCard.tsx', 'w') as f:
    f.write(content)
