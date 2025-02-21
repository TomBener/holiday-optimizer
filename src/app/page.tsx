'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { optimizeCTODays } from '@/services/optimizer.deepseek';
import { ResultsDisplay } from '@/components/features/ResultsDisplay';
import { OptimizerForm } from '@/components/OptimizerForm';
import { OptimizerProvider } from '@/contexts/OptimizerContext';
import { CustomDayOff, OptimizationStrategy } from '@/types';

interface FormState {
  numberOfDays: number | null
  strategy: OptimizationStrategy
  customDaysOff: Array<CustomDayOff>
  holidays: Array<{ date: string, name: string }>
}

const DEFAULT_FORM_STATE: FormState = {
  numberOfDays: null,
  strategy: 'balanced',
  customDaysOff: [],
  holidays: []
}

const HomePage = () => {
  const currentYear = new Date().getFullYear()
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [shouldScrollToResults, setShouldScrollToResults] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const { optimizedDays, breaks, stats } = useMemo(() => {
    if (formState.numberOfDays === null) {
      return { optimizedDays: null, breaks: [], stats: null, error: null }
    }

    try {
      setIsOptimizing(true)
      const result = optimizeCTODays({
        numberOfDays: formState.numberOfDays,
        strategy: formState.strategy,
        year: currentYear,
        customDaysOff: formState.customDaysOff,
        holidays: formState.holidays
      })
      setShouldScrollToResults(true)
      return {
        optimizedDays: result.days,
        breaks: result.breaks,
        stats: result.stats,
        error: null
      }
    } catch (e) {
      return {
        optimizedDays: null,
        breaks: [],
        stats: null,
        error: e instanceof Error ? e.message : 'An error occurred'
      }
    } finally {
      setIsOptimizing(false)
    }
  }, [currentYear, formState.numberOfDays, formState.customDaysOff, formState.strategy, formState.holidays])

  useEffect(() => {
    if (shouldScrollToResults && resultsRef.current && window.innerWidth < 1024) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToResults(false);
    }
  }, [shouldScrollToResults, optimizedDays]);

  return (
      <OptimizerProvider>
        <main className="flex-grow">
          {/* Title Section */}
          <div className="bg--gray-50/90 dark:gray-900 border-b border-gray-200/60 dark:border-gray-700/30 py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  Plan Your Time Off
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Optimize your CTO days for maximum time off in {currentYear}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-8 xl:px-12 py-6">
            <div className={`grid gap-6 ${optimizedDays ? 'lg:grid-cols-[minmax(480px,1fr),minmax(480px,2fr)]' : ''} mx-auto max-w-[1400px]`}>
              {/* Form Section - Always visible */}
              <div className={`${optimizedDays ? 'lg:sticky lg:top-6 lg:self-start max-w-2xl' : 'max-w-xl mx-auto w-full'} space-y-4`}>
                <OptimizerForm
                  onSubmit={({ days, strategy, customDaysOff, holidays }) => {
                    setFormState({
                      numberOfDays: days,
                      strategy,
                      customDaysOff,
                      holidays
                    })
                  }}
                  isLoading={isOptimizing}
                />
              </div>

              {/* Results Section - Appears when there are results */}
              {optimizedDays && optimizedDays.length > 0 && (
                <div className="space-y-4 min-w-0 max-w-4xl">
                  <ResultsDisplay
                    ref={resultsRef}
                    optimizedDays={optimizedDays}
                    breaks={breaks}
                    stats={stats}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </OptimizerProvider>
  )
}

export default HomePage
