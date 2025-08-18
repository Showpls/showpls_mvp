import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Theme } from '@radix-ui/themes';
import { useTheme } from 'next-themes';

export function RadixThemeProvider({ children }: PropsWithChildren) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid hydration mismatch by waiting until the client knows the theme
    return null;
  }

  const appearance = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <Theme appearance={appearance}>
      {children}
    </Theme>
  );
}
