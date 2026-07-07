import React, { useRef, useEffect } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

const TradingViewWidget: React.FC<{ symbol: string, themeMode: string }> = React.memo(({ symbol, themeMode }) => {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef(`tv_widget_${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    if (!container.current) return;

    const initWidget = () => {
      if (typeof window.TradingView !== 'undefined') {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: themeMode === 'light' ? 'light' : 'dark',
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_top_toolbar: true,
          hide_legend: true,
          hide_side_toolbar: false,
          save_image: false,
          calendar: false,
          hide_volume: true,
          container_id: widgetId.current,
          support_host: "https://www.tradingview.com"
        });
      }
    };

    if (typeof window.TradingView === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, themeMode]);

  return (
    <div className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
      <div id={widgetId.current} style={{ height: "100%", width: "100%" }} ref={container} />
    </div>
  );
});

export default TradingViewWidget;
