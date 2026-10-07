# Synthetic upgrade fixtures

These are owned test revisions, not published releases or a supported historical
compatibility matrix. `revisions.json` independently varies registry release,
item release, source, CSS customization fallback and cohort declaration. Schema,
protocol and supported customization contract identities stay v1. The executable
sync tests load actual integrity-checked old/incoming package snapshots and
inspect applied/preserved bytes and lock bases. Future contractVersion2 is a
refusal control, not a guessed migration. No reference sources are changed.
