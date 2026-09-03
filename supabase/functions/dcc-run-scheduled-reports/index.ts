import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function computeNextRun(recurrence: string, currentRun: Date): Date {
  const next = new Date(currentRun);
  if (recurrence === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (recurrence === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === "monthly") {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date().toISOString();

    // Find all active schedules whose next_run_at has passed
    const { data: dueSchedules, error: fetchError } = await supabaseAdmin
      .from("dcc_report_schedules")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", now)
      .order("next_run_at", { ascending: true });

    if (fetchError) throw fetchError;

    const processed: string[] = [];
    const errors: string[] = [];

    for (const schedule of dueSchedules ?? []) {
      try {
        // Mark as run — update last_run_at and advance next_run_at for recurring
        const updates: Record<string, string | null> = {
          last_run_at: now,
          updated_at: now,
        };

        if (schedule.recurrence === "one-time") {
          updates.is_active = "false";
        } else {
          const nextRun = computeNextRun(schedule.recurrence, new Date(schedule.next_run_at));
          updates.next_run_at = nextRun.toISOString();
        }

        const { error: updateError } = await supabaseAdmin
          .from("dcc_report_schedules")
          .update(updates)
          .eq("id", schedule.id);

        if (updateError) {
          errors.push(`${schedule.id}: ${updateError.message}`);
        } else {
          processed.push(schedule.id);
        }
      } catch (err) {
        errors.push(`${schedule.id}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processed.length,
        errors: errors.length > 0 ? errors : undefined,
        run_at: now,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Scheduled report runner error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
