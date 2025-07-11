import { supabase } from "@/integrations/supabase/client";

interface PenilaianData {
  id: string;
  bebas_temuan: boolean;
  tidak_hukuman_disiplin: boolean;
  tidak_pemeriksaan_disiplin: boolean;
  memiliki_inovasi: boolean;
  memiliki_penghargaan: boolean;
  skp_2_tahun_terakhir_baik: boolean;
  skp_peningkatan_prestasi: boolean;
  inovasi_dampak_score: number;
  inspiratif_score: number;
  integritas_moralitas_score: number;
  kerjasama_kolaborasi_score: number;
  kinerja_perilaku_score: number;
  komunikasi_score: number;
  leadership_score: number;
  rekam_jejak_score: number;
  prestasi_score: number;
}

const calculateCorrectScore = (penilaian: PenilaianData): number => {
  // Kriteria Integritas (30%) - WAJIB SEMPURNA
  let integritasScore = 0;
  if (penilaian.bebas_temuan) integritasScore += 10;
  if (penilaian.tidak_hukuman_disiplin) integritasScore += 10;
  if (penilaian.tidak_pemeriksaan_disiplin) integritasScore += 10;

  // Jika integritas tidak sempurna, maksimal score adalah 70%
  if (integritasScore < 30) {
    const partialScore =
      integritasScore +
      (penilaian.skp_2_tahun_terakhir_baik ? 10 : 0) +
      (penilaian.skp_peningkatan_prestasi ? 10 : 0) +
      (penilaian.memiliki_inovasi ? 20 : 0) +
      (penilaian.memiliki_penghargaan ? 10 : 0);
    return Math.min(partialScore, 70);
  }

  // Prestasi & Inovasi (30%) - WAJIB MINIMAL SALAH SATU
  let prestasiScore = 0;
  if (penilaian.memiliki_inovasi) prestasiScore += 20;
  if (penilaian.memiliki_penghargaan) prestasiScore += 10;

  // Kriteria SKP (20%)
  let skpScore = 0;
  if (penilaian.skp_2_tahun_terakhir_baik) skpScore += 10;
  if (penilaian.skp_peningkatan_prestasi) skpScore += 10;

  // Core Values ASN BerAKHLAK (20%) - menggunakan mapping ke score yang ada
  const coreValuesScores = [
    penilaian.kinerja_perilaku_score || 1, // Berorientasi Pelayanan
    penilaian.inspiratif_score || 1, // Akuntabel
    penilaian.integritas_moralitas_score || 1, // Kompeten
    penilaian.kerjasama_kolaborasi_score || 1, // Harmonis
    penilaian.kinerja_perilaku_score || 1, // Loyal
    penilaian.komunikasi_score || 1, // Adaptif
    penilaian.leadership_score || 1, // Kolaboratif
  ];

  const coreValuesAverage =
    coreValuesScores.reduce((sum, score) => sum + score, 0) /
    coreValuesScores.length;
  const coreValuesScore = (coreValuesAverage / 100) * 20; // 20% dari rata-rata core values

  let totalScore = integritasScore + prestasiScore + skpScore + coreValuesScore;

  // Aturan tambahan: Tanpa inovasi ATAU penghargaan, maksimal 85%
  if (!penilaian.memiliki_inovasi && !penilaian.memiliki_penghargaan) {
    totalScore = Math.min(totalScore, 85);
  }

  // Aturan tambahan: Untuk score 90%+, wajib memiliki inovasi DAN penghargaan
  if (
    totalScore >= 90 &&
    (!penilaian.memiliki_inovasi || !penilaian.memiliki_penghargaan)
  ) {
    totalScore = Math.min(totalScore, 89);
  }

  return Math.min(totalScore, 100);
};

export const recalculateAllScores = async () => {
  try {
    // Ambil semua data penilaian
    const { data: penilaianData, error } = await supabase.from("penilaian")
      .select(`
        id,
        bebas_temuan,
        tidak_hukuman_disiplin,
        tidak_pemeriksaan_disiplin,
        memiliki_inovasi,
        memiliki_penghargaan,
        skp_2_tahun_terakhir_baik,
        skp_peningkatan_prestasi,
        inovasi_dampak_score,
        inspiratif_score,
        integritas_moralitas_score,
        kerjasama_kolaborasi_score,
        kinerja_perilaku_score,
        komunikasi_score,
        leadership_score,
        rekam_jejak_score,
        prestasi_score,
        persentase_akhir
      `);

    if (error) throw error;

    if (!penilaianData || penilaianData.length === 0) {
      return {
        success: true,
        updated: 0,
        message: "Tidak ada data penilaian untuk diupdate",
      };
    }

    let updatedCount = 0;
    const results = [];

    for (const penilaian of penilaianData) {
      const newScore = calculateCorrectScore(penilaian);
      const oldScore = penilaian.persentase_akhir || 0;

      // Update jika score berbeda
      if (Math.abs(newScore - oldScore) > 0.1) {
        const { error: updateError } = await supabase
          .from("penilaian")
          .update({ persentase_akhir: newScore })
          .eq("id", penilaian.id);

        if (updateError) {
          results.push({
            id: penilaian.id,
            error: updateError.message,
            oldScore,
            newScore,
          });
        } else {
          updatedCount++;
          results.push({
            id: penilaian.id,
            success: true,
            oldScore,
            newScore,
          });
        }
      }
    }

    return {
      success: true,
      updated: updatedCount,
      total: penilaianData.length,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Terjadi kesalahan",
    };
  }
};

export const getHighScorers = async () => {
  try {
    const { data, error } = await supabase
      .from("penilaian")
      .select(
        `
        id,
        persentase_akhir,
        pegawai:pegawai_id(nama, nip),
        memiliki_inovasi,
        memiliki_penghargaan,
        bebas_temuan,
        tidak_hukuman_disiplin,
        tidak_pemeriksaan_disiplin
      `,
      )
      .gte("persentase_akhir", 90)
      .order("persentase_akhir", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Terjadi kesalahan",
    };
  }
};
