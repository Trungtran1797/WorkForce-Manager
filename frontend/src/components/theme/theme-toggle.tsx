import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const handleToggle = (): void => {
    const root = window.document.documentElement
    const isDark = root.classList.contains('dark')

    if (theme === 'system') {
      setTheme(isDark ? 'light' : 'dark')
      return
    }

    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label="Chuyển đổi giao diện sáng/tối"
    >
      <Sun className="size-5 dark:hidden" />
      <Moon className="hidden size-5 dark:block" />
    </Button>
  )
}
