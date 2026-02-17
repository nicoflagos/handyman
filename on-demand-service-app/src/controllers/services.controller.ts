import { Request, Response } from 'express';

const SERVICES = [
  {
    key: 'plumbing',
    name: 'Plumbing',
    description: 'Leaks, clogs, fixtures, and general plumbing repairs.',
  },
  {
    key: 'electrical',
    name: 'Electrical',
    description: 'Switches, outlets, lighting, and basic electrical work.',
  },
  {
    key: 'cleaning',
    name: 'Home Cleaning',
    description: 'Standard cleaning, deep cleaning, move-in/out.',
  },
  {
    key: 'handyman',
    name: 'General Handyman',
    description: 'Small repairs, mounting, assembly, and odd jobs.',
  },
] as const;

export class ServicesController {
  async list(_req: Request, res: Response) {
    return res.status(200).json(SERVICES);
  }
}

