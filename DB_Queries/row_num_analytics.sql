select r.reg_id,r.created_at,
ROW_NUMBER() OVER (PARTITION BY r.patient_id ORDER BY r.created_at desc) AS row_num
from registration r
where r.patient_id = 4

;