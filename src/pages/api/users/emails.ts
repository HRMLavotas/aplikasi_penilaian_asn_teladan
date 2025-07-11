// API endpoint placeholder - not used in current implementation
export default function handler() {
  return new Response(JSON.stringify({ message: "Not implemented" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}