-- Create ASN Teladan assessment template if not exists
DO $$
DECLARE
    asn_template_id UUID;
    flexing_template_id UUID;
BEGIN
    -- Get or create ASN Teladan template
    SELECT id INTO asn_template_id FROM assessment_templates WHERE assessment_type = 'asn_teladan' LIMIT 1;
    
    IF asn_template_id IS NULL THEN
        INSERT INTO assessment_templates (
            nama_assessment,
            deskripsi,
            assessment_type,
            is_active,
            formula_perhitungan,
            created_at,
            updated_at
        ) VALUES (
            'ASN Teladan (Legacy)',
            'Penilaian ASN Teladan berdasarkan sistem lama dengan kriteria BERAKHLAK dan prestasi kerja',
            'asn_teladan',
            true,
            'weighted_average',
            NOW(),
            NOW()
        ) RETURNING id INTO asn_template_id;
    END IF;

    -- Update existing penilaian records to use ASN Teladan template
    -- Only update records that don't have a valid assessment_template_id
    UPDATE penilaian 
    SET assessment_template_id = asn_template_id
    WHERE assessment_template_id IS NULL 
       OR NOT EXISTS (
           SELECT 1 FROM assessment_templates 
           WHERE assessment_templates.id = penilaian.assessment_template_id
       );

    -- Create assessment criteria for ASN Teladan (only if not exists)
    IF NOT EXISTS (SELECT 1 FROM assessment_criteria WHERE assessment_template_id = asn_template_id) THEN
        INSERT INTO assessment_criteria (
            assessment_template_id,
            kode_kriteria,
            nama_kriteria,
            deskripsi,
            tipe_input,
            is_required,
            bobot,
            min_value,
            max_value,
            urutan,
            created_at
        ) VALUES 
        (
            asn_template_id,
            'BERAKHLAK',
            'Nilai BERAKHLAK',
            'Penilaian berdasarkan nilai-nilai BERAKHLAK (Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif)',
            'number',
            true,
            40,
            0,
            100,
            1,
            NOW()
        ),
        (
            asn_template_id,
            'PRESTASI',
            'Prestasi Kerja',
            'Penilaian prestasi kerja berdasarkan SKP dan pencapaian',
            'number',
            true,
            30,
            0,
            100,
            2,
            NOW()
        ),
        (
            asn_template_id,
            'INOVASI',
            'Inovasi dan Dampak',
            'Penilaian inovasi yang telah dilakukan dan dampaknya',
            'number',
            true,
            20,
            0,
            100,
            3,
            NOW()
        ),
        (
            asn_template_id,
            'LEADERSHIP',
            'Kepemimpinan',
            'Penilaian kemampuan kepemimpinan dan pengaruh positif',
            'number',
            true,
            10,
            0,
            100,
            4,
            NOW()
        );
    END IF;

    -- Create example assessment template for Flexing
    IF NOT EXISTS (SELECT 1 FROM assessment_templates WHERE assessment_type = 'flexing') THEN
        INSERT INTO assessment_templates (
            nama_assessment,
            deskripsi,
            assessment_type,
            is_active,
            formula_perhitungan,
            created_at,
            updated_at
        ) VALUES (
            'Penilaian Pegawai Flexing',
            'Penilaian khusus untuk pegawai yang menunjukkan fleksibilitas dan adaptabilitas tinggi dalam bekerja',
            'flexing',
            true,
            'weighted_average',
            NOW(),
            NOW()
        ) RETURNING id INTO flexing_template_id;

        -- Create assessment criteria for Flexing
        INSERT INTO assessment_criteria (
            assessment_template_id,
            kode_kriteria,
            nama_kriteria,
            deskripsi,
            tipe_input,
            is_required,
            bobot,
            min_value,
            max_value,
            options,
            urutan,
            created_at
        ) VALUES 
        (
            flexing_template_id,
            'ADAPTABILITY',
            'Kemampuan Adaptasi',
            'Seberapa baik pegawai dapat beradaptasi dengan perubahan lingkungan kerja',
            'select',
            true,
            25,
            0,
            100,
            '{"options": [{"value": "sangat_baik", "label": "Sangat Baik"}, {"value": "baik", "label": "Baik"}, {"value": "cukup", "label": "Cukup"}, {"value": "kurang", "label": "Kurang"}], "scoring": {"sangat_baik": 100, "baik": 80, "cukup": 60, "kurang": 40}}',
            1,
            NOW()
        ),
        (
            flexing_template_id,
            'INNOVATION',
            'Inovasi dalam Bekerja',
            'Kemampuan mengembangkan cara kerja baru yang lebih efektif',
            'number',
            true,
            25,
            0,
            100,
            null,
            2,
            NOW()
        ),
        (
            flexing_template_id,
            'COLLABORATION',
            'Kolaborasi Tim',
            'Kemampuan bekerja sama dalam tim yang beragam',
            'number',
            true,
            25,
            0,
            100,
            null,
            3,
            NOW()
        ),
        (
            flexing_template_id,
            'LEARNING',
            'Kemampuan Belajar',
            'Kemauan dan kemampuan untuk terus belajar hal baru',
            'boolean',
            true,
            15,
            0,
            100,
            null,
            4,
            NOW()
        ),
        (
            flexing_template_id,
            'EVIDENCE',
            'Bukti Dokumentasi',
            'Upload dokumen pendukung yang menunjukkan fleksibilitas',
            'file_upload',
            false,
            10,
            0,
            100,
            null,
            5,
            NOW()
        );
    END IF;
END $$;