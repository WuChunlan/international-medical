package com.intlmedical.controller.hospitaladmin;

import com.intlmedical.entity.Hospital;
import com.intlmedical.mapper.HospitalMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital-admin/hospital")
@RequiredArgsConstructor
public class HAHospitalController {

    private final HospitalMapper hospitalMapper;

    @GetMapping
    public Result<Hospital> get() {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        Hospital hospital = hospitalMapper.selectById(hospitalId);
        if (hospital == null) return Result.fail(404, "医院不存在");
        return Result.ok(hospital);
    }

    @PutMapping
    public Result<Void> update(@RequestBody Hospital hospital) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        hospital.setId(hospitalId);
        hospital.setAuditStatus("pending");
        hospital.setRejectionReason(null);
        hospitalMapper.updateById(hospital);
        return Result.ok();
    }
}
