const calendarDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export function formatCalendarDate(dateValue) {
  if (!dateValue) {
    return 'Choose a date';
  }

  // Anchor the date at midday so timezone conversion does not shift it backward.
  return calendarDateFormatter.format(new Date(`${dateValue}T12:00:00`));
}
