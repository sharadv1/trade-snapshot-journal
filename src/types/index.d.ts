
// Only adding the missing property to WeeklyReflection interface

export interface WeeklyReflection {
  id: string;
  weekId: string;
  reflection?: string;
  grade?: string;
  weeklyPlan?: string;
  weekStart?: string;
  weekEnd?: string;
  lastUpdated?: string;
  tradeIds?: string[];
  isFutureWeek?: boolean;
}
