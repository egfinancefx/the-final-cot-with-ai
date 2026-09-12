import re

with open('components/ui/Gauge.tsx', 'r') as f:
    content = f.read()

motion_line_old = """            animate={{ 
              opacity: notch.isActive ? 1 : 0.4, 
              stroke: notch.isActive ? activeFill : inactiveFill 
            }}"""

motion_line_new = """            animate={{ 
              opacity: notch.isActive ? 1 : 0.4, 
              stroke: notch.isActive ? activeFill : inactiveFill,
              filter: notch.isActive ? `drop-shadow(0 0 4px ${activeFill})` : "drop-shadow(0 0 0px transparent)"
            }}"""

content = content.replace(motion_line_old, motion_line_new)

with open('components/ui/Gauge.tsx', 'w') as f:
    f.write(content)
