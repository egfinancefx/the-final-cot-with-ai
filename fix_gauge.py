import re

with open('components/ui/Gauge.tsx', 'r') as f:
    content = f.read()

# Add animationDelayMs and valueClassName to Props
props_repl = """interface GaugeProps {
  value: number;
  centerValue?: number;
  totalNotches?: number;
  activeFill?: string;
  inactiveFill?: string;
  className?: string;
  valueClassName?: string;
  size?: number;
  startAngle?: number;
  endAngle?: number;
  animationDelayMs?: number;
}

export function Gauge({
  value,
  centerValue,
  totalNotches = 40,
  activeFill = "#3b82f6",
  inactiveFill = "rgba(148, 163, 184, 0.2)",
  className = "",
  valueClassName = "",
  size = 120,
  startAngle = 135,
  endAngle = 405,
  animationDelayMs = 0,
}: GaugeProps) {"""

content = re.sub(r'interface GaugeProps \{.*?\}: GaugeProps\) \{', props_repl, content, flags=re.DOTALL)

# Update delay in notch motion.line
content = content.replace('delay: i * 0.015,', 'delay: (animationDelayMs / 1000) + (i * 0.015),')

# Wrap NumberFlow in motion.div and update class
number_flow_old = """      {centerValue !== undefined && (
        <div className="absolute inset-0 flex flex-col items-center justify-center font-mono pointer-events-none">
          <NumberFlow 
            value={centerValue} 
            format={{ notation: "compact", maximumFractionDigits: 1 }}
            className="text-lg font-medium tracking-tight"
          />
        </div>
      )}"""

number_flow_new = """      {centerValue !== undefined && (
        <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center font-mono pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: (animationDelayMs / 1000) + 0.3 }}
        >
          <NumberFlow 
            value={centerValue} 
            format={{ notation: "compact", maximumFractionDigits: 1 }}
            className={`text-sm font-semibold tracking-tight ${valueClassName}`}
          />
        </motion.div>
      )}"""

content = content.replace(number_flow_old, number_flow_new)

with open('components/ui/Gauge.tsx', 'w') as f:
    f.write(content)
