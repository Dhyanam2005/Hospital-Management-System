CREATE OR REPLACE VIEW v_patient_bill_summary as 
SELECT
	    pb.regId,
            sum(CASE 
                WHEN sectionId = 1 THEN pb.Amount
                ELSE 0
            END) as reg_charges,

            sum(CASE 
                WHEN sectionId = 2 THEN pb.Amount
                ELSE 0
            END) as admission_charges
            ,

            sum(CASE 
                WHEN sectionId = 3 THEN pb.Amount
                ELSE 0
            END) as test_charges
            ,

            sum(CASE 
                WHEN sectionId = 4 THEN pb.Amount
                ELSE 0
            END) as medical_charges
            ,

            sum(CASE 
                WHEN sectionId = 5 THEN pb.Amount
                ELSE 0
            END) as services_charges,

            sum(CASE 
                WHEN sectionId = 6 THEN pb.Amount
                ELSE 0
            END) as consultation_charges
            from v_patient_bill pb
	    GROUP BY pb.regId
  