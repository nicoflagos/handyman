declare module 'naija-state-local-government' {
  type State = {
    state: string;
    capital: string;
    latitude?: string | number;
    longitude?: string | number;
    created?: string;
    modified?: string;
  };

  type Lga = {
    localGovt: string;
    state: string;
    created?: string;
    modified?: string;
  };

  type Ward = {
    ward: string;
    state: string;
    localGovt: string;
    created?: string;
    modified?: string;
  };

  const NaijaStates: {
    states(): State[];
    lgas(state: string): string[];
    wards(state: string, lga: string): Ward[];
    all(): { states: State[]; lgas: Lga[]; wards: Ward[] };
  };

  export default NaijaStates;
}

