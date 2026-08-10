package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.Hospital;
import com.intlmedical.entity.PendingChange;
import com.intlmedical.entity.User;
import com.intlmedical.mapper.HospitalMapper;
import com.intlmedical.mapper.PendingChangeMapper;
import com.intlmedical.mapper.UserMapper;
import com.intlmedical.service.PendingChangeService;
import com.intlmedical.util.JwtUtil;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital-admin/hospital")
@RequiredArgsConstructor
public class HAHospitalController {

    private final HospitalMapper hospitalMapper;
    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final PendingChangeMapper pendingChangeMapper;
    private final PendingChangeService pendingChangeService;

    @GetMapping
    public Result<Hospital> get() {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.ok(null);
        Hospital hospital = hospitalMapper.selectById(hospitalId);
        if (hospital != null) {
            PendingChange hpc = pendingChangeMapper.selectByEntity("hospitals", hospitalId);
            hospital.setHasPendingEdit(hpc != null && "pending".equals(hpc.getAuditStatus()));
        }
        return Result.ok(hospital);
    }

    @PostMapping
    public Result<String> create(@RequestBody Hospital hospital) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) return Result.fail(403, "未登录");
        if (SecurityUtil.getCurrentHospitalId() != null) return Result.fail(400, "已绑定医院，不能重复创建");
        hospital.setAuditStatus("pending");
        hospital.setRejectionReason(null);
        hospital.setIsActive(1);
        hospitalMapper.insert(hospital);
        userMapper.update(null, new LambdaUpdateWrapper<User>()
            .eq(User::getId, userId)
            .set(User::getHospitalId, hospital.getId()));
        // Create a pending_changes record so reviewer/admin can approve or reject this new hospital
        try {
            pendingChangeService.submitNewDraftWithEntityId("hospitals", hospital, hospital.getId(), userId);
        } catch (Exception e) {
            // Non-fatal: hospital is created and token is reissued; pending_changes record failed.
            // Reviewer will not see this hospital for approval until the record is created.
        }
        // Reissue token with the new hospitalId so the frontend session is updated
        User user = userMapper.selectById(userId);
        String displayName = (user.getLastName() != null ? user.getLastName() : "")
                           + (user.getFirstName() != null ? user.getFirstName() : "");
        if (displayName.isBlank()) displayName = user.getEmail();
        String newToken = jwtUtil.generateToken(userId, displayName, "hospital_admin", hospital.getId());
        return Result.ok(newToken);
    }

    @PutMapping
    public Result<Void> update(@RequestBody Hospital hospital) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(400, "未绑定医院，请先创建医院");
        Long userId = SecurityUtil.getCurrentUserId();
        // If the hospital was previously rejected (new creation), reset to pending so the
        // reviewer sees it as a fresh submission rather than an edit against an approved record.
        Hospital existing = hospitalMapper.selectById(hospitalId);
        if (existing != null && "rejected".equals(existing.getAuditStatus())) {
            hospitalMapper.update(null, new LambdaUpdateWrapper<Hospital>()
                .eq(Hospital::getId, hospitalId)
                .set(Hospital::getAuditStatus, "pending")
                .set(Hospital::getRejectionReason, null));
        }
        try {
            pendingChangeService.submitEdit("hospitals", hospitalId, hospital, userId);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Result.fail("提交失败，请重试");
        }
        return Result.ok();
    }
}
