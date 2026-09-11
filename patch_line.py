import sys

with open('components/charts/line.tsx', 'r') as f:
    content = f.read()

import_motion = 'import { motion } from "motion/react";\n'
if import_motion not in content:
    content = import_motion + content

old_path = """  if (useDataTransitionPath && animatedPathD) {
    return (
      <path
        d={animatedPathD}
        fill="none"
        ref={pathRef}
        stroke={visibleStroke}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    );
  }"""

new_path = """  if (useDataTransitionPath && animatedPathD) {
    return (
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.85, 0, 0.15, 1] }}
        d={animatedPathD}
        fill="none"
        ref={pathRef}
        stroke={visibleStroke}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    );
  }"""

content = content.replace(old_path, new_path)

old_linepath = """  return (
    <LinePath
      curve={curve}
      data={renderData}
      innerRef={pathRef}
      stroke={visibleStroke}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      x={(d) => xScale(xAccessor(d)) ?? 0}
      y={getY}
    />
  );"""

new_linepath = """  return (
    <LinePath
      curve={curve}
      data={renderData}
      x={(d) => xScale(xAccessor(d)) ?? 0}
      y={getY}
    >
      {({ path }) => {
        const d = path(renderData) || '';
        return (
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.85, 0, 0.15, 1] }}
            d={d}
            fill="none"
            ref={pathRef}
            stroke={visibleStroke}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        );
      }}
    </LinePath>
  );"""

content = content.replace(old_linepath, new_linepath)

with open('components/charts/line.tsx', 'w') as f:
    f.write(content)
