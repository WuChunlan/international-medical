package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.dto.response.CaseVO;
import com.intlmedical.entity.Case;
import com.intlmedical.mapper.CaseMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import com.intlmedical.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/cases")
@RequiredArgsConstructor
public class AdminCaseController {

    private final CaseMapper caseMapper;
    private final ContentTranslationService contentTranslationService;

    @GetMapping
    public Result<IPage<CaseVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<CaseVO> result = caseMapper.selectPageWithHospital(new Page<>(page, size));
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Case medCase) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        medCase.setCreatedUser(currentUserId);
        medCase.setUpdatedUser(currentUserId);
        medCase.setAuditStatus("approved");
        medCase.setIsActive(medCase.getIsActive() != null ? medCase.getIsActive() : 1);
        caseMapper.insert(medCase);
        contentTranslationService.autoTranslateEntityAsync("case", medCase.getId(), Map.of(
            "title", nullSafe(medCase.getTitleZh()),
            "summary", nullSafe(medCase.getSummaryZh()),
            "detail", nullSafe(medCase.getDetailZh())
        ));
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Case medCase) {
        Case existing = caseMapper.selectById(id);
        if (existing == null) return Result.fail(404, "案例不存在");
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权编辑他人创建的数据");
        }
        medCase.setId(id);
        medCase.setUpdatedUser(SecurityUtil.getCurrentUserId());
        medCase.setAuditStatus("approved");
        caseMapper.updateById(medCase);
        contentTranslationService.autoTranslateEntityAsync("case", id, Map.of(
            "title", nullSafe(medCase.getTitleZh()),
            "summary", nullSafe(medCase.getSummaryZh()),
            "detail", nullSafe(medCase.getDetailZh())
        ));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        Case existing = caseMapper.selectById(id);
        if (existing == null) return Result.fail(404, "案例不存在");
        if (!SecurityUtil.canEdit(existing.getCreatedUser())) {
            return Result.fail(403, "无权删除他人创建的数据");
        }
        caseMapper.update(null,
            new LambdaUpdateWrapper<Case>()
                .eq(Case::getId, id)
                .set(Case::getIsActive, 0)
                .set(Case::getUpdatedUser, SecurityUtil.getCurrentUserId())
        );
        return Result.ok();
    }

    private static String nullSafe(String s) { return s != null ? s : ""; }
}
