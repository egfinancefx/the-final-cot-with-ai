const fs = require('fs');

const file = fs.readFileSync('components/AIAnalysisOverlay.tsx', 'utf8');

let newFile = file;

// 1. Add import motion
if (!newFile.includes("import { motion }")) {
    newFile = newFile.replace("import { SummaryRow }", "import { motion } from 'motion/react';\nimport { SummaryRow }");
}

// 2. Define variants inside AIAnalysisOverlay before renderContent
const variantsCode = `
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96, filter: 'blur(4px)' },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        filter: 'blur(0px)',
        transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
  };
`;

if (!newFile.includes("const containerVariants")) {
    newFile = newFile.replace("const renderContent = () => {", variantsCode + "\n  const renderContent = () => {");
}

fs.writeFileSync('components/AIAnalysisOverlay.tsx', newFile);
console.log("Imports and variants added.");
