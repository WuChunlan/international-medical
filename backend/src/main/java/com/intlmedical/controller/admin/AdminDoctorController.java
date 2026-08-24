package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Doctor;
import com.intlmedical.mapper.DoctorMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/doctors")
@RequiredArgsConstructor
public class AdminDoctorController {

    private final DoctorMapper doctorMapper;
    private final ContentTranslationService contentTranslationService;

    @GetMapping
    public Result<IPage<Doctor>> list(
            @RequestParam(required = false) Long hospitalId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        LambdaQueryWrapper<Doctor> wrapper = new LambdaQueryWrapper<Doctor>()
            .orderByAsc(Doctor::getSortOrder);
        if (hospitalId != null) {
            wrapper.eq(Doctor::getHospitalId, hospitalId);
        }
        IPage<Doctor> result = doctorMapper.selectPage(new Page<>(page, size), wrapper);
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Doctor doctor) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        doctor.setCreatedUser(currentUserId);
        doctor.setUpdatedUser(currentUserId);
        doctor.setAuditStatus("approved");
        doctor.setIsActive(doctor.getIsActive() != null ? doctor.getIsActive() : 1);
        doctorMapper.insert(doctor);
        contentTranslationService.autoTranslateEntityAsync("doctor", doctor.getId(), Map.of(
            "name", nullSafe(doctor.getNameZh()),
            "title", nullSafe(doctor.getTitleZh()),
            "specialty", nullSafe(doctor.getSpecialtyZh()),
            "bio", nullSafe(doctor.getBioZh())
        ));
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Doctor doctor) {
        Doctor existing = doctorMapper.selectById(id);
        if (existing == null) return Result.fail(404, "医生不存在");
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权编辑他人创建的数据");
        }
        doctor.setId(id);
        doctor.setUpdatedUser(SecurityUtil.getCurrentUserId());
        doctor.setAuditStatus("approved");
        doctorMapper.updateById(doctor);
        contentTranslationService.autoTranslateEntityAsync("doctor", id, Map.of(
            "name", nullSafe(doctor.getNameZh()),
            "title", nullSafe(doctor.getTitleZh()),
            "specialty", nullSafe(doctor.getSpecialtyZh()),
            "bio", nullSafe(doctor.getBioZh())
        ));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Doctor existing = doctorMapper.selectById(id);
        if (existing == null) return Result.fail(404, "医生不存在");
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权删除他人创建的数据");
        }
        doctorMapper.update(null,
            new LambdaUpdateWrapper<Doctor>()
                .eq(Doctor::getId, id)
                .set(Doctor::getIsActive, 0)
                .set(Doctor::getUpdatedUser, SecurityUtil.getCurrentUserId())
        );
        return Result.ok();
    }

    private static String nullSafe(String s) { return s != null ? s : ""; }
}
