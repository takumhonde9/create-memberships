declare namespace NodeJS {
  export interface ProcessEnv {
    NEST_ENVIRONMENT: 'production' | 'development' | 'test' | 'staging';
    DATABASE_URL: string;
    STRIPE_SECRET: string;
    MAXIMUM_NUM_SEATS: number;
  }
}
