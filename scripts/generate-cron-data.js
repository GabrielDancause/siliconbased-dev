import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cronParser from 'cron-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data = [
  { slug: "every-minute", expression: "* * * * *", humanReadable: "Every minute", useCase: "Heartbeat checks, real-time data processing" },
  { slug: "every-5-minutes", expression: "*/5 * * * *", humanReadable: "Every 5 minutes", useCase: "Monitoring, polling APIs" },
  { slug: "every-10-minutes", expression: "*/10 * * * *", humanReadable: "Every 10 minutes", useCase: "Periodic background jobs" },
  { slug: "every-15-minutes", expression: "*/15 * * * *", humanReadable: "Every 15 minutes", useCase: "Frequent status updates" },
  { slug: "every-30-minutes", expression: "*/30 * * * *", humanReadable: "Every 30 minutes", useCase: "Half-hourly syncs" },
  { slug: "every-hour", expression: "0 * * * *", humanReadable: "Every hour", useCase: "Hourly data aggregations" },
  { slug: "every-2-hours", expression: "0 */2 * * *", humanReadable: "Every 2 hours", useCase: "Regular maintenance tasks" },
  { slug: "every-6-hours", expression: "0 */6 * * *", humanReadable: "Every 6 hours", useCase: "Log rotations, cache clearing" },
  { slug: "every-12-hours", expression: "0 */12 * * *", humanReadable: "Every 12 hours", useCase: "Twice daily backups" },
  { slug: "every-day-midnight", expression: "0 0 * * *", humanReadable: "Every day at midnight", useCase: "Daily database backups, resets" },
  { slug: "every-day-noon", expression: "0 12 * * *", humanReadable: "Every day at noon", useCase: "Midday reports" },
  { slug: "every-monday", expression: "0 0 * * 1", humanReadable: "Every Monday", useCase: "Weekly reports, Monday morning start jobs" },
  { slug: "every-weekday", expression: "0 0 * * 1-5", humanReadable: "Every weekday (Monday to Friday)", useCase: "Business day initializations" },
  { slug: "every-weekend", expression: "0 0 * * 6,0", humanReadable: "Every weekend (Saturday and Sunday)", useCase: "Weekend cleanup tasks" },
  { slug: "every-sunday", expression: "0 0 * * 0", humanReadable: "Every Sunday", useCase: "Weekly digests, deep cleanups" },
  { slug: "every-first-of-month", expression: "0 0 1 * *", humanReadable: "First day of every month", useCase: "Monthly billing, report generation" },
  { slug: "every-last-day-of-month", expression: "59 23 L * *", humanReadable: "Last day of the month", useCase: "End of month financial processing" },
  { slug: "every-monday-9am", expression: "0 9 * * 1", humanReadable: "Every Monday at 9:00 AM", useCase: "Weekly kick-off emails" },
  { slug: "every-friday-5pm", expression: "0 17 * * 5", humanReadable: "Every Friday at 5:00 PM", useCase: "End of week summaries" },
  { slug: "every-quarter-hour", expression: "*/15 * * * *", humanReadable: "Every quarter hour", useCase: "Checking for new messages" },
  { slug: "every-business-day-9am", expression: "0 9 * * 1-5", humanReadable: "Every business day at 9:00 AM", useCase: "Daily standup reminders" },
  { slug: "twice-a-day", expression: "0 0,12 * * *", humanReadable: "Twice a day", useCase: "Bi-daily data syncs" },
  { slug: "three-times-a-day", expression: "0 0,8,16 * * *", humanReadable: "Three times a day", useCase: "Shift worker notifications" },
  { slug: "once-a-week", expression: "0 0 * * 0", humanReadable: "Once a week", useCase: "Weekly newsletter sends" },
  { slug: "once-a-month", expression: "0 0 1 * *", humanReadable: "Once a month", useCase: "Monthly subscriptions renewals" },
  { slug: "every-january-1st", expression: "0 0 1 1 *", humanReadable: "Every January 1st", useCase: "Yearly system resets" },
  { slug: "every-15th-of-month", expression: "0 0 15 * *", humanReadable: "Every 15th of the month", useCase: "Mid-month processing" },
  { slug: "monday-to-friday-8am", expression: "0 8 * * 1-5", humanReadable: "Monday to Friday at 8:00 AM", useCase: "Morning status updates" },
  { slug: "every-other-hour", expression: "0 */2 * * *", humanReadable: "Every other hour", useCase: "Frequent log checking" },
  { slug: "at-midnight", expression: "0 0 * * *", humanReadable: "At midnight", useCase: "Nightly batch jobs" },
  { slug: "at-noon", expression: "0 12 * * *", humanReadable: "At noon", useCase: "Lunchtime notifications" },
  { slug: "at-6am", expression: "0 6 * * *", humanReadable: "At 6:00 AM", useCase: "Early morning prep tasks" },
  { slug: "at-9am", expression: "0 9 * * *", humanReadable: "At 9:00 AM", useCase: "Start of business day jobs" },
  { slug: "at-5pm", expression: "0 17 * * *", humanReadable: "At 5:00 PM", useCase: "End of day processing" },
  { slug: "at-10pm", expression: "0 22 * * *", humanReadable: "At 10:00 PM", useCase: "Late night backups" },
  { slug: "every-day-at-3am", expression: "0 3 * * *", humanReadable: "Every day at 3:00 AM", useCase: "Low-traffic maintenance" },
  { slug: "every-sunday-at-midnight", expression: "0 0 * * 0", humanReadable: "Every Sunday at midnight", useCase: "Weekly server reboots" },
  { slug: "every-weekday-at-6am", expression: "0 6 * * 1-5", humanReadable: "Every weekday at 6:00 AM", useCase: "Morning data loads" },
  { slug: "first-monday-of-month", expression: "0 0 1-7 * 1", humanReadable: "First Monday of the month", useCase: "Monthly team meetings" },
  { slug: "last-friday-of-month", expression: "0 0 * * 5L", humanReadable: "Last Friday of the month", useCase: "End of month reviews" },
  { slug: "every-5-minutes-during-business-hours", expression: "*/5 9-17 * * 1-5", humanReadable: "Every 5 minutes during business hours", useCase: "High-frequency monitoring during work hours" },
  { slug: "every-hour-during-night", expression: "0 0-6,22-23 * * *", humanReadable: "Every hour during the night", useCase: "Off-peak processing" },
  { slug: "every-30-seconds", expression: "* * * * * *", humanReadable: "Every 30 seconds (Non-standard)", useCase: "Ultra-frequent health checks" },
  { slug: "twice-a-week", expression: "0 0 * * 2,5", humanReadable: "Twice a week (Tuesday and Friday)", useCase: "Bi-weekly syncs" },
  { slug: "three-times-a-week", expression: "0 0 * * 1,3,5", humanReadable: "Three times a week (Mon, Wed, Fri)", useCase: "Regular updates" },
  { slug: "every-other-day", expression: "0 0 */2 * *", humanReadable: "Every other day", useCase: "Alternate day backups" },
  { slug: "first-and-fifteenth", expression: "0 0 1,15 * *", humanReadable: "1st and 15th of the month", useCase: "Payroll processing" },
  { slug: "quarterly", expression: "0 0 1 1,4,7,10 *", humanReadable: "Quarterly", useCase: "Quarterly tax preparations" },
  { slug: "annually", expression: "0 0 1 1 *", humanReadable: "Annually", useCase: "Yearly reviews" },
  { slug: "every-minute-in-january", expression: "* * * 1 *", humanReadable: "Every minute in January", useCase: "Start of year intense monitoring" },
  { slug: "weekdays-at-noon", expression: "0 12 * * 1-5", humanReadable: "Weekdays at noon", useCase: "Midday business reports" },
  { slug: "weekends-at-10am", expression: "0 10 * * 6,0", humanReadable: "Weekends at 10:00 AM", useCase: "Weekend alert summaries" },
  { slug: "every-wednesday-and-friday", expression: "0 0 * * 3,5", humanReadable: "Every Wednesday and Friday", useCase: "Mid and end of week checks" },
  { slug: "every-day-at-1am", expression: "0 1 * * *", humanReadable: "Every day at 1:00 AM", useCase: "Nightly data warehousing" },
  { slug: "every-tuesday-at-2pm", expression: "0 14 * * 2", humanReadable: "Every Tuesday at 2:00 PM", useCase: "Weekly afternoon sync" },
  { slug: "first-of-quarter", expression: "0 0 1 1,4,7,10 *", humanReadable: "First day of the quarter", useCase: "Quarterly report generation" },
  { slug: "every-6-hours-starting-at-8am", expression: "0 8,14,20,2 * * *", humanReadable: "Every 6 hours starting at 8:00 AM", useCase: "Staggered 6-hour jobs" },
  { slug: "mon-wed-fri-at-9am", expression: "0 9 * * 1,3,5", humanReadable: "Mon, Wed, and Fri at 9:00 AM", useCase: "Morning standup reminders" },
  { slug: "every-4-hours", expression: "0 */4 * * *", humanReadable: "Every 4 hours", useCase: "Frequent data synchronization" },
  { slug: "every-3-hours", expression: "0 */3 * * *", humanReadable: "Every 3 hours", useCase: "Updating rolling caches" },
  { slug: "every-90-minutes", expression: "0,30 */1 * * *", humanReadable: "Every 90 minutes (Approximate)", useCase: "Continuous integration polling" },
  { slug: "every-45-minutes", expression: "0,45 * * * *", humanReadable: "Every 45 minutes (Approximate)", useCase: "Sub-hourly scheduled tasks" },
  { slug: "sat-and-sun-at-8am", expression: "0 8 * * 6,0", humanReadable: "Saturday and Sunday at 8:00 AM", useCase: "Weekend morning jobs" },
  { slug: "new-years-day", expression: "0 0 1 1 *", humanReadable: "New Year's Day", useCase: "Holiday specific greetings" },
  { slug: "christmas", expression: "0 0 25 12 *", humanReadable: "Christmas Day", useCase: "Holiday special promotions" },
  { slug: "halloween", expression: "0 0 31 10 *", humanReadable: "Halloween", useCase: "Seasonal content updates" },
  { slug: "valentines-day", expression: "0 0 14 2 *", humanReadable: "Valentine's Day", useCase: "Event specific jobs" },
  { slug: "first-weekday-of-month", expression: "0 0 1-3 * 1-5", humanReadable: "First weekday of the month (Approximate)", useCase: "Monthly business start" },
  { slug: "last-weekday-of-month", expression: "0 0 LW * *", humanReadable: "Last weekday of the month", useCase: "End of month business close" },
  { slug: "every-day-at-430am", expression: "30 4 * * *", humanReadable: "Every day at 4:30 AM", useCase: "Early morning prep" },
  { slug: "bi-weekly", expression: "0 0 * * 1/2", humanReadable: "Bi-weekly (Approximate)", useCase: "Fortnightly processing" },
  { slug: "every-2-weeks-on-monday", expression: "0 0 * * 1/2", humanReadable: "Every 2 weeks on Monday (Approximate)", useCase: "Sprint planning reminders" },
  { slug: "end-of-business-day", expression: "0 17 * * 1-5", humanReadable: "End of business day (5:00 PM)", useCase: "Closing reports" },
  { slug: "start-of-business-day", expression: "0 9 * * 1-5", humanReadable: "Start of business day (9:00 AM)", useCase: "Opening reports" },
  { slug: "lunch-time-daily", expression: "0 12 * * *", humanReadable: "Lunch time daily", useCase: "Midday syncs" },
  { slug: "every-night-at-2am", expression: "0 2 * * *", humanReadable: "Every night at 2:00 AM", useCase: "Database re-indexing" },
  { slug: "every-morning-at-7am", expression: "0 7 * * *", humanReadable: "Every morning at 7:00 AM", useCase: "Morning briefing emails" },
  { slug: "twice-daily-9am-9pm", expression: "0 9,21 * * *", humanReadable: "Twice daily at 9:00 AM and 9:00 PM", useCase: "Shift change logs" },
  { slug: "every-10-minutes-mon-fri", expression: "*/10 * * * 1-5", humanReadable: "Every 10 minutes from Monday to Friday", useCase: "Continuous deployment checks" }
];

const parseCronFields = (expression) => {
  const parts = expression.split(' ');
  // Handle non-standard 6-part cron by ignoring the first part (seconds) for field descriptions
  const isSixPart = parts.length === 6;
  const minute = isSixPart ? parts[1] : parts[0];
  const hour = isSixPart ? parts[2] : parts[1];
  const dayOfMonth = isSixPart ? parts[3] : parts[2];
  const month = isSixPart ? parts[4] : parts[3];
  const dayOfWeek = isSixPart ? parts[5] : parts[4];

  return {
    minute: `Minute: ${minute}`,
    hour: `Hour: ${hour}`,
    dayOfMonth: `Day of the Month: ${dayOfMonth}`,
    month: `Month: ${month}`,
    dayOfWeek: `Day of the Week: ${dayOfWeek}`
  };
};

const getNextRuns = (expression) => {
  try {
    const isSixPart = expression.split(' ').length === 6;
    const interval = cronParser.CronExpressionParser.parse(expression, {
      currentDate: new Date('2025-01-01T00:00:00Z'),
      tz: 'UTC'
    });
    const runs = [];
    for (let i = 0; i < 5; i++) {
      runs.push(interval.next().toString());
    }
    return runs;
  } catch (e) {
    // For unsupported features like 'L', 'LW', '1/2', provide generic examples
    return [
      "Cannot perfectly calculate next runs for non-standard expressions with L, W, or step modifiers natively. Will trigger according to exact implementation.",
      "See specific parser documentation for details.",
      "Typically triggers as described in plain English.",
      "...",
      "..."
    ];
  }
};

const processedData = data.map((item, index) => {
  // Generate related slugs (just take 3 nearby ones for simplicity)
  const related = [];
  for (let i = 1; i <= 3; i++) {
    const relatedIndex = (index + i) % data.length;
    related.push(data[relatedIndex].slug);
  }

  return {
    ...item,
    fields: parseCronFields(item.expression),
    nextRuns: getNextRuns(item.expression),
    relatedExpressions: related
  };
});

fs.writeFileSync(
  path.join(__dirname, '../data/cron-expressions.json'),
  JSON.stringify(processedData, null, 2)
);

console.log('Successfully generated data/cron-expressions.json');