package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.HospitalEnvironment;
import com.intlmedical.mapper.HospitalEnvironmentMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospital-admin/environments")
@RequiredArgsConstructor
public class HAEnvironmentController {

    private final HospitalEnvironmentMapper hospitalEnvironmentMapper;

    @GetMapping
    public Result<List<HospitalEnvironment>> list() {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        List<HospitalEnvironment> list = hospitalEnvironmentMapper.selectList(
            new LambdaQueryWrapper<HospitalEnvironment>()
                .eq(HospitalEnvironment::getHospitalId, hospitalId)
                .orderByAsc(HospitalEnvironment::getSortOrder));
        return Result.ok(list);
    }

    @PostMapping
    public Result<Void> create(@RequestBody HospitalEnvironment env) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        env.setHospitalId(hospitalId);
        env.setAuditStatus("pending");
        env.setRejectionReason(null);
        hospitalEnvironmentMapper.insert(env);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody HospitalEnvironment env) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        HospitalEnvironment existing = hospitalEnvironmentMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        env.setId(id);
        env.setHospitalId(hospitalId);
        env.setAuditStatus("pending");
        env.setRejectionReason(null);
        hospitalEnvironmentMapper.updateById(env);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        HospitalEnvironment existing = hospitalEnvironmentMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        hospitalEnvironmentMapper.deleteById(id);
        return Result.ok();
    }
}
