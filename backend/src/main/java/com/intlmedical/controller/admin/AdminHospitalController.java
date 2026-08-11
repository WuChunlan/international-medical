package com.intlmedical.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.intlmedical.entity.Hospital;
import com.intlmedical.mapper.HospitalMapper;
import com.intlmedical.service.ContentTranslationService;
import com.intlmedical.util.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/hospitals")
@RequiredArgsConstructor
public class AdminHospitalController {

    private final HospitalMapper hospitalMapper;
    private final ContentTranslationService contentTranslationService;

    @GetMapping
    public Result<IPage<Hospital>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<Hospital> result = hospitalMapper.selectPage(
            new Page<>(page, size),
            new LambdaQueryWrapper<Hospital>().orderByAsc(Hospital::getSortOrder)
        );
        return Result.ok(result);
    }

    @PostMapping
    public Result<Void> create(@RequestBody Hospital hospital) {
        hospitalMapper.insert(hospital);
        contentTranslationService.autoTranslateEntityAsync("hospital", hospital.getId(), Map.of(
            "name", nullSafe(hospital.getNameZh()),
            "intro", nullSafe(hospital.getIntroZh()),
            "address", nullSafe(hospital.getAddressZh())
        ));
        return Result.ok();
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Hospital hospital) {
        hospital.setId(id);
        hospitalMapper.updateById(hospital);
        contentTranslationService.autoTranslateEntityAsync("hospital", id, Map.of(
            "name", nullSafe(hospital.getNameZh()),
            "intro", nullSafe(hospital.getIntroZh()),
            "address", nullSafe(hospital.getAddressZh())
        ));
        return Result.ok();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        hospitalMapper.update(null,
            new LambdaUpdateWrapper<Hospital>()
                .eq(Hospital::getId, id)
                .set(Hospital::getIsActive, 0)
        );
        return Result.ok();
    }

    private static String nullSafe(String s) { return s != null ? s : ""; }
}
