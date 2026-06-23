package com.intlmedical.controller.hospitaladmin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Case;
import com.intlmedical.mapper.CaseMapper;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospital-admin/cases")
@RequiredArgsConstructor
public class HACaseController {

    private final CaseMapper caseMapper;

    @GetMapping
    public Result<IPage<Case>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        IPage<Case> result = caseMapper.selectPage(new Page<>(page, size),
            new LambdaQueryWrapper<Case>()
                .eq(Case::getHospitalId, hospitalId)
                .orderByAsc(Case::getSortOrder));
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Case medCase) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        medCase.setHospitalId(hospitalId);
        medCase.setAuditStatus("pending");
        medCase.setRejectionReason(null);
        caseMapper.insert(medCase);
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Case medCase) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        Case existing = caseMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        medCase.setId(id);
        medCase.setHospitalId(hospitalId);
        medCase.setAuditStatus("pending");
        medCase.setRejectionReason(null);
        caseMapper.updateById(medCase);
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Long hospitalId = SecurityUtil.getCurrentHospitalId();
        if (hospitalId == null) return Result.fail(403, "未绑定医院");
        Case existing = caseMapper.selectById(id);
        if (existing == null || !hospitalId.equals(existing.getHospitalId())) {
            return Result.fail(403, "无权操作");
        }
        caseMapper.deleteById(id);
        return Result.ok();
    }
}
