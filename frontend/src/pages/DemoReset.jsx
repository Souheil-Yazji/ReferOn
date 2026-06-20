import { useState } from 'react'
import { RotateCcw, CheckCircle2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useDemoContext } from '../context/useDemoContext'

export default function DemoReset() {
  const { resetDemo } = useDemoContext()
  const [didReset, setDidReset] = useState(false)

  function handleReset() {
    resetDemo()
    setDidReset(true)
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <RotateCcw className="h-10 w-10 text-brand-500" />
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Reset Demo Data</h2>
        <p className="text-sm text-slate-600">
          Clears all in-memory state and reloads the seeded patients, specialists, and referrals.
        </p>
        <Button variant="danger" onClick={handleReset}>
          Reset Demo Data
        </Button>
        {didReset && (
          <p className="flex items-center gap-1 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Demo data has been reset.
          </p>
        )}
      </Card>
    </div>
  )
}
