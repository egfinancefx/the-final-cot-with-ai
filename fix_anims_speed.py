import re

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

# 1. Update Line and Bar internal animation durations
content = content.replace('animationBegin={300}', 'animationBegin={100}')
content = content.replace('animationDuration={1200}', 'animationDuration={500}')

# 2. Update motion.div overall durations
content = content.replace('duration: 0.8', 'duration: 0.4')
content = content.replace('duration: 0.3', 'duration: 0.2')

# 3. Update motion.div delays
content = content.replace('delay: 0.1', 'delay: 0.05')
content = content.replace('delay: 0.2', 'delay: 0.1')
content = content.replace('delay: 0.3', 'delay: 0.15')
content = content.replace('delay: 0.4', 'delay: 0.2')
content = content.replace('delay: 0.5', 'delay: 0.25')

# 4. Update RadarChart
content = content.replace('<RadarChart data={radarData} metrics={radarMetrics} size={340} margin={60}>', '<RadarChart data={radarData} metrics={radarMetrics} size={340} margin={60} enterDurationMs={500} staggerScale={0.5}>')

with open('components/CompareView.tsx', 'w') as f:
    f.write(content)
