'use client';

import { useState, useEffect } from 'react';

// Extend the Window interface to include browser extension APIs
declare global {
  interface Window {
    chrome?: {
      runtime?: Record<string, unknown>;
    };
    browser?: {
      runtime?: Record<string, unknown>;
    };
  }
}

export function Toolbar() {
  const [shouldRenderToolbar, setShouldRenderToolbar] = useState(false);
  const [ToolbarComponent, setToolbarComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Only render toolbar if the 21st extension is available
    const checkExtension = async () => {
      try {
        // Check if the extension context is available
        if (typeof window !== 'undefined' && 
            (window.chrome?.runtime || window.browser?.runtime)) {
          setShouldRenderToolbar(true);
          
          // Dynamically import the components
          const { TwentyFirstToolbar } = await import("@21st-extension/toolbar-next");
          const { ReactPlugin } = await import("@21st-extension/react");
          
          // Create a wrapper component
          const ToolbarWrapper = () => (
            <TwentyFirstToolbar config={{ plugins: [ReactPlugin] }} />
          );
          
          setToolbarComponent(() => ToolbarWrapper);
        }
      } catch (error) {
        console.log('21st Extension not available:', error);
        setShouldRenderToolbar(false);
      }
    };

    checkExtension();
  }, []);

  // Only render the toolbar if the extension is available and component is loaded
  if (!shouldRenderToolbar || !ToolbarComponent) {
    return null;
  }

  return <ToolbarComponent />;
}
