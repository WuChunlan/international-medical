package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.HospitalEnvironment;
import com.intlmedical.mapper.HospitalEnvironmentMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/hospital-environments")
@RequiredArgsConstructor
public class AdminHospitalEnvironmentController {

    private final HospitalEnvironmentMapper hospitalEnvironmentMapper;
    private final ContentTranslationService contentTranslationService;

    @GetMapping
    public Result<List<HospitalEnvironment>> listByHospital(
            @RequestParam Long hospitalId) {
        List<HospitalEnvironment> list = hospitalEnvironmentMapper.selectList(
            new LambdaQueryWrapper<HospitalEnvironment>()
                .eq(HospitalEnvironment::getHospitalId, hospitalId)
                .orderByAsc(HospitalEnvironment::getSortOrder)
        );
        return Result.ok(list);
    }

    @PostMapping
    public Result<Void> create(@RequestBody HospitalEnvironment env) {
        hospitalEnvironmentMapper.insert(env);
        contentTranslationService.autoTranslateEntityAsync("environment", env.getId(), Map.of(
            "name", nullSafe(env.getNameZh()),
            "desc", nullSafe(env.getDescZh())
        ));
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody HospitalEnvironment env) {
        env.setId(id);
        hospitalEnvironmentMapper.updateById(env);
        contentTranslationService.autoTranslateEntityAsync("environment", id, Map.of(
            "name", nullSafe(env.getNameZh()),
            "desc", nullSafe(env.getDescZh())
        ));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        hospitalEnvironmentMapper.deleteById(id);
        return Result.ok();
    }

    private static String nullSafe(String s) { return s != null ? s : ""; }
}
