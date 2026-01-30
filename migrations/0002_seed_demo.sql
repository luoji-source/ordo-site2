-- Optional demo content (safe to delete)

INSERT OR IGNORE INTO pages (id, slug, lang, content_json)
VALUES
  ('home-zh','home','zh', json_object(
    'hero', json_object(
      'kicker', 'ORDO',
      'title', '四枚状态标记器（不是书签）',
      'subtitle', '用于回到同一段阅读节奏：继续 / 暂停 / 回返 / 结束。',
      'primaryCtaLabel', '邮件下单',
      'primaryCtaHref', 'mailto:hello@ordo.example?subject=Order',
      'secondaryCtaLabel', '查看产品',
      'secondaryCtaHref', '/zh/products'
    ),
    'whyFour', json_object(
      'title', '为什么是四枚',
      'body', '四个状态对应四种回到阅读的方式。你也可以先用一枚开始。'
    )
  )),
  ('home-en','home','en', json_object(
    'hero', json_object(
      'kicker', 'ORDO',
      'title', 'Four reading-state markers (not a bookmark)',
      'subtitle', 'Return to the same reading rhythm: continue / pause / revisit / finish.',
      'primaryCtaLabel', 'Email to order',
      'primaryCtaHref', 'mailto:hello@ordo.example?subject=Order',
      'secondaryCtaLabel', 'View products',
      'secondaryCtaHref', '/en/products'
    ),
    'whyFour', json_object(
      'title', 'Why four',
      'body', 'Four states map to four ways of returning to reading. You can start with one.'
    )
  ));
