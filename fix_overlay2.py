import re

with open('components/AIAnalysisOverlay.tsx', 'r') as f:
    content = f.read()

warning_code = """
              {isAiOfflineMode && (
                  <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-start gap-4">
                      <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                      <div>
                          <h4 className="text-base font-semibold mb-1">AI Live Connection Offline (Quota Exceeded)</h4>
                          <p className="text-sm opacity-90 leading-relaxed">The AI is currently unable to connect to the live market database due to API limits. You are viewing the automated, pre-programmed institutional fallback analysis. This is a highly accurate mathematical simulation, but it does not contain today's live Google News.</p>
                      </div>
                  </div>
              )}
"""

content = content.replace("{/* 1. Hero Section: Sentiment & Strategy */}", warning_code + "\n              {/* 1. Hero Section: Sentiment & Strategy */}")

with open('components/AIAnalysisOverlay.tsx', 'w') as f:
    f.write(content)
