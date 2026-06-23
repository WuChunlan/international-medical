package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Doctor;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital-admin/doctors")
@RequiredArgsConstructor
public class HADoctorController {

    private final DoctorMapper doctorMapper;

    @GetMapping
    public Result<IPage<Doctor>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        IPage<Doctor> result = doctorMapper.selectPage(new Page<>(page, size),
            new LambdaQueryWrapper<Doctor>()
                .eq(Doctor::getHospitalId, hospitalId)
                .orderByAsc(Doctor::getSortOrder));
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Doctor doctor) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        doctor.setHospitalId(hospitalId);
        doctor.setAuditStatus("pending");
        doctor.setRejectionReason(null);
        doctorMapper.insert(doctor);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Doctor doctor) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        Doctor existing = doctorMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        doctor.setId(id);
        doctor.setHospitalId(hospitalId);
        doctor.setAuditStatus("pending");
        doctor.setRejectionReason(null);
        doctorMapper.updateById(doctor);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        Doctor existing = doctorMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        doctorMapper.deleteById(id);
        return Result.ok();
    }
}
