// services/SessionsHttpClient.ts
import { HttpClientBase } from './HttpClientBase';
import { Appointment } from '../interfaces/Appointment';

export class SessionsHttpClient extends HttpClientBase {
  async getSessions(date: string): Promise<Appointment[]> {
    const formattedDate = this.formatDateForApi(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      throw new Error("Invalid date format.");
    }
    const url = `/api/Sessions/${formattedDate}/all`;
    return this.get<Appointment[]>(url);
  }

  private formatDateForApi(date: string): string {
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}
