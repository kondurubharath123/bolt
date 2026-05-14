import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}


Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const path = url.pathname.replace("/deviation-api", "") || "/";
  const method = req.method;

  try {
    // GET /users - list all users
    if (method === "GET" && path === "/users") {
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: true });
      if (error) return errorResponse(error.message, 500);
      return jsonResponse(data);
    }

    // GET /requests - list deviation requests (optional status filter)
    if (method === "GET" && path === "/requests") {
      const status = url.searchParams.get("status");
      let query = supabase.from("deviation_requests").select("*, users!deviation_requests_created_by_fkey(username, role)").order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) return errorResponse(error.message, 500);
      return jsonResponse(data);
    }

    // GET /requests/:id - single request with logs
    if (method === "GET" && path.startsWith("/requests/") && path.split("/").length === 3) {
      const id = path.split("/")[2];
      const { data: reqData, error: reqError } = await supabase
        .from("deviation_requests")
        .select("*, users!deviation_requests_created_by_fkey(username, role)")
        .eq("id", id)
        .maybeSingle();
      if (reqError) return errorResponse(reqError.message, 500);
      if (!reqData) return errorResponse("Request not found", 404);

      const { data: logs, error: logsError } = await supabase
        .from("approval_logs")
        .select("*, users!approval_logs_actor_fkey(username)")
        .eq("request_id", id)
        .order("created_at", { ascending: true });
      if (logsError) return errorResponse(logsError.message, 500);

      return jsonResponse({ ...reqData, logs });
    }

    // POST /requests - create new deviation request
    if (method === "POST" && path === "/requests") {
      const body = await req.json();
      const { customer_id, deviation_type, business_justification, created_by } = body;

      if (!customer_id || !deviation_type || !business_justification || !created_by) {
        return errorResponse("Missing required fields");
      }

      const { data, error } = await supabase
        .from("deviation_requests")
        .insert({
          customer_id,
          deviation_type,
          business_justification,
          status: "Draft",
          created_by,
        })
        .select("*, users!deviation_requests_created_by_fkey(username, role)")
        .single();

      if (error) return errorResponse(error.message, 500);

      // Audit log
      await supabase.from("approval_logs").insert({
        request_id: data.id,
        actor: created_by,
        action: "Create",
        previous_state: "N/A",
        new_state: "Draft",
        comments: "Request created",
      });

      return jsonResponse(data, 201);
    }

    // POST /requests/:id/update-ai - save AI justification from client
    if (method === "POST" && path.match(/^\/requests\/[^/]+\/update-ai$/)) {
      const id = path.split("/")[2];
      const body = await req.json();
      const { ai_justification } = body;

      if (!ai_justification || ai_justification.trim() === "") {
        return errorResponse("AI justification text is required");
      }

      const { data: reqData, error: reqError } = await supabase
        .from("deviation_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (reqError) return errorResponse(reqError.message, 500);
      if (!reqData) return errorResponse("Request not found", 404);

      const { data, error } = await supabase
        .from("deviation_requests")
        .update({ ai_justification, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, users!deviation_requests_created_by_fkey(username, role)")
        .single();

      if (error) return errorResponse(error.message, 500);

      return jsonResponse(data);
    }

    // POST /requests/:id/submit - submit request for approval
    if (method === "POST" && path.match(/^\/requests\/[^/]+\/submit$/)) {
      const id = path.split("/")[2];
      const body = await req.json();
      const { actor } = body;

      const { data: reqData, error: reqError } = await supabase
        .from("deviation_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (reqError) return errorResponse(reqError.message, 500);
      if (!reqData) return errorResponse("Request not found", 404);
      if (reqData.status !== "Draft") return errorResponse("Only Draft requests can be submitted");
      if (!reqData.ai_justification) return errorResponse("AI justification must be generated before submission");

      const { data, error } = await supabase
        .from("deviation_requests")
        .update({ status: "Pending Approval", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, users!deviation_requests_created_by_fkey(username, role)")
        .single();

      if (error) return errorResponse(error.message, 500);

      await supabase.from("approval_logs").insert({
        request_id: id,
        actor,
        action: "Submit",
        previous_state: "Draft",
        new_state: "Pending Approval",
        comments: "Submitted for approval",
      });

      return jsonResponse(data);
    }

    // POST /requests/:id/approve - approve request
    if (method === "POST" && path.match(/^\/requests\/[^/]+\/approve$/)) {
      const id = path.split("/")[2];
      const body = await req.json();
      const { actor, comments } = body;

      const { data: reqData, error: reqError } = await supabase
        .from("deviation_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (reqError) return errorResponse(reqError.message, 500);
      if (!reqData) return errorResponse("Request not found", 404);
      if (reqData.status !== "Pending Approval") return errorResponse("Only Pending Approval requests can be approved");

      const { data, error } = await supabase
        .from("deviation_requests")
        .update({ status: "Approved", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, users!deviation_requests_created_by_fkey(username, role)")
        .single();

      if (error) return errorResponse(error.message, 500);

      await supabase.from("approval_logs").insert({
        request_id: id,
        actor,
        action: "Approve",
        previous_state: "Pending Approval",
        new_state: "Approved",
        comments: comments || "Approved",
      });

      return jsonResponse(data);
    }

    // POST /requests/:id/reject - reject request
    if (method === "POST" && path.match(/^\/requests\/[^/]+\/reject$/)) {
      const id = path.split("/")[2];
      const body = await req.json();
      const { actor, comments } = body;

      if (!comments || comments.trim() === "") {
        return errorResponse("Rejection requires a comment");
      }

      const { data: reqData, error: reqError } = await supabase
        .from("deviation_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (reqError) return errorResponse(reqError.message, 500);
      if (!reqData) return errorResponse("Request not found", 404);
      if (reqData.status !== "Pending Approval") return errorResponse("Only Pending Approval requests can be rejected");

      const { data, error } = await supabase
        .from("deviation_requests")
        .update({ status: "Rejected", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*, users!deviation_requests_created_by_fkey(username, role)")
        .single();

      if (error) return errorResponse(error.message, 500);

      await supabase.from("approval_logs").insert({
        request_id: id,
        actor,
        action: "Reject",
        previous_state: "Pending Approval",
        new_state: "Rejected",
        comments,
      });

      return jsonResponse(data);
    }

    // GET /logs - list all approval logs
    if (method === "GET" && path === "/logs") {
      const { data, error } = await supabase
        .from("approval_logs")
        .select("*, users!approval_logs_actor_fkey(username), deviation_requests!approval_logs_request_id_fkey(customer_id, deviation_type)")
        .order("created_at", { ascending: false });
      if (error) return errorResponse(error.message, 500);
      return jsonResponse(data);
    }

    return errorResponse("Not found", 404);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
