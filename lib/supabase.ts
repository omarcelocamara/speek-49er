import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PostStatus = "pending" | "approved" | "rejected";

export interface Post {
  id: string;
  founder_id: string;
  meeting_id: string;
  content: string;
  option_number: number;
  status: PostStatus;
  created_at: string;
}

export interface Meeting {
  id: string;
  founder_id: string;
  title: string;
  transcript: string;
  meeting_date: string;
  created_at: string;
}
