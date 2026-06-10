function calculateNextReview(schedule, quality) {
  let { ease_factor, interval_days, repetitions } = schedule;

  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions += 1;
  }

  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval_days);

  return { ease_factor, interval_days, repetitions, next_review_date: nextDate, last_reviewed_at: new Date() };
}

module.exports = { calculateNextReview };