import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 1,
  prepare: false,
  connect_timeout: 20,
});

try {
  const cols = await sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'publications'
      and column_name in (
        'mux_playback_id','mux_asset_id','media_url','hls_url',
        'processing_status','visibility','est_masque','deleted_at',
        'user_id','content','caption','type','hive_id','thumbnail_url'
      )
    order by column_name
  `;
  console.log("cols:", cols.map((c) => c.column_name).join(", "));

  const buckets = await sql`
    select id, name, public from storage.buckets
  `.catch((e) => [{ err: e.message }]);
  console.log("buckets:", JSON.stringify(buckets));

  const regionCols = await sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'publications'
      and column_name like '%region%'
  `;
  console.log(
    "region cols:",
    regionCols.map((c) => c.column_name).join(", ") || "(none)",
  );
  const extra = await sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'publications'
      and column_name in ('video_source', 'mux_upload_id')
  `;
  console.log(
    "extra cols:",
    extra.map((c) => c.column_name).join(", ") || "(none)",
  );

  const recent = await sql`
    select id, processing_status,
      (media_url is not null) as has_media,
      (mux_playback_id is not null) as has_mux,
      left(coalesce(media_url,''), 60) as media_prefix,
      created_at
    from publications
    order by created_at desc nulls last
    limit 8
  `;
  console.log("recent:", JSON.stringify(recent, null, 2));
} finally {
  await sql.end({ timeout: 2 });
}
