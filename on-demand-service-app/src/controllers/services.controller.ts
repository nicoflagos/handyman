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
    key: 'ac_technician',
    name: 'AC Technician',
    description: 'AC servicing, installation checks, gas refills, and basic troubleshooting.',
  },
  {
    key: 'mechanic',
    name: 'Mechanic',
    description: 'Vehicle diagnostics, minor repairs, maintenance, and emergency assistance.',
  },
  {
    key: 'cleaning',
    name: 'Home Cleaning',
    description: 'Standard cleaning, deep cleaning, move-in/out.',
  },
  {
    key: 'handyman',
    name: 'Handyman (Repairs & Errands)',
    description: 'Small repairs, mounting, assembly, pickups/drop-offs, and general errands.',
  },
  {
    key: 'hair_stylist',
    name: 'Hair Stylist',
    description: 'Haircuts, styling, braids, and hair care services.',
  },
  {
    key: 'makeup_artist',
    name: 'Make-up Artist',
    description: 'Event make-up, bridal make-up, and glam sessions.',
  },
  {
    key: 'nail_technician',
    name: 'Nail Technician',
    description: 'Manicure, pedicure, nail art, and gel/acrylic services.',
  },
  {
    key: 'barber',
    name: 'Barber',
    description: 'Haircuts, fades, lineups, and beard grooming.',
  },
  {
    key: 'tailor',
    name: 'Tailor',
    description: 'Alterations, fittings, repairs, and custom tailoring.',
  },
] as const;

export class ServicesController {
  async list(_req: Request, res: Response) {
    return res.status(200).json(SERVICES);
  }
}
