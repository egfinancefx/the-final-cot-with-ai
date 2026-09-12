import re

with open('components/AssetTrendCard.tsx', 'r') as f:
    content = f.read()

# Add import
import_str = "import { Gauge } from './ui/Gauge';\n"
content = content.replace("import { formatCurrency } from '../utils';", "import { formatCurrency } from '../utils';\n" + import_str)

# Calculate longRatio
calc_str = """  const netPos = summaryRow["Net Positions"];
  const netChange = summaryRow["Net Change"];
  const longPos = summaryRow["Long Positions"];
  const longChange = summaryRow["Long Change"];
  const shortPos = summaryRow["Short Positions"];
  const shortChange = summaryRow["Short Change"];
  const totalPos = longPos + shortPos;
  const longRatio = totalPos > 0 ? (longPos / totalPos) * 100 : 50;"""

content = re.sub(r'  const netPos = summaryRow\["Net Positions"\];.*?  const shortChange = summaryRow\["Short Change"\];', calc_str, content, flags=re.DOTALL)

# Add Gauge to right side
gauge_jsx = """            </div>
            
            {/* Right Column: Gauge Animation */}
            <div className="shrink-0 flex items-center justify-center -mt-2 -mr-2">
                <Gauge 
                    value={longRatio} 
                    centerValue={netPos}
                    size={80}
                    activeFill={themeMode === 'light' ? '#2563eb' : '#3b82f6'}
                    inactiveFill={themeMode === 'light' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(59, 130, 246, 0.1)'}
                />
            </div>
        </div>
      </div>"""

content = content.replace("""            </div>
        </div>
      </div>""", gauge_jsx, 1)

with open('components/AssetTrendCard.tsx', 'w') as f:
    f.write(content)

print("Patched successfully")
