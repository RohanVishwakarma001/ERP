import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_EVENTS = [
  {
    id: 'evt-01',
    title: 'Himalayan CodeFest 2026',
    organizer: 'CSI JBIT Student Chapter',
    date: '10-12 June 2026',
    venue: 'Turing Innovation Lab & Central Auditorium',
    category: 'HACKATHON',
    maxTeams: 64,
    registeredTeams: 42,
    cashPrizePool: '₹2,50,000',
  },
  {
    id: 'evt-02',
    title: 'Annual Cultural Fest "Anugoonj 2026"',
    organizer: 'Student Welfare & Cultural Committee',
    date: '20-22 October 2026',
    venue: 'Open Air Theatre (OAT)',
    category: 'CULTURAL',
    maxTeams: 120,
    registeredTeams: 98,
    cashPrizePool: '₹1,00,000',
  },
];

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return MOCK_EVENTS;
  }

  async registerTeam(eventId: string, teamData: any) {
    return {
      success: true,
      message: 'Team registration confirmed for event.',
      registrationNumber: `REG-EVT-${Date.now()}`,
    };
  }
}
