import type { MeetingRow } from './types';

const CO2_KG_PER_KWH = 0.233;
const KWH_PER_ATTENDEE_HOUR = 0.52;
const TREE_ANNUAL_KG = 25;

export type Kpis = {
  avoided: number;
  attendeeHoursSaved: number;
  costSaved: number;
  co2Kg: number;
  kwh: number;
  trees: number;
  mps: number;
  totalIntercepts: number;
};

export function computeKpis(rows: MeetingRow[], feedback: { score: number }[]): Kpis {
  let avoided = 0;
  let attendeeHoursSaved = 0;
  let costSaved = 0;

  for (const r of rows) {
    const hoursPer = r.duration_minutes / 60;
    if (r.verdict === 'kill' || r.verdict === 'async') {
      avoided += 1;
      const saved = r.attendees_proposed * hoursPer;
      attendeeHoursSaved += saved;
      costSaved += saved * Number(r.avg_hourly_rate || 0);
    } else if (r.verdict === 'trim') {
      const droppedPeople = Math.max(0, r.attendees_proposed - r.attendees_recommended);
      const trimmedHours = (r.duration_minutes - Math.min(r.duration_minutes, 20)) / 60;
      const saved =
        droppedPeople * hoursPer +
        Math.max(0, trimmedHours) * r.attendees_recommended;
      attendeeHoursSaved += saved;
      costSaved += saved * Number(r.avg_hourly_rate || 0);
    }
  }

  const kwh = attendeeHoursSaved * KWH_PER_ATTENDEE_HOUR;
  const co2Kg = kwh * CO2_KG_PER_KWH;
  const trees = co2Kg / TREE_ANNUAL_KG;

  const promoters = feedback.filter((f) => f.score >= 9).length;
  const detractors = feedback.filter((f) => f.score <= 6).length;
  const mps = feedback.length
    ? Math.round(((promoters - detractors) / feedback.length) * 100)
    : 0;

  return {
    avoided,
    attendeeHoursSaved,
    costSaved,
    co2Kg,
    kwh,
    trees,
    mps,
    totalIntercepts: rows.length,
  };
}
