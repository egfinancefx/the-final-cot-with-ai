import sys

with open('components/CompareView.tsx', 'r') as f:
    content = f.read()

target = "import TradingViewWidget from './TradingViewWidget';"
replacement = """import { RadarChart } from './charts/radar-chart';
import { RadarGrid } from './charts/radar-grid';
import { RadarAxis } from './charts/radar-axis';
import { RadarLabels } from './charts/radar-labels';
import { RadarArea } from './charts/radar-area';
import TradingViewWidget from './TradingViewWidget';"""

if target in content:
    content = content.replace(target, replacement)
    with open('components/CompareView.tsx', 'w') as f:
        f.write(content)
