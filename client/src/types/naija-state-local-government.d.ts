declare module 'naija-state-local-government' {
  type StateWithLgas = {
    state: string;
    senatorial_districts: string[];
    lgas: string[];
  };

  const NaijaStates: {
    all(): StateWithLgas[];
    states(): string[];
    senatorial_districts(state: string): string[];
    lgas(state: string): StateWithLgas;
  };

  export default NaijaStates;
}
