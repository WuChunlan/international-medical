package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Doctor;
import com.intlmedical.entity.PendingChange;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.mapper.PendingChangeMapper;
import com.intlmedical.service.PendingChangeService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hospital-admin/doctors")
@RequiredArgsConstructor
public class HADoctorController {

    private final DoctorMapper doctorMapper;
    private final PendingChangeMapper pendingChangeMapper;
    private final PendingChangeService pendingChangeService;

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
        List<PendingChange> pending = pendingChangeMapper.selectPendingByType("doctors");
        Set<Long> pendingIds = pending.stream()
            .map(PendingChange::getEntityId)
            .collect(Collectors.toSet());
        result.getRecords().forEach(d -> d.setHasPendingEdit(pendingIds.contains(d.getId())));
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
        if ("approved".equals(existing.getAuditStatus())) {
            Long userId = SecurityUtil.getCurrentUserId();
            try {
                pendingChangeService.submitEdit("doctors", id, doctor, userId);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                return Result.fail("提交失败，请重试");
            }
        } else {
            doctor.setId(id);
            doctor.setHospitalId(hospitalId);
            doctor.setAuditStatus("pending");
            doctor.setRejectionReason(null);
            doctorMapper.updateById(doctor);
        }
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
