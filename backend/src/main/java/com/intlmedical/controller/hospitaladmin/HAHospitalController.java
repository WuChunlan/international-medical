package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.intlmedical.entity.Hospital;
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
            hospital.setHasPendingEdit(pendingChangeMapper.selectByEntity("hospitals", hospitalId) != null);
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
        Hospital existing = hospitalMapper.selectById(hospitalId);
        if ("approved".equals(existing != null ? existing.getAuditStatus() : null)) {
            Long userId = SecurityUtil.getCurrentUserId();
            try {
                pendingChangeService.submitEdit("hospitals", hospitalId, hospital, userId);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                return Result.fail("提交失败，请重试");
            }
        } else {
            hospital.setId(hospitalId);
            hospital.setAuditStatus("pending");
            hospital.setRejectionReason(null);
            hospitalMapper.updateById(hospital);
        }
        return Result.ok();
    }
}
