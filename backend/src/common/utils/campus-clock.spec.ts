import { campusNow, parseClockTime, slotStatus } from './campus-clock';

describe('campus-clock', () => {
  it('parses 12-hour clock strings', () => {
    expect(parseClockTime('09:00 AM')).toBe(9 * 60);
    expect(parseClockTime('12:30 PM')).toBe(12 * 60 + 30);
    expect(parseClockTime('12:15 AM')).toBe(15);
    expect(parseClockTime('1:30 PM')).toBe(13 * 60 + 30);
    expect(parseClockTime('garbage')).toBeNull();
  });

  it('evaluates "now" in IST regardless of the server timezone', () => {
    // 2026-10-12T04:00:00Z is Monday 09:30 in Asia/Kolkata (UTC+5:30).
    const now = campusNow(new Date('2026-10-12T04:00:00Z'));
    expect(now.dayCode).toBe('MON');
    expect(now.minutesSinceMidnight).toBe(9 * 60 + 30);
  });

  it('classifies slots relative to the current campus time', () => {
    const mon0930 = { dayCode: 'MON' as const, minutesSinceMidnight: 9 * 60 + 30 };
    expect(slotStatus('MON', '09:00 AM', '10:00 AM', mon0930)).toBe('LIVE');
    expect(slotStatus('MON', '10:15 AM', '11:15 AM', mon0930)).toBe('UPCOMING');
    expect(slotStatus('MON', '08:00 AM', '09:00 AM', mon0930)).toBe('COMPLETED');
    expect(slotStatus('TUE', '08:00 AM', '09:00 AM', mon0930)).toBe('UPCOMING');
  });

  it('treats Sunday as after the whole week', () => {
    const sunday = { dayCode: null, minutesSinceMidnight: 600 };
    expect(slotStatus('SAT', '09:00 AM', '10:00 AM', sunday)).toBe('COMPLETED');
  });
});
