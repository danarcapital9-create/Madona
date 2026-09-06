import assert from "node:assert/strict";
import test from "node:test";
import {registerHooks} from "node:module";
// Node SSR smoke tests provide the Worker runtime binding explicitly.
const workerBindings={MADONNA_ADMIN_EMAIL:"owner@test.local",MADONNA_WORKSPACE_ID:"test-salon"};
globalThis.__renderBindings=workerBindings;
registerHooks({resolve(specifier,context,next){if(specifier==="cloudflare:workers")return {url:"data:text/javascript,export const env=globalThis.__renderBindings",shortCircuit:true};return next(specifier,context);}});

test("renders the customer entry without admin navigation or an install manifest", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html=await response.text();
  assert.match(html, /<title>Madonna/);
  assert.match(html,/signature-hero/);
  assert.match(html,/living-silk/);
  for(const label of ["عناية الأظافر","الرموش","المكياج","تصفيف الشعر","العناية والاسترخاء"])assert.ok(html.includes(`aria-label="احجزي ${label}"`));
  assert.equal((html.match(/class="signature-book"/g)||[]).length,1);
  assert.doesNotMatch(html,/orchid-fallback|hero-side-note/);
  assert.doesNotMatch(html,/مساحة الإدارة|شاهدي الطلب في لوحة الإدارة/);
  assert.doesNotMatch(html,/<link[^>]+rel="manifest"/);
});

test("admin PWA entry renders manifest and restricts non-admin identity",async()=>{const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url));const env={ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},ctx={waitUntil(){},passThroughOnException(){}};const fetchDesk=email=>worker.fetch(new Request('http://localhost/desk',{headers:{accept:'text/html','oai-authenticated-user-id':'test-user','oai-authenticated-user-email':email}}),env,ctx);const allowed=await fetchDesk('owner@test.local');assert.equal(allowed.status,200);const html=await allowed.text();assert.match(html,/manifest.webmanifest/);assert.match(html,/تثبيت التطبيق/);const denied=await fetchDesk('client@test.local');assert.match(await denied.text(),/هذا الحساب غير مخوّل/);});
