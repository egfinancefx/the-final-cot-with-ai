import re

with open('components/AssetTrendCard.tsx', 'r') as f:
    content = f.read()

# Locate the Gauge component call
old_gauge = """                <Gauge 
                    value={longRatio} 
                    centerValue={netPos}
                    size={80}
                    activeFill={themeMode === 'light' ? '#2563eb' : '#ffffff'}
                    inactiveFill={themeMode === 'light' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
                />"""

new_gauge = """                <Gauge 
                    value={longRatio} 
                    centerValue={netPos}
                    size={80}
                    activeFill={themeMode === 'light' ? '#2563eb' : '#3b82f6'}
                    inactiveFill={themeMode === 'light' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(59, 130, 246, 0.2)'}
                    valueClassName={themeMode === 'light' ? 'text-blue-700' : 'text-blue-400'}
                    animationDelayMs={index * 140 + 1600}
                />"""

content = content.replace(old_gauge, new_gauge)

with open('components/AssetTrendCard.tsx', 'w') as f:
    f.write(content)
