import { anonymousError, enforceAnonymousQuota, hashAnonymousIp, validateAnonymousUpload } from "./anonymous.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}
const browserId = "11111111-1111-4111-8111-111111111111";
function upload() {
  const form = new FormData();
  form.set("image", new File([new Uint8Array(900)], "image.png", { type: "image/png" }));
  form.set("browser_id", browserId);
  return form;
}
Deno.test("anonymous requests require a random browser UUID", () => {
  const form = upload();
  assert(validateAnonymousUpload(form) === null, "Valid single upload rejected");
  form.delete("browser_id");
  assert(validateAnonymousUpload(form) === "anonymous_browser_id_required", "Missing UUID allowed");
  form.set("browser_id", "not-a-uuid");
  assert(validateAnonymousUpload(form) === "anonymous_browser_id_required", "Invalid UUID allowed");
});
Deno.test("anonymous scans reject batches and duplicate image fields", () => {
  const form = upload();
  form.append("image", new File(["second"], "second.png"));
  assert(validateAnonymousUpload(form) === "anonymous_single_image_only", "Two images allowed");
  const batch = upload();
  batch.set("batch_size", "2");
  assert(validateAnonymousUpload(batch) === "anonymous_single_image_only", "Batch allowed");
});
Deno.test("IP identifiers use salted SHA-256, not raw addresses", async () => {
  const hash = await hashAnonymousIp("192.0.2.1", "test-salt");
  assert(hash === "85660fe60314c0d4e0300fea202896c1ce62e93115bf964dd89a1686ff2d339d", "SHA-256 mismatch");
  assert(hash !== await hashAnonymousIp("192.0.2.1", "other-salt"), "Salt ignored");
});
Deno.test("quota calls fail closed and return recognizable errors", async () => {
  const denied = await enforceAnonymousQuota(async () => ({ data: null, error: new Error("private db error") }), false);
  assert(denied?.status === 503, "Database failure allowed scan");
  assert((await denied?.json()).error === "anonymous_scan_unavailable", "Raw error returned");
  const response = anonymousError("anonymous_limit_reached");
  assert(response.status === 429 && (await response.json()).error === "anonymous_limit_reached", "Limit not recognizable");
});
Deno.test("quota preflight does not record successes; commit is explicit", async () => {
  const calls: boolean[] = [];
  const rpc = async (commit: boolean) => { calls.push(commit); return { data: "allowed", error: null }; };
  assert(await enforceAnonymousQuota(rpc, false) === null, "Preflight rejected");
  assert(calls.length === 1 && calls[0] === false, "Preflight consumed scan");
  assert(await enforceAnonymousQuota(rpc, true) === null, "Commit rejected");
  assert(calls.length === 2 && calls[1] === true, "Success not committed");
});