import { Injectable, NotFoundException } from '@nestjs/common';

/**
 * Campus events are not modelled in the database yet, so there is nothing to list
 * and nothing to register for. Returning invented events (or fake registration
 * numbers) would mislead users, so the API reports the true, empty state.
 */
@Injectable()
export class EventsService {
  async findAll(): Promise<never[]> {
    return [];
  }

  async registerTeam(eventId: string, _teamData: { teamName: string; members?: string[] }): Promise<never> {
    throw new NotFoundException(`Event ${eventId} not found.`);
  }
}
