ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS drh_link TEXT;
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS bebas_temuan_link TEXT;
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS tidak_hukuman_disiplin_link TEXT;
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS tidak_pemeriksaan_disiplin_link TEXT;
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS skp_2_tahun_terakhir_baik_link TEXT;
ALTER TABLE pegawai ADD COLUMN IF NOT EXISTS skp_peningkatan_prestasi_link TEXT;

-- Table already added to realtime publication