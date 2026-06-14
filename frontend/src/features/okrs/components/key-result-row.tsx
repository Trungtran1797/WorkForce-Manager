import { useState, type ChangeEvent } from 'react'
import { Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgressBar } from '@/components/common/progress-bar'
import type { KeyResult } from '@/features/okrs/types'

interface KeyResultRowProps {
  keyResult: KeyResult
  onUpdateProgress: (keyResultId: number, currentValue: number) => Promise<void>
}

export function KeyResultRow({ keyResult, onUpdateProgress }: KeyResultRowProps) {
  const [value, setValue] = useState(keyResult.currentValue)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (): Promise<void> => {
    setIsSaving(true)
    try {
      await onUpdateProgress(keyResult.id, value)
    } finally {
      setIsSaving(false)
    }
  }

  const dirty = value !== keyResult.currentValue

  return (
    <div className="space-y-1.5 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{keyResult.title}</p>
        <span className="text-xs text-muted-foreground">{keyResult.progress.toFixed(0)}%</span>
      </div>
      <ProgressBar value={keyResult.progress} />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          className="h-8 w-24"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.valueAsNumber || 0)}
        />
        <span className="text-xs text-muted-foreground">
          / {keyResult.targetValue} {keyResult.unit}
        </span>
        {dirty && (
          <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Cập nhật
          </Button>
        )}
      </div>
    </div>
  )
}
