DO $$
DECLARE
  v_src text;
  v_id uuid;
  v_ct text;
  v_data text;
BEGIN
  SELECT b->>'src' INTO v_src
  FROM public.site_content sc, jsonb_array_elements(sc.value) b
  WHERE sc.key = 'canvas.blocks' AND b->>'id' = 'block-sxfjfk';

  IF v_src IS NULL OR v_src NOT LIKE 'data:%' THEN
    RETURN;
  END IF;

  v_ct := split_part(substring(v_src from 6), ';', 1);
  v_data := substring(v_src from position(';base64,' in v_src) + 8);

  INSERT INTO public.media_files (content_type, data)
  VALUES (v_ct, v_data)
  RETURNING id INTO v_id;

  UPDATE public.site_content sc
  SET value = (
    SELECT jsonb_agg(
      CASE WHEN b->>'id' = 'block-sxfjfk'
        THEN jsonb_set(b, '{src}', to_jsonb('/api/public/media/' || v_id::text))
        ELSE b END
      ORDER BY ord
    )
    FROM jsonb_array_elements(sc.value) WITH ORDINALITY AS t(b, ord)
  ),
  updated_at = now()
  WHERE sc.key = 'canvas.blocks';
END $$;