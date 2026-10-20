// OpenAlex query helper: node _refs/oa.mjs "<search>" [extraFilter] [perPage]
const search = process.argv[2];
const extra = process.argv[3] || "";
const per = process.argv[4] || "10";
const filter = ["from_publication_date:2023-01-01", "to_publication_date:2026-12-31", extra]
  .filter(Boolean)
  .join(",");
const url =
  "https://api.openalex.org/works?search=" +
  encodeURIComponent(search) +
  "&filter=" +
  filter +
  "&per-page=" +
  per +
  "&select=id,doi,title,publication_year,language,type,authorships,primary_location,biblio,open_access";

const r = await fetch(url, { headers: { "User-Agent": "ref-harvest/1.0" } });
const d = await r.json();
if (!d.meta) { console.log("RAW:", JSON.stringify(d).slice(0, 500)); process.exit(1); }
console.log(`### "${search}"  [${extra}]  count=${d.meta.count}`);
for (const w of d.results || []) {
  const src = (w.primary_location && w.primary_location.source) || {};
  const auth = (w.authorships || [])
    .map((a) => a.author && a.author.display_name)
    .filter(Boolean)
    .slice(0, 4)
    .join("; ");
  const b = w.biblio || {};
  console.log(
    [
      w.publication_year,
      "|",
      (w.type || "").padEnd(12),
      "|",
      (w.language || "").padEnd(3),
      "|",
      w.title,
      "| AU: " + auth,
      "| SRC: " + (src.display_name || "-"),
      "| vol " + (b.volume || "-") + " iss " + (b.issue || "-") + " p " + (b.first_page || "-") + "-" + (b.last_page || "-"),
      "| DOI: " + (w.doi || "-"),
      "| OA:" + ((w.open_access || {}).is_oa ? "Y" : "N"),
    ].join(" ")
  );
}
