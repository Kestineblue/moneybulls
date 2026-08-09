import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://diqesykwroxyzjwqnqif.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcWVzeWt3cm94eXpqd3FucWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5ODE5NjksImV4cCI6MjA5OTU1Nzk2OX0.61lcvIuGshbL8XUdcwhkJR065Rg6woOaPy-HtqlVd9c"
);

export interface Profile {
  id: string;
  email: string;
  phone: string;
  full_name?: string;
  kyc_status: "pending" | "approved" | "rejected";
  dob?: string;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  min_amount: number;
  fee_tier: string;
  withdrawal_windows: number | string;
}

export interface Investment {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  status: string;
  cycle_start: string;
  cycle_end: string;
  created_at: string;
  packages?: Package;
}

export interface EarningsLog {
  id: string;
  investment_id: string;
  date: string;
  amount: number;
  note: string;
  timestamp: string;
}
